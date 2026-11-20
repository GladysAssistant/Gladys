const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const db = require('../../../models');
const {
  carryForwardAggregates,
  carryForwardBinaryStates,
} = require('../../../lib/device/device.carryForwardAggregates');

const FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e7';
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const NOW = 1635131280000;

// Same shift as device.getDeviceFeaturesAggregates applies to the bounds of its queries
const shiftForQuery = (date) => {
  const shifted = new Date(date.getTime());
  shifted.setMinutes(shifted.getMinutes() - shifted.getTimezoneOffset());
  return shifted;
};

const buildPeriod = (offsetInMs = 0) => {
  const endDate = new Date(NOW - offsetInMs);
  const startDate = new Date(NOW - offsetInMs - ONE_DAY);
  return {
    startDate,
    endDate,
    startDateForQuery: shiftForQuery(startDate),
    endDateForQuery: shiftForQuery(endDate),
  };
};

const aggregatedValue = (date, value) => ({
  created_at: date,
  value,
  max_value: value,
  min_value: value,
  sum_value: value,
  count_value: 1,
});

describe('Device.carryForwardAggregates', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  afterEach(() => {
    sinon.restore();
  });

  it('should draw a setpoint left as it is for months over the whole period, without any query', async () => {
    const queryStub = sinon.spy(db, 'duckDbReadConnectionAllAsync');
    // An MQTT setpoint, alone in its device, set to frost protection at the end of April
    const deviceFeature = {
      id: FEATURE_ID,
      read_only: false,
      last_value: 7,
      last_value_changed: new Date(NOW - 180 * ONE_DAY),
    };
    const period = buildPeriod();
    const values = await carryForwardAggregates({
      deviceFeature,
      values: [],
      ...period,
    });
    expect(values).to.deep.equal([
      {
        created_at: period.startDate,
        value: 7,
        max_value: 7,
        min_value: 7,
        sum_value: 0,
        count_value: 0,
        carried_forward: true,
      },
      {
        created_at: period.endDate,
        value: 7,
        max_value: 7,
        min_value: 7,
        sum_value: 0,
        count_value: 0,
        carried_forward: true,
      },
    ]);
    expect(queryStub.called).to.equal(false);
  });

  it('should start a setpoint changed during the period at the value in force before it', async () => {
    await db.duckDbInsertState(FEATURE_ID, 7, new Date(NOW - 3 * ONE_DAY));
    await db.duckDbInsertState(FEATURE_ID, 19, new Date(NOW - 2 * ONE_HOUR));
    const deviceFeature = {
      id: FEATURE_ID,
      read_only: false,
      last_value: 19,
      last_value_changed: new Date(NOW - 2 * ONE_HOUR),
    };
    const period = buildPeriod();
    const changeDate = new Date(NOW - 2 * ONE_HOUR);
    const values = await carryForwardAggregates({
      deviceFeature,
      values: [aggregatedValue(changeDate, 19)],
      ...period,
    });
    expect(values.map((value) => [value.created_at.getTime(), value.value, value.carried_forward])).to.deep.equal([
      [period.startDate.getTime(), 7, true],
      [changeDate.getTime(), 19, undefined],
      [period.endDate.getTime(), 19, true],
    ]);
  });

  it('should carry the last recorded state, not the last average, at the end of a past period', async () => {
    await db.duckDbInsertState(FEATURE_ID, 18, new Date(NOW - 30 * ONE_HOUR));
    await db.duckDbInsertState(FEATURE_ID, 20, new Date(NOW - 26 * ONE_HOUR));
    // Changed again after the end of the displayed period
    await db.duckDbInsertState(FEATURE_ID, 7, new Date(NOW - ONE_HOUR));
    const deviceFeature = {
      id: FEATURE_ID,
      read_only: false,
      last_value: 7,
      last_value_changed: new Date(NOW - ONE_HOUR),
    };
    // Period from 48h ago to 24h ago
    const period = buildPeriod(ONE_DAY);
    const values = await carryForwardAggregates({
      deviceFeature,
      values: [aggregatedValue(new Date(NOW - 30 * ONE_HOUR), 19)],
      ...period,
    });
    expect(values.map((value) => [value.created_at.getTime(), value.value])).to.deep.equal([
      [NOW - 30 * ONE_HOUR, 19],
      [period.endDate.getTime(), 20],
    ]);
  });

  it('should leave a measure as it is, even with a state recorded before the period', async () => {
    await db.duckDbInsertState(FEATURE_ID, 21, new Date(NOW - 2 * ONE_DAY));
    const queryStub = sinon.spy(db, 'duckDbReadConnectionAllAsync');
    const deviceFeature = {
      id: FEATURE_ID,
      read_only: true,
      last_value: 21,
      last_value_changed: new Date(NOW - 2 * ONE_DAY),
    };
    const middle = new Date(NOW - 12 * ONE_HOUR);
    const values = await carryForwardAggregates({
      deviceFeature,
      values: [aggregatedValue(middle, 21)],
      ...buildPeriod(),
    });
    expect(values).to.deep.equal([aggregatedValue(middle, 21)]);
    expect(queryStub.called).to.equal(false);
  });

  it('should leave a feature as it is when it does not say whether it is set', async () => {
    const deviceFeature = { id: FEATURE_ID, last_value: 21, last_value_changed: new Date(NOW - 2 * ONE_DAY) };
    const values = await carryForwardAggregates({ deviceFeature, values: [], ...buildPeriod() });
    expect(values).to.deep.equal([]);
  });

  it('should read the history when the date of the last change is not valid', async () => {
    await db.duckDbInsertState(FEATURE_ID, 7, new Date(NOW - 3 * ONE_DAY));
    const deviceFeature = { id: FEATURE_ID, read_only: false, last_value: 7, last_value_changed: 'not a date' };
    const period = buildPeriod();
    const values = await carryForwardAggregates({ deviceFeature, values: [], ...period });
    expect(values.map((value) => [value.created_at.getTime(), value.value])).to.deep.equal([
      [period.startDate.getTime(), 7],
      [period.endDate.getTime(), 7],
    ]);
  });

  it('should not add any point when no state was ever recorded', async () => {
    const deviceFeature = {
      id: FEATURE_ID,
      read_only: false,
      last_value: null,
      last_value_changed: null,
    };
    const values = await carryForwardAggregates({
      deviceFeature,
      values: [],
      ...buildPeriod(),
    });
    expect(values).to.deep.equal([]);
  });

  it('should not add an end point when the period already ends with a recorded state', async () => {
    const deviceFeature = {
      id: FEATURE_ID,
      read_only: false,
      last_value: 19,
      last_value_changed: new Date(NOW + ONE_HOUR),
    };
    const period = buildPeriod();
    const values = await carryForwardAggregates({
      deviceFeature,
      values: [aggregatedValue(period.endDate, 19)],
      ...period,
    });
    // Nothing recorded before the period either: the values are unchanged
    expect(values).to.deep.equal([aggregatedValue(period.endDate, 19)]);
  });

  it('should not add an end point when no state is found at the end of the period', async () => {
    // States recorded only after the period, e.g. imported afterwards
    const deviceFeature = {
      id: FEATURE_ID,
      read_only: false,
      last_value: 19,
      last_value_changed: new Date(NOW + ONE_HOUR),
    };
    const period = buildPeriod();
    const middle = new Date(NOW - 12 * ONE_HOUR);
    const values = await carryForwardAggregates({
      deviceFeature,
      values: [aggregatedValue(middle, 19)],
      ...period,
    });
    expect(values).to.deep.equal([aggregatedValue(middle, 19)]);
  });
});

describe('Device.carryForwardBinaryStates', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });

  const switchOn = {
    id: FEATURE_ID,
    type: 'binary',
    last_value: 1,
    last_value_changed: new Date(NOW - 3 * ONE_DAY),
  };

  it('should draw a switch left on for days as one segment over the whole period', async () => {
    const period = buildPeriod();
    const values = await carryForwardBinaryStates({
      deviceFeature: switchOn,
      values: [],
      startDate: period.startDate,
      startDateForQuery: period.startDateForQuery,
    });
    expect(values).to.deep.equal([{ value: 1, created_at: period.startDate, end_time: null, carried_forward: true }]);
  });

  it('should add the state in force before the first change of the period', async () => {
    await db.duckDbInsertState(FEATURE_ID, 1, new Date(NOW - 30 * ONE_HOUR));
    const period = buildPeriod();
    const offAt = new Date(NOW - 10 * ONE_HOUR);
    const values = await carryForwardBinaryStates({
      deviceFeature: { ...switchOn, last_value: 0, last_value_changed: offAt },
      values: [{ value: 0, created_at: offAt, end_time: null }],
      startDate: period.startDate,
      startDateForQuery: period.startDateForQuery,
    });
    expect(values).to.deep.equal([
      { value: 1, created_at: period.startDate, end_time: offAt, carried_forward: true },
      { value: 0, created_at: offAt, end_time: null },
    ]);
  });

  it('should stretch the first segment back when it has the state in force before the period', async () => {
    await db.duckDbInsertState(FEATURE_ID, 1, new Date(NOW - 30 * ONE_HOUR));
    const period = buildPeriod();
    const repeatedAt = new Date(NOW - 20 * ONE_HOUR);
    const offAt = new Date(NOW - 10 * ONE_HOUR);
    const values = await carryForwardBinaryStates({
      deviceFeature: { ...switchOn, last_value: 0, last_value_changed: offAt },
      values: [
        { value: 1, created_at: repeatedAt, end_time: offAt },
        { value: 0, created_at: offAt, end_time: null },
      ],
      startDate: period.startDate,
      startDateForQuery: period.startDateForQuery,
    });
    expect(values).to.deep.equal([
      { value: 1, created_at: period.startDate, end_time: offAt },
      { value: 0, created_at: offAt, end_time: null },
    ]);
  });

  it('should keep every change returned by the query, the most recent included', async () => {
    const period = buildPeriod();
    const offAt = new Date(NOW - 10 * ONE_HOUR);
    const onAt = new Date(NOW - 5 * ONE_HOUR);
    const values = await carryForwardBinaryStates({
      deviceFeature: switchOn,
      values: [
        { value: 0, created_at: offAt, end_time: onAt },
        { value: 1, created_at: onAt, end_time: null },
      ],
      startDate: period.startDate,
      startDateForQuery: period.startDateForQuery,
    });
    expect(values).to.deep.equal([
      { value: 1, created_at: period.startDate, end_time: offAt, carried_forward: true },
      { value: 0, created_at: offAt, end_time: onAt },
      { value: 1, created_at: onAt, end_time: null },
    ]);
  });

  it('should leave the segments as they are when no state was recorded before the period', async () => {
    const period = buildPeriod();
    const onAt = new Date(NOW - 5 * ONE_HOUR);
    const values = await carryForwardBinaryStates({
      deviceFeature: { ...switchOn, last_value_changed: onAt },
      values: [{ value: 1, created_at: onAt, end_time: null }],
      startDate: period.startDate,
      startDateForQuery: period.startDateForQuery,
    });
    expect(values).to.deep.equal([{ value: 1, created_at: onAt, end_time: null }]);
  });
});
