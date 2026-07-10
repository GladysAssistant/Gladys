const EventEmitter = require('events');
const { expect, assert } = require('chai');
const { fake, spy } = require('sinon');

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const LIGHT_BINARY_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
const LIGHT_BRIGHTNESS_FEATURE_ID = 'ce9dc798-b09f-4e51-8c16-311cdebf97cd';
const TEMPERATURE_FEATURE_ID = 'bb1af3b9-f87d-4d9c-b5be-958cd9d28900';
const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const TEST_ROOM_ID = '2398c689-8b47-43cc-ad32-e98d9be098b5';

describe('Device.getDeviceStatesHistory', function Describe() {
  this.timeout(15000);

  let deviceInstance;

  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    await db.duckDbBatchInsertState(LIGHT_BINARY_FEATURE_ID, [
      { value: 0, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 1, created_at: new Date('2025-08-28T15:02:00.000Z') },
    ]);
    await db.duckDbBatchInsertState(TEMPERATURE_FEATURE_ID, [
      { value: 21.5, created_at: new Date('2025-08-28T15:01:00.000Z') },
    ]);
    // State of a feature which no longer exists, should never be returned
    await db.duckDbBatchInsertState('e40a3e0a-2340-4f13-b4e9-e050c78d5dcd', [
      { value: 12, created_at: new Date('2025-08-28T15:03:00.000Z') },
    ]);
  });

  it('should return all states with metadata, most recent first', async () => {
    const states = await deviceInstance.getDeviceStatesHistory();
    expect(states).to.have.lengthOf(3);
    expect(states[0]).to.deep.equal({
      value: 1,
      created_at: new Date('2025-08-28T15:02:00.000Z'),
      device_feature: {
        id: LIGHT_BINARY_FEATURE_ID,
        name: 'Test device feature',
        selector: 'test-device-feature',
        category: 'light',
        type: 'binary',
        unit: null,
      },
      device: {
        name: 'Test device',
        selector: 'test-device',
      },
      room: {
        name: 'Test room',
        selector: 'test-room',
      },
    });
    expect(states[1].device_feature.selector).to.equal('test-temperature-sensor');
    expect(states[1].device_feature.unit).to.equal('celsius');
    expect(states[2].value).to.equal(0);
  });

  it('should return recent states from a narrow time window without a full scan', async () => {
    // States close to "now" are answered by the first (narrowest) time window: the
    // query stops as soon as it has a full page instead of widening to a full scan.
    const now = Date.now();
    await db.duckDbBatchInsertState(LIGHT_BINARY_FEATURE_ID, [
      { value: 1, created_at: new Date(now - 60 * 1000) },
      { value: 0, created_at: new Date(now - 30 * 1000) },
    ]);
    const states = await deviceInstance.getDeviceStatesHistory({ take: 2 });
    expect(states).to.have.lengthOf(2);
    // Most recent first, and the older 2025 states are not returned since the page
    // is already full with more recent states.
    expect(states[0].value).to.equal(0);
    expect(states[1].value).to.equal(1);
  });

  it('should widen the time window until it finds older states', async () => {
    // Nothing is recent here (all states are months old), so the query has to widen
    // its time window all the way to the unbounded one to return them. Unfiltered
    // queries still anchor on the most recently active feature (temperature sensors
    // in the test DB have last_value_changed set to "now"), so this case still widens.
    const states = await deviceInstance.getDeviceStatesHistory({ take: 2 });
    expect(states).to.have.lengthOf(2);
    expect(states[0].value).to.equal(1);
    expect(states[0].created_at).to.deep.equal(new Date('2025-08-28T15:02:00.000Z'));
    expect(states[1].created_at).to.deep.equal(new Date('2025-08-28T15:01:00.000Z'));
  });

  it('should anchor progressive windows on last_value_changed when filtered devices are stale', async () => {
    await db.DeviceFeature.update(
      { last_value_changed: new Date('2025-08-28T15:02:00.000Z') },
      { where: { id: LIGHT_BINARY_FEATURE_ID } },
    );
    const querySpy = spy(db, 'duckDbReadConnectionAllAsync');
    try {
      const states = await deviceInstance.getDeviceStatesHistory({
        categories: 'light',
        take: 2,
        before: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      });
      expect(states).to.have.lengthOf(2);
      expect(states[0].value).to.equal(1);
      expect(states[0].created_at).to.deep.equal(new Date('2025-08-28T15:02:00.000Z'));
      expect(querySpy.callCount).to.equal(1);
    } finally {
      querySpy.restore();
    }
  });

  it('should fall back to before when filtered features have no last_value_changed', async () => {
    await db.DeviceFeature.update(
      { last_value_changed: null },
      { where: { id: [LIGHT_BINARY_FEATURE_ID, LIGHT_BRIGHTNESS_FEATURE_ID] } },
    );
    const before = new Date('2026-01-01T00:00:00.000Z');
    const querySpy = spy(db, 'duckDbReadConnectionAllAsync');
    try {
      const states = await deviceInstance.getDeviceStatesHistory({
        categories: 'light',
        take: 2,
        before: before.toISOString(),
      });
      expect(states).to.have.lengthOf(2);
      const firstWindowLowerBound = new Date(querySpy.firstCall.args[1]);
      expect(firstWindowLowerBound.toISOString()).to.equal(new Date(before.getTime() - ONE_HOUR_IN_MS).toISOString());
    } finally {
      querySpy.restore();
    }
  });

  it('should filter by categories', async () => {
    const states = await deviceInstance.getDeviceStatesHistory({ categories: 'temperature-sensor,humidity-sensor' });
    expect(states).to.have.lengthOf(1);
    expect(states[0].device_feature.category).to.equal('temperature-sensor');
  });

  it('should filter by room', async () => {
    const states = await deviceInstance.getDeviceStatesHistory({ room_id: TEST_ROOM_ID });
    expect(states).to.have.lengthOf(3);
    const statesOtherRoom = await deviceInstance.getDeviceStatesHistory({
      room_id: '0e2b1698-e63c-4784-9fd8-8ac4a9330b3a',
    });
    expect(statesOtherRoom).to.have.lengthOf(0);
  });

  it('should filter by device name search', async () => {
    const states = await deviceInstance.getDeviceStatesHistory({ search: 'TEST DEV' });
    expect(states).to.have.lengthOf(3);
    const noStates = await deviceInstance.getDeviceStatesHistory({ search: 'does-not-exist' });
    expect(noStates).to.have.lengthOf(0);
  });

  it('should paginate with take and before cursor', async () => {
    const firstPage = await deviceInstance.getDeviceStatesHistory({ take: 2 });
    expect(firstPage).to.have.lengthOf(2);
    const secondPage = await deviceInstance.getDeviceStatesHistory({
      take: 2,
      before: new Date(firstPage[1].created_at).toISOString(),
    });
    expect(secondPage).to.have.lengthOf(1);
    expect(secondPage[0].value).to.equal(0);
  });

  it('should not skip states sharing the same created_at when paginating', async () => {
    // Two states of different features at the exact same timestamp
    const sharedDate = new Date('2025-08-28T16:00:00.000Z');
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    await db.duckDbBatchInsertState(LIGHT_BINARY_FEATURE_ID, [{ value: 1, created_at: sharedDate }]);
    await db.duckDbBatchInsertState(TEMPERATURE_FEATURE_ID, [{ value: 21.5, created_at: sharedDate }]);

    const firstPage = await deviceInstance.getDeviceStatesHistory({ take: 1 });
    expect(firstPage).to.have.lengthOf(1);

    const secondPage = await deviceInstance.getDeviceStatesHistory({
      take: 1,
      before: new Date(firstPage[0].created_at).toISOString(),
      before_id: firstPage[0].device_feature.id,
    });
    expect(secondPage).to.have.lengthOf(1);
    // The second state at the same timestamp must be returned, not skipped
    expect(secondPage[0].device_feature.id).to.not.equal(firstPage[0].device_feature.id);
  });

  it('should reject on invalid before date', async () => {
    const promise = deviceInstance.getDeviceStatesHistory({ before: 'not-a-date' });
    await assert.isRejected(promise, 'Invalid "before" date');
  });
});
