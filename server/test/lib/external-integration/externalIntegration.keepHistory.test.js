const { expect } = require('chai');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

const buildDevice = (selector) => ({
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

const findFeature = (device, externalId) => device.features.find((feature) => feature.external_id === externalId);

describe('externalIntegration.getDiscoveredDevices keep_history', () => {
  let externalIntegration;
  let stateManager;
  let service;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, stateManager } = buildSupervisor());
  });

  it('should keep the published keep_history when the device was not created yet', async () => {
    const publishedDevice = buildDevice(service.selector);
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0].features[0]).to.have.property('keep_history', true);
  });

  it('should keep the published keep_history when the created device has no feature', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, { id: 'device-id', features: [] });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0].features[0]).to.have.property('keep_history', true);
  });

  it('should give the user choice priority over the published keep_history', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [{ ...publishedDevice.features[0], id: 'temperature-in-db', keep_history: false }],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0].features[0]).to.have.property('keep_history', false);
  });

  it('should keep the published keep_history of a feature not created yet', async () => {
    const publishedDevice = buildDevice(service.selector);
    const newFeature = {
      name: 'Humidité',
      external_id: `ext:${service.selector}:thermometer:humidity`,
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      min: 0,
      max: 100,
      read_only: true,
      has_feedback: false,
      keep_history: true,
    };
    publishedDevice.features.push(newFeature);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [{ ...publishedDevice.features[0], id: 'temperature-in-db', keep_history: false }],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(findFeature(devices[0], publishedDevice.features[0].external_id)).to.have.property('keep_history', false);
    expect(findFeature(devices[0], newFeature.external_id)).to.have.property('keep_history', true);
  });

  it('should not flag the device as structure changed when only keep_history differs', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [{ ...publishedDevice.features[0], id: 'temperature-in-db', keep_history: false }],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.have.property('structure_changed', false);
  });

  it('should not mutate the in-memory published list', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      features: [{ ...publishedDevice.features[0], id: 'temperature-in-db', keep_history: false }],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    await externalIntegration.getDiscoveredDevices(service.selector);
    const stored = externalIntegration.discoveredDevices.get(service.id);
    expect(stored[0].features[0]).to.have.property('keep_history', true);
  });
});
