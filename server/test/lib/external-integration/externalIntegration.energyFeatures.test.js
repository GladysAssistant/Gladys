const { expect } = require('chai');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

const buildEnergyDevice = (selector) => ({
  name: 'Daikin Altherma',
  external_id: `ext:${selector}:altherma`,
  features: [
    {
      name: 'Consommation totale',
      external_id: `ext:${selector}:altherma:index`,
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
      min: 0,
      max: 100000000000,
      read_only: true,
      has_feedback: false,
      keep_history: true,
    },
  ],
  params: [],
});

const buildTemperatureDevice = (selector) => ({
  name: 'Thermomètre salon',
  external_id: `ext:${selector}:thermometer`,
  features: [
    {
      name: 'Température',
      external_id: `ext:${selector}:thermometer:temperature`,
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      min: -50,
      max: 60,
      read_only: true,
      has_feedback: false,
      keep_history: true,
    },
  ],
  params: [],
});

const findFeature = (device, type) => device.features.find((feature) => feature.type === type);

describe('externalIntegration.getDiscoveredDevices energy features', () => {
  let externalIntegration;
  let stateManager;
  let energyPrice;
  let service;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, stateManager, energyPrice } = buildSupervisor());
  });

  it('should derive the 30-minutes consumption and cost features of a published energy index', async () => {
    await externalIntegration.setDiscoveredDevices(service, [buildEnergyDevice(service.selector)]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices).to.have.lengthOf(1);
    expect(devices[0].features).to.have.lengthOf(3);

    const indexFeature = findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX);
    const consumptionFeature = findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION);
    const costFeature = findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST);

    expect(indexFeature.id).to.be.a('string');
    expect(consumptionFeature).to.not.equal(undefined);
    expect(consumptionFeature.external_id).to.equal(`ext:${service.selector}:altherma:index_consumption`);
    expect(consumptionFeature.category).to.equal(DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR);
    expect(consumptionFeature.unit).to.equal(DEVICE_FEATURE_UNITS.KILOWATT_HOUR);
    expect(consumptionFeature.energy_parent_id).to.equal(indexFeature.id);
    expect(costFeature).to.not.equal(undefined);
    expect(costFeature.external_id).to.equal(`ext:${service.selector}:altherma:index_cost`);
    expect(costFeature.unit).to.equal(DEVICE_FEATURE_UNITS.EURO);
    expect(costFeature.energy_parent_id).to.equal(consumptionFeature.id);
  });

  it('should never publish a feature selector: the core derives it at creation', async () => {
    await externalIntegration.setDiscoveredDevices(service, [buildEnergyDevice(service.selector)]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    devices[0].features.forEach((feature) => {
      expect(feature).to.not.have.property('selector');
    });
  });

  it('should attach the index to the main electric meter when one is configured', async () => {
    energyPrice.getDefaultElectricMeterFeatureId = async () => 'main-meter-feature-id';
    await externalIntegration.setDiscoveredDevices(service, [buildEnergyDevice(service.selector)]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    const indexFeature = findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX);
    expect(indexFeature.energy_parent_id).to.equal('main-meter-feature-id');
  });

  it('should leave a device without energy index untouched and skip the meter lookup', async () => {
    await externalIntegration.setDiscoveredDevices(service, [buildTemperatureDevice(service.selector)]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0].features).to.have.lengthOf(1);
    expect(devices[0].features[0]).to.not.have.property('id');
    expect(energyPrice.getDefaultElectricMeterFeatureId.callCount).to.equal(0);
  });

  it('should not mutate the in-memory published list', async () => {
    const publishedDevice = buildEnergyDevice(service.selector);
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    await externalIntegration.getDiscoveredDevices(service.selector);
    const stored = externalIntegration.discoveredDevices.get(service.id);
    expect(stored[0].features).to.have.lengthOf(1);
    expect(stored[0].features[0]).to.not.have.property('id');
    expect(stored[0].features[0]).to.not.have.property('energy_parent_id');
  });

  it('should flag an already-created device without energy features as structure changed', async () => {
    const publishedDevice = buildEnergyDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [{ ...publishedDevice.features[0], id: 'index-in-db' }],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.have.property('created', true);
    expect(devices[0]).to.have.property('structure_changed', true);
    // the index feature keeps the identity it has in DB
    expect(findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX).id).to.equal('index-in-db');
  });

  it('should reuse the derived features already in DB instead of duplicating them', async () => {
    const publishedDevice = buildEnergyDevice(service.selector);
    const indexExternalId = publishedDevice.features[0].external_id;
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [
        { ...publishedDevice.features[0], id: 'index-in-db', energy_parent_id: 'sub-meter-feature-id' },
        {
          id: 'consumption-in-db',
          name: 'Consommation totale (consumption)',
          external_id: `${indexExternalId}_consumption`,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          read_only: true,
          has_feedback: false,
          keep_history: true,
          min: 0,
          max: 100000000000,
          energy_parent_id: 'index-in-db',
        },
        {
          id: 'cost-in-db',
          name: 'Consommation totale (cost)',
          external_id: `${indexExternalId}_cost`,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          unit: DEVICE_FEATURE_UNITS.EURO,
          read_only: true,
          has_feedback: false,
          keep_history: true,
          min: 0,
          max: 100000000000,
          energy_parent_id: 'consumption-in-db',
        },
      ],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0].features).to.have.lengthOf(3);
    expect(devices[0]).to.have.property('structure_changed', false);
    expect(findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION).id).to.equal(
      'consumption-in-db',
    );
    expect(findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST).id).to.equal(
      'cost-in-db',
    );
    // the sub-meter the user attached the index to is preserved
    expect(findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX).energy_parent_id).to.equal(
      'sub-meter-feature-id',
    );
  });

  it('should bring back a derived feature left without a parent in DB', async () => {
    const publishedDevice = buildEnergyDevice(service.selector);
    const indexExternalId = publishedDevice.features[0].external_id;
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [
        { ...publishedDevice.features[0], id: 'index-in-db' },
        {
          id: 'consumption-in-db',
          name: 'Consommation totale (consumption)',
          external_id: `${indexExternalId}_consumption`,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          min: 0,
          max: 100000000000,
          energy_parent_id: null,
        },
      ],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    const consumptionFeature = findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION);
    expect(consumptionFeature.id).to.equal('consumption-in-db');
    expect(consumptionFeature).to.not.have.property('energy_parent_id');
    // the missing cost feature is derived on top of the existing consumption one
    const costFeature = findFeature(devices[0], DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST);
    expect(costFeature.energy_parent_id).to.equal('consumption-in-db');
  });

  it('should drop a derived feature whose index feature is gone from the publication', async () => {
    const publishedDevice = buildEnergyDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [
        { ...publishedDevice.features[0], id: 'index-in-db' },
        {
          id: 'orphan-consumption',
          name: 'Ancien index (consumption)',
          external_id: `ext:${service.selector}:altherma:old-index_consumption`,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          min: 0,
          max: 100000000000,
          energy_parent_id: 'removed-index',
        },
        {
          id: 'binary-in-db',
          external_id: `ext:${service.selector}:altherma:binary`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
      ],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    const externalIds = devices[0].features.map((feature) => feature.external_id);
    expect(externalIds).to.not.include(`ext:${service.selector}:altherma:old-index_consumption`);
    expect(devices[0].features).to.have.lengthOf(3);
  });
});
