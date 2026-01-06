const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const EventEmitter = require('events');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { SYSTEM_VARIABLE_NAMES, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const brain = {
  addNamedEntity: fake.returns(null),
  removeNamedEntity: fake.returns(null),
};

const variable = {
  getValue: (name) => {
    if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
      return 'Europe/Paris';
    }
    return null;
  },
};

describe('EnergyMonitoring.calculateConsumptionFromIndex', () => {
  let stateManager;
  let serviceManager;
  let device;
  let gladys;
  let energyMonitoring;

  const mockDevice = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Test Energy Device',
    params: [],
    features: [
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        selector: 'test-device-index',
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        energy_parent_id: null,
      },
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        selector: 'test-device-consumption',
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', // Links to the index feature
      },
    ],
  };

  beforeEach(async () => {
    stateManager = new StateManager(event);
    serviceManager = new ServiceManager({}, stateManager);
    device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);

    // Mock device methods
    device.get = fake.returns([mockDevice]);
    device.getDeviceFeatureStates = fake.returns([]);
    device.saveHistoricalState = fake.returns(null);
    device.setParam = fake.returns(null);

    gladys = {
      variable,
      device,
      job: {
        updateProgress: fake.returns(null),
        wrapper: (name, func) => func,
        wrapperDetached: (name, func) => func,
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  });

  describe('Normal case with no ENERGY_INDEX_LAST_PROCESSED', () => {
    it('should calculate consumption from index states when no previous timestamp exists', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      const windowStart = dayjs(testTime)
        .subtract(30, 'minutes')
        .toDate();

      // Mock device with no ENERGY_INDEX_LAST_PROCESSED param
      const deviceWithNoParam = {
        ...mockDevice,
        params: [],
      };
      device.get = fake.returns([deviceWithNoParam]);

      // Mock index states from 30 minutes ago to now
      const mockIndexStates = [
        { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
        { created_at: '2023-10-03T13:35:00.000Z', value: 1005 },
        { created_at: '2023-10-03T13:40:00.000Z', value: 1012 },
        { created_at: '2023-10-03T13:45:00.000Z', value: 1018 },
        { created_at: '2023-10-03T13:50:00.000Z', value: 1025 },
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify getDeviceFeatureStates was called with correct parameters
      assert.calledOnce(device.getDeviceFeatureStates);
      const getStatesCall = device.getDeviceFeatureStates.getCall(0);
      expect(getStatesCall.args[0]).to.equal('test-device-index');
      expect(getStatesCall.args[1].toISOString()).to.equal(windowStart.toISOString());
      expect(getStatesCall.args[2].toISOString()).to.equal(testTime.toISOString());

      // Verify consumption was calculated and saved (25 total: 5+7+6+7)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[0]).to.deep.equal({
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        selector: 'test-device-consumption',
        category: 'energy-sensor',
        type: 'thirty-minutes-consumption',
        energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      });
      expect(saveCall.args[1]).to.equal(25); // Total consumption
      expect(saveCall.args[2].toISOString()).to.equal(testTime.toISOString());

      // Verify last processed timestamp was saved
      assert.calledOnce(device.setParam);
      const setParamCall = device.setParam.getCall(0);
      expect(setParamCall.args[0]).to.deep.equal({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test Energy Device',
        params: [],
        features: [
          {
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            selector: 'test-device-index',
            category: 'energy-sensor',
            type: 'index',
            energy_parent_id: null,
          },
          {
            id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
            selector: 'test-device-consumption',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          },
        ],
      });
      expect(setParamCall.args[1]).to.equal('ENERGY_INDEX_LAST_PROCESSED');
      expect(setParamCall.args[2]).to.equal('2023-10-03T13:50:00.000Z');
    });
  });

  describe('Normal case with existing ENERGY_INDEX_LAST_PROCESSED', () => {
    it('should calculate consumption from last processed timestamp', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      const lastProcessedTime = '2023-10-03T13:45:00.000Z';

      // Mock device with existing ENERGY_INDEX_LAST_PROCESSED param
      const deviceWithParam = {
        ...mockDevice,
        params: [{ name: 'ENERGY_INDEX_LAST_PROCESSED', value: lastProcessedTime }],
      };
      device.get = fake.returns([deviceWithParam]);

      // Mock index states from last processed time to now
      const mockIndexStates = [
        { created_at: '2023-10-03T13:45:00.000Z', value: 1018 },
        { created_at: '2023-10-03T13:50:00.000Z', value: 1025 },
        { created_at: '2023-10-03T13:55:00.000Z', value: 1030 },
        { created_at: '2023-10-03T14:00:00.000Z', value: 1038 },
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify getDeviceFeatureStates was called with last processed timestamp
      assert.calledOnce(device.getDeviceFeatureStates);
      const getStatesCall = device.getDeviceFeatureStates.getCall(0);
      expect(getStatesCall.args[0]).to.equal('test-device-index');
      expect(getStatesCall.args[1].toISOString()).to.equal(new Date(lastProcessedTime).toISOString());
      expect(getStatesCall.args[2].toISOString()).to.equal(testTime.toISOString());

      // Verify consumption was calculated and saved (20 total: 7+5+8)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[1]).to.equal(20); // Total consumption

      // Verify last processed timestamp was updated
      assert.calledOnce(device.setParam);
      const setParamCall = device.setParam.getCall(0);
      expect(setParamCall.args[2]).to.equal('2023-10-03T14:00:00.000Z');
    });
  });

  describe('No index values with no ENERGY_INDEX_LAST_PROCESSED', () => {
    it('should handle case with no index states and no previous timestamp', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Mock device with no ENERGY_INDEX_LAST_PROCESSED param
      const deviceWithNoParam = {
        ...mockDevice,
        params: [],
      };
      device.get = fake.returns([deviceWithNoParam]);

      // Mock empty index states
      device.getDeviceFeatureStates = fake.returns([]);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify getDeviceFeatureStates was called
      assert.calledOnce(device.getDeviceFeatureStates);

      // Verify no consumption was saved (not enough states)
      assert.notCalled(device.saveHistoricalState);

      // Verify no parameter was set (no states to process)
      assert.notCalled(device.setParam);
    });
  });

  describe('No index values with existing ENERGY_INDEX_LAST_PROCESSED', () => {
    it('should handle case with no new index states since last processed time', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      const lastProcessedTime = '2023-10-03T13:45:00.000Z';

      // Mock device with existing ENERGY_INDEX_LAST_PROCESSED param
      const deviceWithParam = {
        ...mockDevice,
        params: [{ name: 'ENERGY_INDEX_LAST_PROCESSED', value: lastProcessedTime }],
      };
      device.get = fake.returns([deviceWithParam]);

      // Mock only the last processed state (no new data since last processed)
      const mockIndexStates = [
        { created_at: lastProcessedTime, value: 1020 }, // The state that was last processed
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify getDeviceFeatureStates was called with last processed timestamp
      assert.calledOnce(device.getDeviceFeatureStates);
      const getStatesCall = device.getDeviceFeatureStates.getCall(0);
      expect(getStatesCall.args[1].toISOString()).to.equal(new Date(lastProcessedTime).toISOString());

      // Verify consumption of 0 was saved (single state, no calculation possible)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[0]).to.deep.equal({
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        selector: 'test-device-consumption',
        category: 'energy-sensor',
        type: 'thirty-minutes-consumption',
        energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      });
      expect(saveCall.args[1]).to.equal(0); // No consumption calculated
      expect(saveCall.args[2].toISOString()).to.equal(testTime.toISOString());

      // Verify last processed timestamp was updated
      assert.calledOnce(device.setParam);
      const setParamCall = device.setParam.getCall(0);
      expect(setParamCall.args[0]).to.deep.equal({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test Energy Device',
        params: [
          {
            name: 'ENERGY_INDEX_LAST_PROCESSED',
            value: lastProcessedTime,
          },
        ],
        features: [
          {
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            selector: 'test-device-index',
            category: 'energy-sensor',
            type: 'index',
            energy_parent_id: null,
          },
          {
            id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
            selector: 'test-device-consumption',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          },
        ],
      });
      expect(setParamCall.args[1]).to.equal('ENERGY_INDEX_LAST_PROCESSED');
      expect(setParamCall.args[2]).to.equal(lastProcessedTime);
    });
  });

  describe('Edge cases', () => {
    it('should handle counter reset (negative consumption)', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      const deviceWithNoParam = {
        ...mockDevice,
        params: [],
      };
      device.get = fake.returns([deviceWithNoParam]);

      // Mock index states with counter reset
      const mockIndexStates = [
        { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
        { created_at: '2023-10-03T13:35:00.000Z', value: 1005 },
        { created_at: '2023-10-03T13:40:00.000Z', value: 10 }, // Counter reset
        { created_at: '2023-10-03T13:45:00.000Z', value: 15 },
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify consumption calculation with counter reset handling (5 + 5 = 10)
      // 5: normal consumption (1005 - 1000)
      // 10: counter reset, don't count value
      // 5: normal consumption (15 - 10)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[1]).to.equal(10); // Total consumption including reset handling
    });

    it('should handle counter reset to zero', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      const deviceWithNoParam = {
        ...mockDevice,
        params: [],
      };
      device.get = fake.returns([deviceWithNoParam]);

      // Mock index states with counter reset to 0
      const mockIndexStates = [
        { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
        { created_at: '2023-10-03T13:35:00.000Z', value: 1005 },
        { created_at: '2023-10-03T13:40:00.000Z', value: 0 }, // Counter reset to 0
        { created_at: '2023-10-03T13:45:00.000Z', value: 8 },
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify consumption calculation with counter reset to 0 (5 + 0 + 8 = 13)
      // 5: normal consumption (1005 - 1000)
      // 0: counter reset, treat current value (0) as consumption since reset
      // 8: normal consumption (8 - 0)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[1]).to.equal(13); // Total consumption including reset handling
    });

    it('should handle single index state (not enough for calculation)', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      const deviceWithNoParam = {
        ...mockDevice,
        params: [],
      };
      device.get = fake.returns([deviceWithNoParam]);

      // Mock single index state
      const mockIndexStates = [{ created_at: '2023-10-03T13:30:00.000Z', value: 1000 }];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify consumption of 0 was saved (single state, no calculation possible)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[0]).to.deep.equal({
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        selector: 'test-device-consumption',
        category: 'energy-sensor',
        type: 'thirty-minutes-consumption',
        energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      });
      expect(saveCall.args[1]).to.equal(0); // No consumption calculated
      expect(saveCall.args[2].toISOString()).to.equal(testTime.toISOString());

      // Verify last processed timestamp was updated
      assert.calledOnce(device.setParam);
      const setParamCall = device.setParam.getCall(0);
      expect(setParamCall.args[0]).to.deep.equal({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Test Energy Device',
        params: [],
        features: [
          {
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            selector: 'test-device-index',
            category: 'energy-sensor',
            type: 'index',
            energy_parent_id: null,
          },
          {
            id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
            selector: 'test-device-consumption',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          },
        ],
      });
      expect(setParamCall.args[1]).to.equal('ENERGY_INDEX_LAST_PROCESSED');
      expect(setParamCall.args[2]).to.equal('2023-10-03T13:30:00.000Z');
    });

    it('should handle devices without both required features', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Mock device with only INDEX feature (missing THIRTY_MINUTES_CONSUMPTION)
      const deviceWithMissingFeature = {
        ...mockDevice,
        features: [
          {
            id: 'd4e5f6a7-b8c9-0123-def1-234567890123',
            selector: 'test-device-index',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            energy_parent_id: null,
          },
          // Missing THIRTY_MINUTES_CONSUMPTION feature
        ],
      };
      device.get = fake.returns([deviceWithMissingFeature]);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify no device feature states were queried (device filtered out)
      assert.notCalled(device.getDeviceFeatureStates);
      assert.notCalled(device.saveHistoricalState);
      assert.notCalled(device.setParam);
    });

    it('should handle devices with both features but no energy_parent_id relationship', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Mock device with both features but consumption doesn't link to index
      const deviceWithoutParentRelationship = {
        ...mockDevice,
        features: [
          {
            id: 'e5f6a7b8-c9d0-1234-ef12-345678901234',
            selector: 'test-device-index',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            energy_parent_id: null,
          },
          {
            id: 'f6a7b8c9-d0e1-2345-f123-456789012345',
            selector: 'test-device-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: null, // Not linked to the index feature
          },
        ],
      };
      device.get = fake.returns([deviceWithoutParentRelationship]);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify no device feature states were queried (device filtered out due to missing relationship)
      assert.notCalled(device.getDeviceFeatureStates);
      assert.notCalled(device.saveHistoricalState);
      assert.notCalled(device.setParam);
    });

    it('should handle devices with multiple index features', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Mock device with two index features, each with its own consumption feature
      const deviceWithMultipleIndexes = {
        id: 'a7b8c9d0-e1f2-3456-1234-567890123456',
        name: 'Multi Index Device',
        params: [],
        features: [
          {
            id: 'b8c9d0e1-f2a3-4567-2345-678901234567',
            selector: 'test-device-index-1',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            energy_parent_id: null,
          },
          {
            id: 'c9d0e1f2-a3b4-5678-3456-789012345678',
            selector: 'test-device-consumption-1',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'b8c9d0e1-f2a3-4567-2345-678901234567',
          },
          {
            id: 'd0e1f2a3-b4c5-6789-4567-890123456789',
            selector: 'test-device-index-2',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            energy_parent_id: null,
          },
          {
            id: 'e1f2a3b4-c5d6-7890-5678-901234567890',
            selector: 'test-device-consumption-2',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'd0e1f2a3-b4c5-6789-4567-890123456789',
          },
        ],
      };
      device.get = fake.returns([deviceWithMultipleIndexes]);
      device.getDeviceFeatureStates = fake.returns([]);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Should process both index/consumption pairs
      // getDeviceFeatureStates should be called twice (once for each index)
      expect(device.getDeviceFeatureStates.callCount).to.equal(2);
    });

    it('should handle SWITCH.ENERGY type as index feature', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      const windowStart = dayjs(testTime)
        .subtract(30, 'minutes')
        .toDate();

      // Mock device with SWITCH.ENERGY as index feature
      const deviceWithSwitchEnergy = {
        id: 'f2a3b4c5-d6e7-8901-6789-012345678901',
        name: 'Switch Energy Device',
        params: [],
        features: [
          {
            id: 'a3b4c5d6-e7f8-9012-7890-123456789012',
            selector: 'test-switch-energy',
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
            energy_parent_id: null,
          },
          {
            id: 'b4c5d6e7-f8a9-0123-8901-234567890123',
            selector: 'test-switch-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'a3b4c5d6-e7f8-9012-7890-123456789012', // Links to the SWITCH.ENERGY feature
          },
        ],
      };
      device.get = fake.returns([deviceWithSwitchEnergy]);

      // Mock states for the SWITCH.ENERGY feature
      device.getDeviceFeatureStates = fake.returns([
        {
          value: 1000,
          created_at: dayjs(windowStart)
            .add(5, 'minutes')
            .toDate(),
        },
        {
          value: 1200,
          created_at: dayjs(windowStart)
            .add(15, 'minutes')
            .toDate(),
        },
      ]);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify the SWITCH.ENERGY feature was processed
      assert.calledOnce(device.getDeviceFeatureStates);
      const getStatesCall = device.getDeviceFeatureStates.getCall(0);
      expect(getStatesCall.args[0]).to.equal('test-switch-energy'); // SWITCH.ENERGY feature selector

      // Verify consumption was calculated and saved
      assert.calledOnce(device.saveHistoricalState);

      // Verify last processed timestamp was saved
      assert.calledOnce(device.setParam);
    });

    it('should retrieve and process switch devices with SWITCH.ENERGY features', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Mock energy sensor device
      const energySensorDevice = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Energy Sensor Device',
        params: [],
        features: [
          {
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            selector: 'energy-sensor-index',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            energy_parent_id: null,
          },
          {
            id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
            selector: 'energy-sensor-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          },
        ],
      };

      // Mock switch device with SWITCH.ENERGY
      const switchDevice = {
        id: 'f2a3b4c5-d6e7-8901-6789-012345678901',
        name: 'Smart Switch Device',
        params: [],
        features: [
          {
            id: 'a3b4c5d6-e7f8-9012-7890-123456789012',
            selector: 'smart-switch-energy',
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
            energy_parent_id: null,
          },
          {
            id: 'b4c5d6e7-f8a9-0123-8901-234567890123',
            selector: 'smart-switch-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'a3b4c5d6-e7f8-9012-7890-123456789012',
          },
        ],
      };

      // Mock device.get to return different devices based on category
      device.get = fake((params) => {
        return [energySensorDevice, switchDevice];
      });

      // Mock states for both devices
      device.getDeviceFeatureStates = fake((selector) => {
        if (selector === 'energy-sensor-index') {
          return [
            { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
            { created_at: '2023-10-03T13:45:00.000Z', value: 1015 },
          ];
        }
        if (selector === 'smart-switch-energy') {
          return [
            { created_at: '2023-10-03T13:30:00.000Z', value: 500 },
            { created_at: '2023-10-03T13:40:00.000Z', value: 525 },
            { created_at: '2023-10-03T13:50:00.000Z', value: 560 },
          ];
        }
        return [];
      });

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify device.get was called once
      expect(device.get.callCount).to.equal(1);
      expect(device.get.getCall(0).args[0]).to.deep.equal({
        device_feature_categories: [
          DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          DEVICE_FEATURE_CATEGORIES.SWITCH,
          DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        ],
      });

      // Verify both devices were processed (getDeviceFeatureStates called twice)
      expect(device.getDeviceFeatureStates.callCount).to.equal(2);
      expect(device.getDeviceFeatureStates.getCall(0).args[0]).to.equal('energy-sensor-index');
      expect(device.getDeviceFeatureStates.getCall(1).args[0]).to.equal('smart-switch-energy');

      // Verify consumption was saved for both devices
      expect(device.saveHistoricalState.callCount).to.equal(2);

      // Verify energy sensor consumption (15 Wh)
      const energySensorSaveCall = device.saveHistoricalState.getCall(0);
      expect(energySensorSaveCall.args[0].selector).to.equal('energy-sensor-consumption');
      expect(energySensorSaveCall.args[1]).to.equal(15);

      // Verify switch consumption (60 Wh: 25 + 35)
      const switchSaveCall = device.saveHistoricalState.getCall(1);
      expect(switchSaveCall.args[0].selector).to.equal('smart-switch-consumption');
      expect(switchSaveCall.args[1]).to.equal(60);

      // Verify last processed timestamp was saved for both devices
      expect(device.setParam.callCount).to.equal(2);
    });

    it('should handle errors during device processing without throwing', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Mock device
      device.get = fake.returns([mockDevice]);

      // Make getDeviceFeatureStates throw an error
      device.getDeviceFeatureStates = fake.throws(new Error('Database error'));

      // Should not throw - error is caught and logged
      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify the function completed without throwing
      // The error was caught in the try-catch block (lines 143-145)
      assert.calledOnce(device.getDeviceFeatureStates);

      // Verify saveHistoricalState was NOT called (because error occurred before that)
      assert.notCalled(device.saveHistoricalState);
    });

    it('should handle TELEINFORMATION.EAST type as index feature', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      const windowStart = dayjs(testTime)
        .subtract(30, 'minutes')
        .toDate();

      // Mock device with TELEINFORMATION.EAST as index feature
      const deviceWithTeleinformation = {
        id: 'g3h4i5j6-k7l8-9012-mnop-qrstuvwxyz01',
        name: 'Teleinformation Device',
        params: [],
        features: [
          {
            id: 'h4i5j6k7-l8m9-0123-nopq-rstuvwxyz012',
            selector: 'test-teleinformation-east',
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
            energy_parent_id: null,
          },
          {
            id: 'i5j6k7l8-m9n0-1234-opqr-stuvwxyz0123',
            selector: 'test-teleinformation-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'h4i5j6k7-l8m9-0123-nopq-rstuvwxyz012', // Links to the TELEINFORMATION.EAST feature
          },
        ],
      };
      device.get = fake.returns([deviceWithTeleinformation]);

      // Mock states for the TELEINFORMATION.EAST feature
      device.getDeviceFeatureStates = fake.returns([
        {
          value: 5000,
          created_at: dayjs(windowStart)
            .add(5, 'minutes')
            .toDate(),
        },
        {
          value: 5250,
          created_at: dayjs(windowStart)
            .add(15, 'minutes')
            .toDate(),
        },
      ]);

      await energyMonitoring.calculateConsumptionFromIndex(testTime, 'job-123');

      // Verify the TELEINFORMATION.EAST feature was processed
      assert.calledOnce(device.getDeviceFeatureStates);
      const getStatesCall = device.getDeviceFeatureStates.getCall(0);
      expect(getStatesCall.args[0]).to.equal('test-teleinformation-east'); // TELEINFORMATION.EAST feature selector

      // Verify consumption was calculated and saved (250 Wh: 5250 - 5000)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[0].selector).to.equal('test-teleinformation-consumption');
      expect(saveCall.args[1]).to.equal(250);

      // Verify last processed timestamp was saved
      assert.calledOnce(device.setParam);
    });

    it('should skip consumption features not in whitelist selectors', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Only provide energy sensor device
      device.get = fake.returns([mockDevice]);

      device.getDeviceFeatureStates = fake((selector) => {
        if (selector === 'test-energy-device-index') {
          return [
            { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
            { created_at: '2023-10-03T14:00:00.000Z', value: 1010 },
          ];
        }
        return [];
      });

      device.saveHistoricalState.resetHistory();

      await energyMonitoring.calculateConsumptionFromIndex(testTime, ['non-matching-selector']);

      expect(device.saveHistoricalState.called).to.equal(false);
    });

    it('should update job progress when jobId is provided', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      device.get = fake.returns([mockDevice]);
      device.getDeviceFeatureStates = fake.returns([
        { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
        { created_at: '2023-10-03T14:00:00.000Z', value: 1010 },
      ]);
      gladys.job.updateProgress.resetHistory();
      await energyMonitoring.calculateConsumptionFromIndex(testTime, undefined, 'job-progress');
      // Two calls: one during processing, one final at 100%
      expect(gladys.job.updateProgress.callCount).to.equal(2);
      const firstCall = gladys.job.updateProgress.getCall(0).args;
      expect(firstCall[0]).to.equal('job-progress');
      expect(firstCall[1]).to.equal(100);
      const finalCall = gladys.job.updateProgress.getCall(1).args;
      expect(finalCall[0]).to.equal('job-progress');
      expect(finalCall[1]).to.equal(100);
    });
  });
});
