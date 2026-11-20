const { expect } = require('chai');
const EventEmitter = require('events');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');
const ServiceManager = require('../../../lib/service');
const db = require('../../../models');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

// a room seeded by the test database
const ROOM_ID = '2398c689-8b47-43cc-ad32-e98d9be098b5';

const buildDevice = (selector, { max = 31 } = {}) => ({
  name: 'Salon',
  external_id: `ext:${selector}:air-conditioner`,
  features: [
    {
      name: 'Temperature',
      external_id: `ext:${selector}:air-conditioner:temperature`,
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      min: 16,
      max,
      read_only: false,
      has_feedback: true,
      keep_history: true,
    },
  ],
  params: [],
});

// what the Discovery screen posts to POST /api/v1/device
const toPostedDevice = (discoveredDevice) => {
  const posted = { ...discoveredDevice };
  delete posted.created;
  delete posted.structure_changed;
  return posted;
};

describe('externalIntegration.getDiscoveredDevices device name', () => {
  let externalIntegration;
  let stateManager;
  let service;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, stateManager } = buildSupervisor());
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should keep the published name when the device was not created yet', async () => {
    await externalIntegration.setDiscoveredDevices(service, [buildDevice(service.selector)]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.have.property('name', 'Salon');
  });

  it('should give the name the user chose priority over the published name', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      name: 'Clim Salon',
      features: [{ ...publishedDevice.features[0], id: 'temperature-in-db' }],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.have.property('name', 'Clim Salon');
  });

  it('should keep the published name when the created device has none', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, { id: 'device-id', features: [] });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.have.property('name', 'Salon');
  });

  it('should not flag the device as structure changed when only the name differs', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      name: 'Clim Salon',
      features: [{ ...publishedDevice.features[0], id: 'temperature-in-db' }],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.have.property('structure_changed', false);
  });

  it('should not rename the device in the in-memory published list', async () => {
    const publishedDevice = buildDevice(service.selector);
    stateManager.setState('deviceByExternalId', publishedDevice.external_id, {
      id: 'device-id',
      name: 'Clim Salon',
      features: [],
    });
    await externalIntegration.setDiscoveredDevices(service, [publishedDevice]);
    await externalIntegration.getDiscoveredDevices(service.selector);
    const stored = externalIntegration.discoveredDevices.get(service.id);
    expect(stored[0]).to.have.property('name', 'Salon');
  });

  it('should keep the name and the room the user chose through the "Update" gesture', async () => {
    const event = new EventEmitter();
    const brain = { addNamedEntity: fake.returns(null), removeNamedEntity: fake.returns(null) };
    const device = new Device(
      event,
      {},
      stateManager,
      new ServiceManager({}, stateManager),
      {},
      {},
      new Job(event),
      brain,
    );

    // the user adds the published device, then renames it and puts it in a room
    const firstPublication = buildDevice(service.selector);
    await externalIntegration.setDiscoveredDevices(service, [firstPublication]);
    const [discovered] = await externalIntegration.getDiscoveredDevices(service.selector);
    const created = await device.create(toPostedDevice(discovered));
    await device.create({ ...created, name: 'Clim Salon', room_id: ROOM_ID });

    // a new version of the integration changes the structure: Discovery offers "Update"
    await externalIntegration.setDiscoveredDevices(service, [buildDevice(service.selector, { max: 30 })]);
    const [toUpdate] = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(toUpdate).to.have.property('structure_changed', true);
    expect(toUpdate).to.have.property('name', 'Clim Salon');

    await device.create(toPostedDevice(toUpdate));

    const deviceInDb = await db.Device.findOne({
      where: { external_id: firstPublication.external_id },
      include: [{ model: db.DeviceFeature, as: 'features' }],
    });
    expect(deviceInDb).to.have.property('name', 'Clim Salon');
    expect(deviceInDb).to.have.property('room_id', ROOM_ID);
    expect(deviceInDb.features[0]).to.have.property('max', 30);
  });
});
