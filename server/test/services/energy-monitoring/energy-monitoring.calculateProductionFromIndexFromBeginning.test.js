const { expect } = require('chai');
const { useFakeTimers, stub } = require('sinon');
const EventEmitter = require('events');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');

describe('EnergyMonitoring.calculateProductionFromIndexFromBeginning', () => {
  let gladys;
  let energyMonitoring;
  let clock;
  let stateManager;
  let serviceManager;
  let device;
  let job;

  // Test device IDs (using proper UUID format)
  const testDeviceId = 'd4e5f6a7-b8c9-0123-def1-234567890abc';
  const testIndexFeatureId = 'e5f6a7b8-c9d0-1234-ef12-345678901bcd';
  const testProductionFeatureId = 'f6a7b8c9-d0e1-2345-f123-456789012cde';

  beforeEach(async () => {
    // Create event emitter and components
    const event = new EventEmitter();
    job = new Job(event);
    stateManager = new StateManager(event);
    serviceManager = new ServiceManager({}, stateManager);

    const brain = {
      addNamedEntity: stub().returns(null),
      removeNamedEntity: stub().returns(null),
    };

    const variable = {
      getValue: (name) => {
        if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
          return 'Europe/Paris';
        }
        return null;
      },
    };

    device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);

    // Create a Gladys instance with real database but mocked components
    gladys = {
      variable,
      device,
      db: {
        duckDbReadConnectionAllAsync: db.duckDbReadConnectionAllAsync.bind(db),
        duckDbWriteConnectionAllAsync: db.duckDbWriteConnectionAllAsync.bind(db),
      },
      job: {
        updateProgress: stub().returns(null),
        wrapper: (name, func) => func,
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    // Create test production device with both INDEX and THIRTY_MINUTES_PRODUCTION features
    await gladys.device.create({
      id: testDeviceId,
      name: 'Test Solar Device',
      selector: 'test-solar-device',
      external_id: 'test-solar-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      features: [
        {
          id: testIndexFeatureId,
          name: 'Production Index',
          selector: 'test-solar-device-index',
          external_id: 'test-solar-index',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 999999,
          last_value: 0,
          energy_parent_id: null,
        },
        {
          id: testProductionFeatureId,
          name: 'Production 30min',
          selector: 'test-solar-device-production',
          external_id: 'test-solar-production',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 999999,
          last_value: 0,
          energy_parent_id: testIndexFeatureId,
        },
      ],
    });
  });

  afterEach(async () => {
    if (clock) {
      clock.restore();
    }
  });

  describe('Basic functionality', () => {
    it('should return null when no devices have both features', async () => {
      // Delete the production feature to test device without both features
      await db.DeviceFeature.destroy({
        where: { id: testProductionFeatureId },
      });

      const result = await energyMonitoring.calculateProductionFromIndexFromBeginning('job-123');

      expect(result).to.equal(null);
    });

    it('should return null when no device states found in database', async () => {
      // No device states inserted, so database should be empty
      const result = await energyMonitoring.calculateProductionFromIndexFromBeginning('job-123');

      expect(result).to.equal(null);
    });

    it('should process windows when device states exist', async () => {
      // Insert some test device states in DuckDB using batch insert
      const baseTime = new Date('2023-10-03T12:00:00.000Z');
      const states = [
        {
          value: 1000,
          created_at: new Date(baseTime.getTime() - 60 * 60 * 1000), // 1 hour ago
        },
        {
          value: 1050,
          created_at: new Date(baseTime.getTime() - 30 * 60 * 1000), // 30 minutes ago
        },
        {
          value: 1100,
          created_at: baseTime,
        },
      ];

      // Insert states into DuckDB using batch insert
      await db.duckDbBatchInsertState(testIndexFeatureId, states);

      // Mock current time to be just after the last state
      clock = useFakeTimers(new Date(baseTime.getTime() + 5 * 60 * 1000)); // 5 minutes after

      await energyMonitoring.calculateProductionFromIndexFromBeginning('job-123');

      // Verify that production states were created
      const productionStates = await db.duckDbReadConnectionAllAsync(
        'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
        testProductionFeatureId,
      );

      expect(productionStates.length).to.be.greaterThan(0);
    });

    it('should reset the production last processed timestamp before recomputing', async () => {
      // Set an existing last-processed param on the device
      const deviceRow = await device.getBySelector('test-solar-device');
      await device.setParam(deviceRow, 'ENERGY_PRODUCTION_INDEX_LAST_PROCESSED', '2023-10-03T12:00:00.000Z');

      const baseTime = new Date('2023-10-03T12:00:00.000Z');
      await db.duckDbBatchInsertState(testIndexFeatureId, [
        { value: 1000, created_at: new Date(baseTime.getTime() - 30 * 60 * 1000) },
        { value: 1060, created_at: baseTime },
      ]);

      clock = useFakeTimers(new Date(baseTime.getTime() + 5 * 60 * 1000));

      await energyMonitoring.calculateProductionFromIndexFromBeginning('job-123');

      // The param was destroyed then re-created during processing: production states
      // must cover the whole history, not just states after the stale timestamp.
      const productionStates = await db.duckDbReadConnectionAllAsync(
        'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
        testProductionFeatureId,
      );

      expect(productionStates.length).to.be.greaterThan(0);
    });

    it('should continue processing windows even when some fail', async () => {
      // Insert test states
      const baseTime = new Date('2023-10-03T10:00:00.000Z');
      const states = [
        { value: 1000, created_at: baseTime },
        {
          value: 1050,
          created_at: new Date(baseTime.getTime() + 30 * 60 * 1000),
        },
      ];

      await db.duckDbBatchInsertState(testIndexFeatureId, states);

      // Mock current time to create multiple windows
      clock = useFakeTimers(new Date('2023-10-03T11:30:00.000Z'));

      // Stub calculateProductionFromIndex to throw error on second call
      let callCount = 0;
      const originalCalculateProductionFromIndex = energyMonitoring.calculateProductionFromIndex;
      energyMonitoring.calculateProductionFromIndex = async (jobId, windowTime) => {
        callCount += 1;
        if (callCount === 2) {
          throw new Error('Simulated error for testing');
        }
        return originalCalculateProductionFromIndex.call(energyMonitoring, jobId, windowTime);
      };

      const result = await energyMonitoring.calculateProductionFromIndexFromBeginning('job-123');

      // Restore original function
      energyMonitoring.calculateProductionFromIndex = originalCalculateProductionFromIndex;

      expect(result).to.equal(null); // Function should complete successfully despite errors

      // Verify that job progress was updated (should be called for each window)
      expect(gladys.job.updateProgress.called).to.equal(true);

      // Should have processed multiple windows (at least 3: 10:00, 10:30, 11:00, 11:30)
      expect(callCount).to.be.at.least(3);
    });
  });
});
