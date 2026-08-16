const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const FEATURE_1_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
const FEATURE_2_ID = 'ce9dc798-b09f-4e51-8c16-311cdebf97cd';

const variable = {
  getValue: fake.resolves(null),
};

const buildStateManager = (deviceFeaturesBySelector, devicesById) => ({
  get: (key, id) => {
    if (key === 'deviceFeature') {
      return deviceFeaturesBySelector[id] || null;
    }
    return devicesById[id];
  },
});

describe('Device.exportStatesToCsv', function Describe() {
  this.timeout(15000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  afterEach(() => {
    sinon.reset();
  });

  it('should export the states of one device feature as CSV', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2.5, created_at: new Date('2025-08-28T15:01:00.000Z') },
      { value: 3, created_at: new Date('2025-08-28T16:00:00.000Z') },
    ]);
    const stateManager = buildStateManager(
      {
        'my-feature': {
          id: FEATURE_1_ID,
          name: 'Temperature',
          unit: 'celsius',
          device_id: 'device-1',
        },
      },
      { 'device-1': { name: 'Living room sensor' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const csv = await deviceInstance.exportStatesToCsv(
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal(
      [
        'date,device,feature,unit,value',
        '2025-08-28T15:00:00.000Z,Living room sensor,Temperature,celsius,1',
        '2025-08-28T15:01:00.000Z,Living room sensor,Temperature,celsius,2.5',
      ].join('\n'),
    );
  });

  it('should export the states of several device features, merged and sorted by date', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 3, created_at: new Date('2025-08-28T15:02:00.000Z') },
    ]);
    await db.duckDbBatchInsertState(FEATURE_2_ID, [{ value: 2, created_at: new Date('2025-08-28T15:01:00.000Z') }]);
    const stateManager = buildStateManager(
      {
        'feature-1': {
          id: FEATURE_1_ID,
          name: 'Temperature',
          unit: 'celsius',
          device_id: 'device-1',
        },
        'feature-2': {
          id: FEATURE_2_ID,
          name: 'Humidity',
          unit: null,
          device_id: 'unknown-device',
        },
      },
      { 'device-1': { name: 'Living room sensor' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const csv = await deviceInstance.exportStatesToCsv(
      ['feature-1', 'feature-2'],
      new Date('2025-08-28T15:00:00.000Z'),
      new Date('2025-08-28T15:30:00.000Z'),
    );
    expect(csv).to.equal(
      [
        'date,device,feature,unit,value',
        '2025-08-28T15:00:00.000Z,Living room sensor,Temperature,celsius,1',
        '2025-08-28T15:01:00.000Z,,Humidity,,2',
        '2025-08-28T15:02:00.000Z,Living room sensor,Temperature,celsius,3',
      ].join('\n'),
    );
  });

  it('should escape separators, quotes and line breaks in the CSV', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [{ value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') }]);
    const stateManager = buildStateManager(
      {
        'my-feature': {
          id: FEATURE_1_ID,
          name: 'Feature "main"\nsecond line',
          unit: 'celsius',
          device_id: 'device-1',
        },
      },
      { 'device-1': { name: 'Kitchen, main' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const csv = await deviceInstance.exportStatesToCsv(
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal(
      [
        'date,device,feature,unit,value',
        '2025-08-28T15:00:00.000Z,"Kitchen, main","Feature ""main""\nsecond line",celsius,1',
      ].join('\n'),
    );
  });

  it('should return only the header when there is no state in the period', async () => {
    const stateManager = buildStateManager(
      {
        'my-feature': {
          id: FEATURE_1_ID,
          name: 'Temperature',
          unit: 'celsius',
          device_id: 'device-1',
        },
      },
      { 'device-1': { name: 'Living room sensor' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const csv = await deviceInstance.exportStatesToCsv(
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal('date,device,feature,unit,value');
  });

  it('should throw BadParameters when no device feature is given', async () => {
    const deviceInstance = new Device(event, {}, buildStateManager({}, {}), {}, {}, variable, job);
    await assert.isRejected(
      deviceInstance.exportStatesToCsv([], '2025-08-28T15:00:00.000Z', '2025-08-28T15:30:00.000Z'),
      'device_features should be a non-empty list of device feature selectors',
    );
  });

  it('should throw BadParameters when device features is not a list', async () => {
    const deviceInstance = new Device(event, {}, buildStateManager({}, {}), {}, {}, variable, job);
    await assert.isRejected(
      deviceInstance.exportStatesToCsv(undefined, '2025-08-28T15:00:00.000Z', '2025-08-28T15:30:00.000Z'),
      'device_features should be a non-empty list of device feature selectors',
    );
  });

  it('should throw BadParameters when the start date is invalid', async () => {
    const deviceInstance = new Device(event, {}, buildStateManager({}, {}), {}, {}, variable, job);
    await assert.isRejected(
      deviceInstance.exportStatesToCsv(['my-feature'], 'not-a-date', '2025-08-28T15:30:00.000Z'),
      'Invalid "start" date: not-a-date',
    );
  });

  it('should throw BadParameters when the end date is invalid', async () => {
    const deviceInstance = new Device(event, {}, buildStateManager({}, {}), {}, {}, variable, job);
    await assert.isRejected(
      deviceInstance.exportStatesToCsv(['my-feature'], '2025-08-28T15:00:00.000Z', 'not-a-date'),
      'Invalid "end" date: not-a-date',
    );
  });

  it('should throw BadParameters when the end date is before the start date', async () => {
    const deviceInstance = new Device(event, {}, buildStateManager({}, {}), {}, {}, variable, job);
    await assert.isRejected(
      deviceInstance.exportStatesToCsv(['my-feature'], '2025-08-28T15:30:00.000Z', '2025-08-28T15:00:00.000Z'),
      'The "end" date should be after the "start" date',
    );
  });

  it('should throw BadParameters when the period contains too many states', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T15:01:00.000Z') },
    ]);
    const stateManager = buildStateManager(
      {
        'my-feature': {
          id: FEATURE_1_ID,
          name: 'Temperature',
          unit: 'celsius',
          device_id: 'device-1',
        },
      },
      { 'device-1': { name: 'Living room sensor' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    deviceInstance.MAX_STATES_TO_EXPORT_IN_CSV = 1;
    await assert.isRejected(
      deviceInstance.exportStatesToCsv(['my-feature'], '2025-08-28T15:00:00.000Z', '2025-08-28T15:30:00.000Z'),
      'This period contains 2 states, which is more than the 1 states that can be exported at once.',
    );
  });

  it('should throw NotFoundError when a device feature does not exist', async () => {
    const deviceInstance = new Device(event, {}, buildStateManager({}, {}), {}, {}, variable, job);
    await assert.isRejected(
      deviceInstance.exportStatesToCsv(['unknown-feature'], '2025-08-28T15:00:00.000Z', '2025-08-28T15:30:00.000Z'),
      'DeviceFeature not found',
    );
  });
});
