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
    // Create an energy price entry with an electric meter device ID
    const electricMeterDeviceId = '7f85c2f8-86cc-4600-84db-6c074dadb4e8';
    const electricMeterFeatureId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    await db.EnergyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-01-01',
      price: 20,
      electric_meter_device_id: electricMeterDeviceId,
    });

    // Set up the device in state manager with an energy sensor feature
    const mockDevice = {
      id: electricMeterDeviceId,
      name: 'Electric Meter',
      selector: 'electric-meter',
      features: [
        {
          id: electricMeterFeatureId,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: 'energy-index',
        },
      ],
    };
    stateManager.setState('deviceById', electricMeterDeviceId, mockDevice);

    // Call the function
    const featureId = await energyPrice.getDefaultElectricMeterFeatureId();

    // Verify the result
    expect(featureId).to.equal(electricMeterFeatureId);
  });

  it('should return null when no energy price exists', async () => {
    // Don't create any energy price entry

    // Call the function
    const featureId = await energyPrice.getDefaultElectricMeterFeatureId();

    // Verify the result is null
    expect(featureId).to.equal(null);
  });
});
