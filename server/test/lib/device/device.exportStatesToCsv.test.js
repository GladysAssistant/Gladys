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

const oneFeatureStateManager = () =>
  buildStateManager(
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

// Follow the cursor like the web client does, and return the reassembled file
// with the chunks it took.
const exportAllChunks = async (deviceInstance, selectors, start, end, maxStates) => {
  const chunks = [];
  let chunk = await deviceInstance.exportStatesToCsv(selectors, start, end, { maxStates });
  chunks.push(chunk);
  while (chunk.next !== null) {
    // eslint-disable-next-line no-await-in-loop
    chunk = await deviceInstance.exportStatesToCsv(selectors, start, end, { maxStates, after: chunk.next });
    chunks.push(chunk);
  }
  const csv = chunks
    .map((c) => c.csv)
    .filter((part) => part.length > 0)
    .join('\n');
  return { csv, chunks };
};

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
    const deviceInstance = new Device(event, {}, oneFeatureStateManager(), {}, {}, variable, job);
    const { csv, next, states } = await deviceInstance.exportStatesToCsv(
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
    expect(next).to.equal(null);
    expect(states).to.equal(2);
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
    const { csv, next } = await deviceInstance.exportStatesToCsv(
      ['feature-1', 'feature-2'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal(
      [
        'date,device,feature,unit,value',
        '2025-08-28T15:00:00.000Z,Living room sensor,Temperature,celsius,1',
        '2025-08-28T15:01:00.000Z,,Humidity,,2',
        '2025-08-28T15:02:00.000Z,Living room sensor,Temperature,celsius,3',
      ].join('\n'),
    );
    expect(next).to.equal(null);
  });

  it('should export a big period in several chunks that reassemble into one file', async () => {
    const states = [];
    for (let index = 0; index < 10; index += 1) {
      states.push({ value: index, created_at: new Date(Date.UTC(2025, 7, 28, 15, index)) });
    }
    await db.duckDbBatchInsertState(FEATURE_1_ID, states);
    const deviceInstance = new Device(event, {}, oneFeatureStateManager(), {}, {}, variable, job);
    const { csv, chunks } = await exportAllChunks(
      deviceInstance,
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T16:00:00.000Z',
      3,
    );
    // 10 states in chunks of 3: the pagination is real
    expect(chunks.length).to.be.greaterThan(3);
    chunks.forEach((chunk, index) => {
      // The header only belongs to the first chunk
      expect(chunk.csv.startsWith('date,device,feature,unit,value')).to.equal(index === 0);
      expect(chunk.states).to.be.at.most(3);
    });
    const lines = csv.split('\n');
    // No state lost, none duplicated, order preserved
    expect(lines).to.have.lengthOf(11);
    lines.slice(1).forEach((line, index) => {
      expect(line).to.equal(
        `${new Date(Date.UTC(2025, 7, 28, 15, index)).toISOString()},Living room sensor,Temperature,celsius,${index}`,
      );
    });
  });

  it('should not split, lose or duplicate states sharing the same date across chunks', async () => {
    // Two features with states at the very same timestamps: the chunk boundary
    // falls inside a same-date group, which the (date, feature) cursor handles.
    const sameDates = [
      new Date('2025-08-28T15:00:00.000Z'),
      new Date('2025-08-28T15:01:00.000Z'),
      new Date('2025-08-28T15:02:00.000Z'),
    ];
    await db.duckDbBatchInsertState(
      FEATURE_1_ID,
      sameDates.map((createdAt, index) => ({ value: index, created_at: createdAt })),
    );
    await db.duckDbBatchInsertState(
      FEATURE_2_ID,
      sameDates.map((createdAt, index) => ({ value: 10 + index, created_at: createdAt })),
    );
    const stateManager = buildStateManager(
      {
        'feature-1': { id: FEATURE_1_ID, name: 'Temperature', unit: 'celsius', device_id: 'device-1' },
        'feature-2': { id: FEATURE_2_ID, name: 'Humidity', unit: 'percent', device_id: 'device-1' },
      },
      { 'device-1': { name: 'Living room sensor' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const { csv } = await exportAllChunks(
      deviceInstance,
      ['feature-1', 'feature-2'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
      2,
    );
    const dataLines = csv.split('\n').slice(1);
    expect(dataLines).to.have.lengthOf(6);
    const values = dataLines.map((line) => Number(line.split(',').pop())).sort((a, b) => a - b);
    expect(values).to.deep.equal([0, 1, 2, 10, 11, 12]);
  });

  it('should cap the size of a chunk to MAX_STATES_PER_CSV_EXPORT_CHUNK', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T15:01:00.000Z') },
      { value: 3, created_at: new Date('2025-08-28T15:02:00.000Z') },
    ]);
    const deviceInstance = new Device(event, {}, oneFeatureStateManager(), {}, {}, variable, job);
    deviceInstance.MAX_STATES_PER_CSV_EXPORT_CHUNK = 2;
    // The caller asks for far more than the cap: the chunk stays bounded.
    const { next, states } = await deviceInstance.exportStatesToCsv(
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
      { maxStates: 1000000 },
    );
    expect(states).to.equal(2);
    expect(next).to.not.equal(null);
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
    const { csv } = await deviceInstance.exportStatesToCsv(
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

  it('should neutralize values a spreadsheet would run as a formula', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [{ value: -1.5, created_at: new Date('2025-08-28T15:00:00.000Z') }]);
    const stateManager = buildStateManager(
      {
        'my-feature': {
          id: FEATURE_1_ID,
          name: '@SUM(A1)',
          unit: '-cmd',
          device_id: 'device-1',
        },
      },
      { 'device-1': { name: '=1+1' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const { csv } = await deviceInstance.exportStatesToCsv(
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal(
      [
        'date,device,feature,unit,value',
        // The negative value stays a number: only text values are prefixed.
        `2025-08-28T15:00:00.000Z,'=1+1,'@SUM(A1),'-cmd,-1.5`,
      ].join('\n'),
    );
  });

  it('should quote values containing a carriage return', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [{ value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') }]);
    const stateManager = buildStateManager(
      {
        'my-feature': {
          id: FEATURE_1_ID,
          name: 'Temperature',
          unit: 'celsius',
          device_id: 'device-1',
        },
      },
      { 'device-1': { name: 'Kitchen\r\nsecond line' } },
    );
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const { csv } = await deviceInstance.exportStatesToCsv(
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal(
      [
        'date,device,feature,unit,value',
        '2025-08-28T15:00:00.000Z,"Kitchen\r\nsecond line",Temperature,celsius,1',
      ].join('\n'),
    );
  });

  it('should export a device feature only once when it is selected several times', async () => {
    await db.duckDbBatchInsertState(FEATURE_1_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T15:01:00.000Z') },
    ]);
    const deviceInstance = new Device(event, {}, oneFeatureStateManager(), {}, {}, variable, job);
    const { csv } = await deviceInstance.exportStatesToCsv(
      ['my-feature', 'my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal(
      [
        'date,device,feature,unit,value',
        '2025-08-28T15:00:00.000Z,Living room sensor,Temperature,celsius,1',
        '2025-08-28T15:01:00.000Z,Living room sensor,Temperature,celsius,2',
      ].join('\n'),
    );
  });

  it('should return only the header when there is no state in the period', async () => {
    const deviceInstance = new Device(event, {}, oneFeatureStateManager(), {}, {}, variable, job);
    const { csv, next, states } = await deviceInstance.exportStatesToCsv(
      ['my-feature'],
      '2025-08-28T15:00:00.000Z',
      '2025-08-28T15:30:00.000Z',
    );
    expect(csv).to.equal('date,device,feature,unit,value');
    expect(next).to.equal(null);
    expect(states).to.equal(0);
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
      deviceInstance.exportStatesToCsv('my-feature', '2025-08-28T15:00:00.000Z', '2025-08-28T15:30:00.000Z'),
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

  it('should throw BadParameters when the cursor is invalid', async () => {
    const deviceInstance = new Device(event, {}, oneFeatureStateManager(), {}, {}, variable, job);
    await assert.isRejected(
      deviceInstance.exportStatesToCsv(['my-feature'], '2025-08-28T15:00:00.000Z', '2025-08-28T15:30:00.000Z', {
        after: { createdAtUs: 'DROP TABLE', deviceFeatureId: FEATURE_1_ID },
      }),
      'Invalid "after" cursor',
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
