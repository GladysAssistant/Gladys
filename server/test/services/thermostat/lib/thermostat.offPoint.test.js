const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, THERMOSTAT_PRESET } = require('../../../../utils/constants');

const OFF_POINT = { day_of_week: 0, time: '18:00', preset: 'off' };
const COMFORT_POINT = { day_of_week: 0, time: '06:30', preset: 'comfort' };

const logger = { debug: fake.returns(null), info: fake.returns(null), warn: fake.returns(null) };

// `schedule`: what getScheduleOfDevice returns, or an Error it rejects with.
const load = ({ schedule = { id: 'programme', transitions: [OFF_POINT] }, point = OFF_POINT } = {}) => {
  const getScheduleOfDevice = schedule instanceof Error ? fake.rejects(schedule) : fake.resolves(schedule);
  const pointInForce = fake.resolves(point);
  const module = proxyquire('../../../../services/thermostat/lib/thermostat.offPoint', {
    './thermostat.scheduleDevice': { getScheduleOfDevice },
    './thermostat.getSchedules': { pointInForce },
    '../../../utils/logger': logger,
  });
  return { ...module, getScheduleOfDevice, pointInForce };
};

// A thermostat on `preset`, carrying the hold params given.
const thermostat = ({ preset = THERMOSTAT_PRESET.SCHEDULE, params = [] } = {}) => ({
  id: 'device-id',
  selector: 'living-room',
  params,
  features: [
    {
      selector: 'living-room:preset',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
      last_value: preset,
    },
  ],
});

const hold = (until) => [
  { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' },
  ...(until === null ? [] : [{ name: 'THERMOSTAT_MANUAL_UNTIL', value: String(until) }]),
];

describe('thermostat.offPoint', () => {
  afterEach(() => {
    sinon.reset();
  });

  describe('offProgramme', () => {
    const { offProgramme } = load();

    it('should be false on a thermostat following its programme', () => {
      expect(offProgramme(thermostat())).to.equal(false);
    });

    it('should be false on a thermostat with no preset feature', () => {
      expect(offProgramme({ id: 'device-id', params: [], features: [] })).to.equal(false);
    });

    it('should be true on a preset picked with no hold', () => {
      expect(offProgramme(thermostat({ preset: THERMOSTAT_PRESET.COMFORT }))).to.equal(true);
    });

    it('should be true while a hold is in force', () => {
      expect(offProgramme(thermostat({ params: hold(Date.now() + 60 * 1000) }))).to.equal(true);
    });

    it('should be true on a hold with no end', () => {
      expect(offProgramme(thermostat({ params: hold(null) }))).to.equal(true);
    });

    // The next pass drops the hold and hands the thermostat back to the
    // programme, preset included (regulateDevice).
    it('should be false on a hold past its end, even with the preset it was armed for', () => {
      const expired = thermostat({ preset: THERMOSTAT_PRESET.COMFORT, params: hold(Date.now() - 10 * 1000) });

      expect(offProgramme(expired)).to.equal(false);
    });
  });

  describe('programmeKeepsOff', () => {
    it('should be true on an Off point of the programme the thermostat follows', async () => {
      const { programmeKeepsOff, pointInForce } = load();

      expect(await programmeKeepsOff(thermostat())).to.equal(true);
      // Resolved from the transitions read with the schedule, in one query.
      assert.calledOnceWithExactly(pointInForce, [OFF_POINT]);
    });

    it('should be false on any other point', async () => {
      const { programmeKeepsOff } = load({ point: COMFORT_POINT });

      expect(await programmeKeepsOff(thermostat())).to.equal(false);
    });

    it('should be false on a programme with no point', async () => {
      const { programmeKeepsOff, pointInForce } = load({ schedule: { id: 'programme' }, point: null });

      expect(await programmeKeepsOff(thermostat())).to.equal(false);
      assert.calledOnceWithExactly(pointInForce, []);
    });

    it('should be false on a thermostat following no programme', async () => {
      const { programmeKeepsOff, pointInForce } = load({ schedule: null });

      expect(await programmeKeepsOff(thermostat())).to.equal(false);
      assert.notCalled(pointInForce);
    });

    it('should be false, without reading the programme, while a hold is in force', async () => {
      const { programmeKeepsOff, getScheduleOfDevice } = load();

      expect(await programmeKeepsOff(thermostat({ params: hold(Date.now() + 60 * 1000) }))).to.equal(false);
      assert.notCalled(getScheduleOfDevice);
    });

    it('should be true over a hold past its end', async () => {
      const { programmeKeepsOff } = load();
      const expired = thermostat({ preset: THERMOSTAT_PRESET.COMFORT, params: hold(Date.now() - 10 * 1000) });

      expect(await programmeKeepsOff(expired)).to.equal(true);
    });

    it('should be false, and say so, when the programme cannot be read', async () => {
      const { programmeKeepsOff } = load({ schedule: new Error('database locked') });

      expect(await programmeKeepsOff(thermostat())).to.equal(false);
      assert.calledOnce(logger.warn);
    });
  });
});
