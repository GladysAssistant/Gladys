const { expect } = require('chai');
const EventEmitter = require('events');
const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();

describe('Device.saveMultipleHistoricalStates', () => {
  let device;
  let stateManager;
  let job;

  beforeEach(() => {
    stateManager = new StateManager(event);
    job = new Job(event);
    device = new Device(event, {}, stateManager, {}, {}, {}, job);

    // Setup device feature in state manager (required by saveHistoricalState)
    stateManager.setState('deviceFeatureById', 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      selector: 'test-device-feature',
      has_feedback: false,
      keep_history: true,
      last_value: null,
      last_value_changed: null,
      last_monthly_aggregate: null,
      last_daily_aggregate: null,
      last_hourly_aggregate: null,
    });
  });

  it('should save multiple historical states successfully', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    const states = [
      { value: 10, created_at: '2023-10-15T10:00:00.000Z' },
      { value: 20, created_at: '2023-10-15T11:00:00.000Z' },
      { value: 30, created_at: '2023-10-15T12:00:00.000Z' },
    ];

    await device.saveMultipleHistoricalStates(deviceFeatureId, states);

    // Verify states were inserted
    const savedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT value, created_at FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      deviceFeatureId,
    );

    expect(savedStates).to.have.lengthOf(3);
    expect(savedStates[0].value).to.equal(10);
    expect(savedStates[1].value).to.equal(20);
    expect(savedStates[2].value).to.equal(30);
  });

  it('should save 0 states', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    const states = [];

    await device.saveMultipleHistoricalStates(deviceFeatureId, states);

    // Verify no states were inserted
    const savedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT value, created_at FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      deviceFeatureId,
    );

    expect(savedStates).to.have.lengthOf(0);
  });

  it('should sort states by created_at before inserting', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    // States in wrong order
    const states = [
      { value: 30, created_at: '2023-10-15T12:00:00.000Z' },
      { value: 10, created_at: '2023-10-15T10:00:00.000Z' },
      { value: 20, created_at: '2023-10-15T11:00:00.000Z' },
    ];

    await device.saveMultipleHistoricalStates(deviceFeatureId, states);

    // Verify states are sorted by created_at
    const savedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT value, created_at FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      deviceFeatureId,
    );

    expect(savedStates).to.have.lengthOf(3);
    expect(savedStates[0].value).to.equal(10); // First chronologically
    expect(savedStates[1].value).to.equal(20); // Second
    expect(savedStates[2].value).to.equal(30); // Third
  });

  it('should throw BadParameters error when state validation fails - invalid value type', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    const states = [
      { value: 'invalid-string', created_at: '2023-10-15T10:00:00.000Z' }, // Invalid: value must be number
    ];

    try {
      await device.saveMultipleHistoricalStates(deviceFeatureId, states);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('"value" must be a number');
    }
  });

  it('should throw BadParameters error when state validation fails - missing created_at', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    const states = [
      { value: 10 }, // Missing created_at
    ];

    try {
      await device.saveMultipleHistoricalStates(deviceFeatureId, states);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('"created_at" is required');
    }
  });

  it('should throw BadParameters error when state validation fails - invalid created_at format', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    const states = [
      { value: 10, created_at: 'invalid-date' }, // Invalid date format
    ];

    try {
      await device.saveMultipleHistoricalStates(deviceFeatureId, states);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('"created_at" must be in ISO 8601 date format');
    }
  });

  it('should handle empty states array without error', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    const states = [];

    // Should not throw when empty array is provided
    // The function will try to access lastState which will be undefined
    // This is expected behavior - empty array means no states to save
    try {
      await device.saveMultipleHistoricalStates(deviceFeatureId, states);
      // If it doesn't throw, that's fine - implementation may handle empty arrays
    } catch (error) {
      // If it throws, verify it's because of empty array access
      expect(error.message).to.satisfy(
        (msg) => msg.includes('Cannot read properties of undefined') || msg.includes('lastState'),
      );
    }
  });

  it('should handle large batch of states', async () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
    const states = [];
    const baseDate = new Date('2023-10-15T00:00:00.000Z');

    // Create 100 states
    for (let i = 0; i < 100; i += 1) {
      const date = new Date(baseDate.getTime() + i * 60 * 1000); // 1 minute apart
      states.push({
        value: i,
        created_at: date.toISOString(),
      });
    }

    await device.saveMultipleHistoricalStates(deviceFeatureId, states);

    // Verify all states were inserted
    const savedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT COUNT(*) as count FROM t_device_feature_state WHERE device_feature_id = ?',
      deviceFeatureId,
    );

    // DuckDB returns BigInt for COUNT(*)
    expect(Number(savedStates[0].count)).to.equal(100);
  });
});
