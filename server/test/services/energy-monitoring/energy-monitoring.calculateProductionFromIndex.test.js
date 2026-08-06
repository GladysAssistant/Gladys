const { fake, assert } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const {
  SYSTEM_VARIABLE_NAMES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');
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

describe('EnergyMonitoring.calculateProductionFromIndex', () => {
  let stateManager;
  let serviceManager;
  let device;
  let gladys;
  let energyMonitoring;

  const mockDevice = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Test Solar Device',
    params: [],
    features: [
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        selector: 'test-device-production-index',
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
        energy_parent_id: null,
      },
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        selector: 'test-device-production',
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
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
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  });

  describe('Normal case with no ENERGY_PRODUCTION_INDEX_LAST_PROCESSED', () => {
    it('should calculate production from index states when no previous timestamp exists', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      const windowStart = dayjs(testTime)
        .subtract(30, 'minutes')
        .toDate();

      // Mock device with no ENERGY_PRODUCTION_INDEX_LAST_PROCESSED param
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

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      // Verify getDeviceFeatureStates was called with correct parameters
      assert.calledOnce(device.getDeviceFeatureStates);
      const getStatesCall = device.getDeviceFeatureStates.getCall(0);
      expect(getStatesCall.args[0]).to.equal('test-device-production-index');
      expect(getStatesCall.args[1].toISOString()).to.equal(windowStart.toISOString());
      expect(getStatesCall.args[2].toISOString()).to.equal(testTime.toISOString());

      // Verify production was calculated and saved (25 total: 5+7+6+7)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[0]).to.deep.equal({
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        selector: 'test-device-production',
        category: 'energy-production-sensor',
        type: 'thirty-minutes-production',
        energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      });
      expect(saveCall.args[1]).to.equal(25); // Total production
      expect(saveCall.args[2].toISOString()).to.equal(testTime.toISOString());

      // Verify last processed timestamp was saved under the production-specific param
      assert.calledOnce(device.setParam);
      const setParamCall = device.setParam.getCall(0);
      expect(setParamCall.args[1]).to.equal('ENERGY_PRODUCTION_INDEX_LAST_PROCESSED');
      expect(setParamCall.args[2]).to.equal('2023-10-03T13:50:00.000Z');
    });
  });

  describe('Unit conversion between index and production', () => {
    it('should convert index deltas to the production unit', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      const deviceWithUnits = {
        ...mockDevice,
        params: [],
        features: [
          {
            ...mockDevice.features[0],
            unit: DEVICE_FEATURE_UNITS.WATT_HOUR,
          },
          {
            ...mockDevice.features[1],
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          },
        ],
      };
      device.get = fake.returns([deviceWithUnits]);

      const mockIndexStates = [
        { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
        { created_at: '2023-10-03T13:45:00.000Z', value: 2500 }, // +1500 Wh => 1.5 kWh
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[1]).to.equal(1.5);
    });
  });

  describe('Normal case with existing ENERGY_PRODUCTION_INDEX_LAST_PROCESSED', () => {
    it('should calculate production from last processed timestamp', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');
      const lastProcessedTime = '2023-10-03T13:45:00.000Z';

      // Mock device with existing ENERGY_PRODUCTION_INDEX_LAST_PROCESSED param
      const deviceWithParam = {
        ...mockDevice,
        params: [{ name: 'ENERGY_PRODUCTION_INDEX_LAST_PROCESSED', value: lastProcessedTime }],
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

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      // Verify getDeviceFeatureStates was called with last processed timestamp
      assert.calledOnce(device.getDeviceFeatureStates);
      const getStatesCall = device.getDeviceFeatureStates.getCall(0);
      expect(getStatesCall.args[1].toISOString()).to.equal(new Date(lastProcessedTime).toISOString());

      // Verify production was calculated and saved (20 total: 7+5+8)
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[1]).to.equal(20); // Total production

      // Verify last processed timestamp was updated
      assert.calledOnce(device.setParam);
      const setParamCall = device.setParam.getCall(0);
      expect(setParamCall.args[2]).to.equal('2023-10-03T14:00:00.000Z');
    });
  });

  describe('No index values', () => {
    it('should not save anything when there are no index states', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      device.get = fake.returns([{ ...mockDevice, params: [] }]);
      device.getDeviceFeatureStates = fake.returns([]);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      assert.calledOnce(device.getDeviceFeatureStates);
      assert.notCalled(device.saveHistoricalState);
      assert.notCalled(device.setParam);
    });
  });

  describe('Edge cases', () => {
    it('should handle counter reset (negative production)', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      device.get = fake.returns([{ ...mockDevice, params: [] }]);

      // Counter resets between the second and third state
      const mockIndexStates = [
        { created_at: '2023-10-03T13:30:00.000Z', value: 1000 },
        { created_at: '2023-10-03T13:40:00.000Z', value: 1010 },
        { created_at: '2023-10-03T13:50:00.000Z', value: 5 }, // reset, not counted
        { created_at: '2023-10-03T13:55:00.000Z', value: 12 },
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      // 10 (1010-1000) + 7 (12-5), the reset delta is skipped
      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[1]).to.equal(17);
    });

    it('should save a zero production with a single index state (not enough for a delta)', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      device.get = fake.returns([{ ...mockDevice, params: [] }]);
      device.getDeviceFeatureStates = fake.returns([{ created_at: '2023-10-03T13:45:00.000Z', value: 1000 }]);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      assert.calledOnce(device.saveHistoricalState);
      const saveCall = device.saveHistoricalState.getCall(0);
      expect(saveCall.args[1]).to.equal(0);

      // The single state still advances the last processed timestamp
      assert.calledOnce(device.setParam);
      const setParamCall = device.setParam.getCall(0);
      expect(setParamCall.args[2]).to.equal('2023-10-03T13:45:00.000Z');
    });

    it('should ignore devices without a linked THIRTY_MINUTES_PRODUCTION feature', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // Index feature only, no production feature
      const deviceWithoutProduction = {
        ...mockDevice,
        features: [mockDevice.features[0]],
      };
      device.get = fake.returns([deviceWithoutProduction]);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      assert.notCalled(device.getDeviceFeatureStates);
      assert.notCalled(device.saveHistoricalState);
    });

    it('should ignore devices whose production feature has no energy_parent_id relationship', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      const deviceWithoutLink = {
        ...mockDevice,
        features: [
          mockDevice.features[0],
          {
            ...mockDevice.features[1],
            energy_parent_id: null,
          },
        ],
      };
      device.get = fake.returns([deviceWithoutLink]);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      assert.notCalled(device.getDeviceFeatureStates);
      assert.notCalled(device.saveHistoricalState);
    });

    it('should NOT pair a production index with a THIRTY_MINUTES_CONSUMPTION feature', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      // A device wrongly configured with a consumption feature linked to a production index
      const deviceWithConsumptionLink = {
        ...mockDevice,
        features: [
          mockDevice.features[0],
          {
            id: 'd4e5f6a7-b8c9-0123-def1-234567890123',
            selector: 'test-device-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          },
        ],
      };
      device.get = fake.returns([deviceWithConsumptionLink]);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      // Production job must not produce anything from that pairing
      assert.notCalled(device.saveHistoricalState);
    });

    it('should handle devices with multiple production index features', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      const secondIndexId = 'e5f6a7b8-c9d0-1234-ef12-345678901234';
      const secondProductionId = 'f6a7b8c9-d0e1-2345-f123-456789012345';
      const deviceWithTwoStrings = {
        ...mockDevice,
        features: [
          ...mockDevice.features,
          {
            id: secondIndexId,
            selector: 'test-device-production-index-2',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
            energy_parent_id: null,
          },
          {
            id: secondProductionId,
            selector: 'test-device-production-2',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
            energy_parent_id: secondIndexId,
          },
        ],
      };
      device.get = fake.returns([deviceWithTwoStrings]);

      const mockIndexStates = [
        { created_at: '2023-10-03T13:30:00.000Z', value: 100 },
        { created_at: '2023-10-03T13:50:00.000Z', value: 110 },
      ];
      device.getDeviceFeatureStates = fake.returns(mockIndexStates);

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      // Both index features are processed independently
      assert.calledTwice(device.getDeviceFeatureStates);
      assert.calledTwice(device.saveHistoricalState);
      expect(device.saveHistoricalState.getCall(0).args[1]).to.equal(10);
      expect(device.saveHistoricalState.getCall(1).args[1]).to.equal(10);
    });

    it('should handle errors during device processing without throwing', async () => {
      const testTime = new Date('2023-10-03T14:00:00.000Z');

      device.get = fake.returns([{ ...mockDevice, params: [] }]);
      device.getDeviceFeatureStates = fake.rejects(new Error('Database error'));

      await energyMonitoring.calculateProductionFromIndex(testTime, 'job-123');

      assert.notCalled(device.saveHistoricalState);
      // Job progress is still updated so the job can finish
      assert.calledOnce(gladys.job.updateProgress);
    });
  });
});
