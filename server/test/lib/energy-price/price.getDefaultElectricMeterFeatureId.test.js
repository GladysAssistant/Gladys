const EventEmitter = require('events');
const { expect } = require('chai');
const db = require('../../../models');
const EnergyPrice = require('../../../lib/energy-price');
const StateManager = require('../../../lib/state');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

const event = new EventEmitter();

describe('EnergyPrice.getDefaultElectricMeterFeatureId', () => {
  let energyPrice;
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager(event);
    energyPrice = new EnergyPrice();
    energyPrice.stateManager = stateManager;
  });

  it('should return the default electric meter feature ID', async () => {
    const electricMeterDevice = await db.Device.create({
      name: 'Electric Meter',
      selector: 'electric-meter-test',
      external_id: 'electric-meter-test-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    });
    const electricMeterFeature = await db.DeviceFeature.create({
      device_id: electricMeterDevice.id,
      name: 'Index',
      selector: 'electric-meter-test-index',
      external_id: 'electric-meter-test:index',
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: 'energy-index',
      read_only: true,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 1000000,
    });

    await db.EnergyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-01-01',
      price: 20,
      electric_meter_device_id: electricMeterDevice.id,
    });

    const mockDevice = {
      id: electricMeterDevice.id,
      name: 'Electric Meter',
      selector: 'electric-meter-test',
      features: [electricMeterFeature.get({ plain: true })],
    };
    stateManager.setState('deviceById', electricMeterDevice.id, mockDevice);

    const featureId = await energyPrice.getDefaultElectricMeterFeatureId();

    expect(featureId).to.equal(electricMeterFeature.id);
  });

  it('should return null when no energy price exists', async () => {
    // Don't create any energy price entry

    // Call the function
    const featureId = await energyPrice.getDefaultElectricMeterFeatureId();

    // Verify the result is null
    expect(featureId).to.equal(null);
  });

  it('should return null when device does not exist in state manager', async () => {
    // Create an energy price entry with an electric meter device ID
    const electricMeterDeviceId = '7f85c2f8-86cc-4600-84db-6c074dadb4e8';
    await db.EnergyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-01-01',
      price: 20,
      electric_meter_device_id: electricMeterDeviceId,
    });

    // Don't set up the device in state manager (simulating deleted device)

    // Call the function
    const featureId = await energyPrice.getDefaultElectricMeterFeatureId();

    // Verify the result is null
    expect(featureId).to.equal(null);
  });

  it('should return null when device has no energy sensor feature', async () => {
    // Create an energy price entry with an electric meter device ID
    const electricMeterDeviceId = '7f85c2f8-86cc-4600-84db-6c074dadb4e8';
    await db.EnergyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-01-01',
      price: 20,
      electric_meter_device_id: electricMeterDeviceId,
    });

    // Set up the device in state manager without an energy sensor feature
    const mockDevice = {
      id: electricMeterDeviceId,
      name: 'Electric Meter',
      selector: 'electric-meter',
      features: [
        {
          id: 'some-other-feature-id',
          category: 'temperature-sensor',
          type: 'decimal',
        },
      ],
    };
    stateManager.setState('deviceById', electricMeterDeviceId, mockDevice);

    // Call the function
    const featureId = await energyPrice.getDefaultElectricMeterFeatureId();

    // Verify the result is null
    expect(featureId).to.equal(null);
  });

  it('should return null when energy sensor feature id is stale in state manager', async () => {
    const electricMeterDeviceId = '7f85c2f8-86cc-4600-84db-6c074dadb4e8';
    await db.EnergyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-01-01',
      price: 20,
      electric_meter_device_id: electricMeterDeviceId,
    });

    const mockDevice = {
      id: electricMeterDeviceId,
      name: 'Electric Meter',
      selector: 'electric-meter',
      features: [
        {
          id: 'stale-feature-id-not-in-db',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: 'energy-index',
        },
      ],
    };
    stateManager.setState('deviceById', electricMeterDeviceId, mockDevice);

    const featureId = await energyPrice.getDefaultElectricMeterFeatureId();

    expect(featureId).to.equal(null);
  });
});
