const sinon = require('sinon');
const { expect } = require('chai');

const { useFakeTimers, stub } = sinon;
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

describe('EnergyMonitoring.calculateConsumptionFromIndexFromBeginning', () => {
  let gladys;
  let energyMonitoring;
  let clock;
  let stateManager;
  let serviceManager;
  let device;
  let job;
  const clearDuckDb = async () => {
    const tables = [
      't_device_feature_state',
      't_device_feature_state_aggregate',
      't_energy_price',
      't_device_feature',
      't_device_param',
      't_device',
    ];
    // Delete children first to avoid FK issues.
    // eslint-disable-next-line no-restricted-syntax
    for (const table of tables) {
      // Ignore errors to avoid breaking tests if a table is absent in a given schema.
      try {
        // eslint-disable-next-line no-await-in-loop
        await db.duckDbWriteConnectionAllAsync(`DELETE FROM ${table}`);
      } catch (e) {
        // ignore
      }
    }
  };

  // Test device IDs (using proper UUID format)
  const testDeviceId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const testIndexFeatureId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  const testConsumptionFeatureId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

  beforeEach(async () => {
    await clearDuckDb();
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
        wrapperDetached: (name, func) => func,
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    // Create test energy device with both INDEX and CONSUMPTION features using gladys.device.create
    await gladys.device.create({
      id: testDeviceId,
      name: 'Test Energy Device',
      selector: 'test-energy-device',
      external_id: 'test-energy-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      features: [
        {
          id: testIndexFeatureId,
          name: 'Energy Index',
          selector: 'test-energy-device-index',
          external_id: 'test-energy-index',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 999999,
          last_value: 0,
          energy_parent_id: null,
        },
        {
          id: testConsumptionFeatureId,
          name: 'Energy Consumption 30min',
          selector: 'test-energy-device-consumption',
          external_id: 'test-energy-consumption',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
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
      clock = null;
    }
    await clearDuckDb();
  });

  describe('Basic functionality', () => {
    it('should return null when no devices have both features', async () => {
      // Delete the consumption feature to test device without both features
      await db.DeviceFeature.destroy({
        where: { id: testConsumptionFeatureId },
      });

      const result = await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-123');

      expect(result).to.equal(null);
    });

    it('should return null when no device states found in database', async () => {
      // No device states inserted, so database should be empty
      const result = await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-123');

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

      await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-123');

      // Verify that consumption states were created
      const consumptionStates = await db.duckDbReadConnectionAllAsync(
        'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
        testConsumptionFeatureId,
      );

      expect(consumptionStates.length).to.be.greaterThan(0);
    });
  });

  describe('SQL query and time window processing', () => {
    it('should find oldest state and generate correct time windows', async () => {
      // Insert test states with known timestamps using batch insert
      const oldestTime = new Date('2023-10-03T10:30:00.000Z');
      const newerTime = new Date('2023-10-03T11:00:00.000Z');

      const states = [
        { value: 1000, created_at: oldestTime },
        { value: 1025, created_at: newerTime },
      ];

      await db.duckDbBatchInsertState(testIndexFeatureId, states);

      // Mock current time to be 1 hour after the newest state
      clock = useFakeTimers(new Date('2023-10-03T12:00:00.000Z'));

      const result = await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-123');

      expect(result).to.equal(null); // Function should complete successfully

      // Verify consumption calculations were made for the time windows
      const consumptionStates = await db.duckDbReadConnectionAllAsync(
        'SELECT value, created_at FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
        testConsumptionFeatureId,
      );

      expect(consumptionStates.length).to.be.greaterThan(0);

      expect(consumptionStates).to.deep.equal([
        { value: 0, created_at: new Date('2023-10-03T10:30:00.000Z') },
        { value: 25, created_at: new Date('2023-10-03T11:00:00.000Z') },
        { value: 0, created_at: new Date('2023-10-03T11:30:00.000Z') },
        { value: 0, created_at: new Date('2023-10-03T12:00:00.000Z') },
      ]);
    });

    it('should handle multiple devices correctly', async () => {
      // Create a second device with energy features
      const testDevice2Id = 'd4e5f6a7-b8c9-0123-def4-567890123456';
      const testIndexFeature2Id = 'e5f6a7b8-c9d0-1234-ef56-78901234567a';
      const testConsumptionFeature2Id = 'f6a7b8c9-d0e1-2345-f678-901234567890';

      await gladys.device.create({
        id: testDevice2Id,
        name: 'Test Energy Device 2',
        selector: 'test-energy-device-2',
        external_id: 'test-energy-device-2-external',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        features: [
          {
            id: testIndexFeature2Id,
            name: 'Energy Index 2',
            selector: 'test-energy-device-2-index',
            external_id: 'test-energy-index-2',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            read_only: true,
            has_feedback: false,
            min: 0,
            max: 999999,
            last_value: 0,
            energy_parent_id: null,
          },
          {
            id: testConsumptionFeature2Id,
            name: 'Energy Consumption 30min 2',
            selector: 'test-energy-device-2-consumption',
            external_id: 'test-energy-consumption-2',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            read_only: true,
            has_feedback: false,
            min: 0,
            max: 999999,
            last_value: 0,
            energy_parent_id: testIndexFeature2Id,
          },
        ],
      });

      // Insert states for both devices with different oldest times
      const device1OldestTime = new Date('2023-10-03T10:00:00.000Z');
      const device2OldestTime = new Date('2023-10-03T09:30:00.000Z'); // This should be the oldest

      // Insert states for first device
      await db.duckDbBatchInsertState(testIndexFeatureId, [
        { value: 1000, created_at: device1OldestTime },
        {
          value: 1200,
          created_at: dayjs(device1OldestTime)
            .add(5, 'minutes')
            .toDate(),
        },
        {
          value: 1500,
          created_at: dayjs(device1OldestTime)
            .add(45, 'minutes')
            .toDate(),
        },
      ]);

      // Insert states for second device
      await db.duckDbBatchInsertState(testIndexFeature2Id, [{ value: 2000, created_at: device2OldestTime }]);

      // Mock current time
      clock = useFakeTimers(new Date('2023-10-03T11:00:00.000Z'));

      const result = await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-123');

      expect(result).to.equal(null); // Function should complete successfully

      // Should process both devices and find the absolute oldest time (device2OldestTime)
      const allConsumptionStatesFeature1 = await db.duckDbReadConnectionAllAsync(
        'SELECT value, created_at FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
        testConsumptionFeatureId,
      );

      expect(allConsumptionStatesFeature1).to.deep.equal([
        {
          value: 0,
          created_at: new Date('2023-10-03T10:00:00.000Z'),
        },
        {
          value: 200,
          created_at: new Date('2023-10-03T10:30:00.000Z'),
        },
        {
          value: 300,
          created_at: new Date('2023-10-03T11:00:00.000Z'),
        },
      ]);

      const allConsumptionStatesFeature2 = await db.duckDbReadConnectionAllAsync(
        'SELECT value, created_at FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
        testConsumptionFeature2Id,
      );

      expect(allConsumptionStatesFeature2).to.deep.equal([
        { value: 0, created_at: new Date('2023-10-03T09:30:00.000Z') },
        { value: 0, created_at: new Date('2023-10-03T10:00:00.000Z') },
        { value: 0, created_at: new Date('2023-10-03T10:30:00.000Z') },
        { value: 0, created_at: new Date('2023-10-03T11:00:00.000Z') },
      ]);
    });
  });

  describe('Progress updates', () => {
    it('should update progress with job id', async () => {
      await db.duckDbBatchInsertState(testIndexFeatureId, [
        { value: 1000, created_at: new Date('2023-10-02T20:00:00.000Z') },
        { value: 1100, created_at: new Date('2023-10-02T20:30:00.000Z') },
      ]);
      clock = useFakeTimers(new Date('2023-10-02T21:10:00.000Z'));
      await energyMonitoring.calculateConsumptionFromIndexFromBeginning(['test-energy-device-consumption'], 'job-123');
      expect(gladys.job.updateProgress.called).to.equal(true);
    });
  });

  describe('Edge cases on params and selectors', () => {
    it('should skip consumption features without selector and still process valid ones', async () => {
      const customDevice = {
        id: 'custom-device',
        name: 'Custom Energy Device',
        params: [],
        features: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            selector: 'custom-index',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            energy_parent_id: null,
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            selector: null,
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: '11111111-1111-1111-1111-111111111111',
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            selector: 'valid-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: '11111111-1111-1111-1111-111111111111',
          },
        ],
      };

      await db.duckDbBatchInsertState('11111111-1111-1111-1111-111111111111', [
        { value: 1000, created_at: new Date('2023-10-03T10:00:00.000Z') },
        { value: 1020, created_at: new Date('2023-10-03T10:30:00.000Z') },
      ]);

      clock = useFakeTimers(new Date('2023-10-03T11:00:00.000Z'));

      const getStub = stub(gladys.device, 'get').returns([customDevice]);
      const destroyFromStub = stub(gladys.device, 'destroyStatesFrom').resolves();
      const destroyBetweenStub = stub(gladys.device, 'destroyStatesBetween').resolves();

      const calls = [];
      const calcStub = stub(energyMonitoring, 'calculateConsumptionFromIndex').callsFake(
        async (windowTime, selectors) => {
          calls.push(selectors);
          return null;
        },
      );

      await energyMonitoring.calculateConsumptionFromIndexFromBeginning(['valid-consumption'], 'job-selectors');

      calcStub.restore();
      destroyFromStub.restore();
      destroyBetweenStub.restore();
      getStub.restore();

      expect(calls.length).to.be.greaterThan(0);
      calls.forEach((selectors) => {
        expect(selectors).to.deep.equal(['valid-consumption']);
      });
    });
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

    // Stub calculateConsumptionFromIndex to throw error on second call
    let callCount = 0;
    const originalCalculateConsumptionFromIndex = energyMonitoring.calculateConsumptionFromIndex;
    energyMonitoring.calculateConsumptionFromIndex = async (jobId, windowTime) => {
      callCount += 1;
      if (callCount === 2) {
        throw new Error('Simulated error for testing');
      }
      return originalCalculateConsumptionFromIndex.call(energyMonitoring, jobId, windowTime);
    };

    const result = await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-123');

    // Restore original function
    energyMonitoring.calculateConsumptionFromIndex = originalCalculateConsumptionFromIndex;

    expect(result).to.equal(null); // Function should complete successfully despite errors

    // Verify that job progress was updated (should be called for each window)
    expect(gladys.job.updateProgress.called).to.equal(true);

    // Should have processed multiple windows (at least 3: 10:00, 10:30, 11:00, 11:30)
    expect(callCount).to.be.at.least(3);
  });

  it('should skip consumption features without selector', async () => {
    // Device with missing selector on consumption feature
    const getStub = stub(gladys.device, 'get').resolves([]);
    clock = useFakeTimers(new Date('2023-10-03T11:00:00.000Z'));
    const calcStub = stub(energyMonitoring, 'calculateConsumptionFromIndex').resolves();
    await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-noselector');
    // No devices to process => calc not called
    expect(calcStub.called).to.equal(false);
    getStub.restore();
    calcStub.restore();
  });

  it('should return null when no oldest state exists (effectiveStartAt falsy)', async () => {
    const deviceWithFeatures = {
      id: 'no-state-device',
      name: 'No State Device',
      features: [
        {
          id: 'no-state-index',
          selector: 'no-state-index',
          external_id: 'no-state-index',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          energy_parent_id: null,
        },
        {
          id: 'no-state-consumption',
          selector: 'no-state-consumption',
          external_id: 'no-state-consumption',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: 'no-state-index',
        },
      ],
    };
    const getStub = stub(gladys.device, 'get').resolves([deviceWithFeatures]);
    const oldestStub = stub(gladys.device, 'getOldestStateFromDeviceFeatures').resolves([]);
    clock = useFakeTimers(new Date('2023-10-03T11:00:00.000Z'));
    const calcStub = stub(energyMonitoring, 'calculateConsumptionFromIndex').resolves();
    const res = await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-nooldest');
    expect(res).to.equal(null);
    expect(calcStub.called).to.equal(false);
    oldestStub.restore();
    getStub.restore();
    calcStub.restore();
  });

  it('should skip consumption features without selector and still process valid ones', async () => {
    const mixedDevice = {
      id: 'device-with-mixed-consumption',
      name: 'Mixed Consumption Device',
      features: [
        {
          id: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
          selector: 'mix-index',
          external_id: 'mix-index',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          energy_parent_id: null,
        },
        {
          id: 'mix-consumption-valid',
          selector: 'mix-consumption-valid',
          external_id: 'mix-consumption-valid',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
        },
        {
          id: 'mix-consumption-missing',
          selector: null,
          external_id: 'mix-consumption-missing',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
        },
      ],
    };
    await db.duckDbBatchInsertState('aaaabbbb-cccc-dddd-eeee-ffffffffffff', [
      { value: 1000, created_at: new Date('2023-10-03T10:00:00.000Z') },
    ]);
    const getStub = stub(gladys.device, 'get').resolves([mixedDevice]);
    const oldestStub = stub(gladys.device, 'getOldestStateFromDeviceFeatures').resolves([
      { oldest_created_at: '2023-10-03T10:00:00.000Z' },
    ]);
    const destroyBetweenStub = stub(gladys.device, 'destroyStatesBetween').resolves();
    const destroyFromStub = stub(gladys.device, 'destroyStatesFrom').resolves();
    const calcStub = stub(energyMonitoring, 'calculateConsumptionFromIndex').resolves();
    clock = useFakeTimers(new Date('2023-10-03T11:00:00.000Z'));
    await energyMonitoring.calculateConsumptionFromIndexFromBeginning([], 'job-mixed');
    // calc called for windows
    expect(calcStub.called).to.equal(true);
    // destroyStatesBetween should not throw even with missing selector feature
    expect(destroyBetweenStub.called || destroyFromStub.called).to.equal(true);
    calcStub.restore();
    destroyFromStub.restore();
    destroyBetweenStub.restore();
    oldestStub.restore();
    getStub.restore();
  });
});
