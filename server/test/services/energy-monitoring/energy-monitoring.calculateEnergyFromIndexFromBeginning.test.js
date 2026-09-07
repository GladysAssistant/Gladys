const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const { expect } = require('chai');

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { SYSTEM_VARIABLE_NAMES, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const variable = {
  getValue: (name) => {
    if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
      return 'Europe/Paris';
    }
    return null;
  },
};

describe('EnergyMonitoring.calculateEnergyFromIndexFromBeginning', () => {
  let device;
  let gladys;
  let energyMonitoring;
  let calculateConsumptionFromIndex;

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

  beforeEach(() => {
    // Oldest state 90 minutes ago => a handful of 30-minute windows to process
    const oldestStateTime = new Date(Date.now() - 90 * 60 * 1000);

    device = {
      get: fake.resolves([mockDevice]),
      destroyParam: fake.resolves(null),
      getOldestStateFromDeviceFeatures: fake.resolves([{ oldest_created_at: oldestStateTime.toISOString() }]),
    };

    gladys = {
      variable,
      device,
      job: {
        updateProgress: fake.resolves(null),
        wrapper: (name, func) => func,
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    calculateConsumptionFromIndex = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = calculateConsumptionFromIndex;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should keep processing the remaining windows when a job progress update fails', async () => {
    // Every progress update rejects: no window should be lost because of it
    gladys.job.updateProgress = fake.rejects(new Error('progress update failed'));

    const result = await energyMonitoring.calculateConsumptionFromIndexFromBeginning('job-123');

    expect(result).to.equal(null);

    // All generated windows were still processed despite the failing progress updates
    expect(calculateConsumptionFromIndex.callCount).to.be.at.least(2);
    expect(gladys.job.updateProgress.callCount).to.equal(calculateConsumptionFromIndex.callCount);
  });

  it('should destroy the legacy and per-feature cursors before recomputing', async () => {
    await energyMonitoring.calculateConsumptionFromIndexFromBeginning('job-123');

    assert.calledWith(device.destroyParam, mockDevice, 'ENERGY_INDEX_LAST_PROCESSED');
    assert.calledWith(
      device.destroyParam,
      mockDevice,
      'ENERGY_INDEX_LAST_PROCESSED_b2c3d4e5-f6a7-8901-bcde-f12345678901',
    );
  });

  it('should skip index features without a linked thirty-minutes feature', async () => {
    const deviceWithUnlinkedIndex = {
      ...mockDevice,
      features: [
        {
          id: 'd4e5f6a7-b8c9-0123-def1-234567890123',
          selector: 'test-device-unlinked-index',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          energy_parent_id: null,
        },
        {
          id: 'e5f6a7b8-c9d0-1234-ef12-345678901234',
          selector: 'test-device-unlinked-consumption',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: null, // Not linked to the index feature
        },
      ],
    };
    device.get = fake.resolves([deviceWithUnlinkedIndex]);

    const result = await energyMonitoring.calculateConsumptionFromIndexFromBeginning('job-123');

    expect(result).to.equal(null);

    // The unlinked device is filtered out entirely: no cursor reset, no window processed
    assert.notCalled(device.destroyParam);
    assert.notCalled(device.getOldestStateFromDeviceFeatures);
    assert.notCalled(calculateConsumptionFromIndex);
  });
});
