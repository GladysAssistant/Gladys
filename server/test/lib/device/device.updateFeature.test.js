const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

const SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';
const PLUG_INDEX_ID = '9d1a2b3c-4e5f-4a6b-8c7d-0e1f2a3b4c5d';

const energyFeature = (externalId, type, extra = {}) => ({
  external_id: externalId,
  selector: externalId,
  name: externalId,
  read_only: true,
  has_feedback: false,
  min: 0,
  max: 100000,
  category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  type,
  ...extra,
});

describe('Device.updateFeature', () => {
  let device;
  let stateManager;
  let meterIndex;
  let plugIndex;
  let plugConsumption;
  let thirdIndex;

  beforeEach(async () => {
    stateManager = new StateManager(event);
    const serviceManager = {
      getLocalServiceByName: fake.resolves({ id: 'service-id' }),
      getService: fake.returns(null), // Mock getService method used by device.add
    };
    const brain = {
      addNamedEntity: fake.returns(null),
      removeNamedEntity: fake.returns(null),
    };
    device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const saveDevice = (name, features) =>
      device.create({ service_id: SERVICE_ID, name, external_id: name, selector: name, features });
    const meter = await saveDevice('meter', [energyFeature('meter-index', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX)]);
    const plug = await saveDevice('plug', [
      energyFeature('plug-index', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX, { id: PLUG_INDEX_ID }),
      energyFeature('plug-index_consumption', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION, {
        energy_parent_id: PLUG_INDEX_ID,
      }),
    ]);
    const third = await saveDevice('third', [energyFeature('third-index', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX)]);
    [meterIndex] = meter.features;
    [thirdIndex] = third.features;
    plugIndex = plug.features.find((f) => f.selector === 'plug-index');
    plugConsumption = plug.features.find((f) => f.external_id === 'plug-index_consumption');

    // Initialize devices in state manager (loads all devices into cache)
    await device.init(false); // false = don't start DuckDB migration
  });

  afterEach(async () => {
    await db.EnergyContract.destroy({ where: {} });
  });

  it('should return existing feature when nothing to update', async () => {
    const selector = 'test-device-feature';
    const featureBefore = await db.DeviceFeature.findOne({ where: { selector } });
    expect(featureBefore).to.not.equal(null);

    const res = await device.updateFeature(selector, {});
    expect(res).to.have.property('selector', selector);
    // ensure DB not changed for energy_parent_id
    const featureAfter = await db.DeviceFeature.findOne({ where: { selector } });
    expect(featureAfter.energy_parent_id).to.equal(featureBefore.energy_parent_id);
  });

  it('should attach a device to another one and update state', async () => {
    const updated = await device.updateFeature('plug-index', { energy_parent_id: meterIndex.id });
    expect(updated).to.have.property('energy_parent_id', meterIndex.id);

    const reloaded = await db.DeviceFeature.findOne({ where: { selector: 'plug-index' } });
    expect(reloaded.energy_parent_id).to.equal(meterIndex.id);

    // Verify cache is updated in StateManager with all three keys
    expect(stateManager.get('deviceFeature', 'plug-index').energy_parent_id).to.equal(meterIndex.id);
    expect(stateManager.get('deviceFeatureById', plugIndex.id).energy_parent_id).to.equal(meterIndex.id);
    expect(stateManager.get('deviceFeatureByExternalId', 'plug-index').energy_parent_id).to.equal(meterIndex.id);

    // Verify the device cache also has the updated feature in its features array
    const cachedDevice = stateManager.get('deviceById', plugIndex.device_id);
    const featureInDevice = cachedDevice.features.find((f) => f.id === plugIndex.id);
    expect(featureInDevice.energy_parent_id).to.equal(meterIndex.id);
  });

  it('should clear energy_parent_id when set to null', async () => {
    await device.updateFeature('plug-index', { energy_parent_id: meterIndex.id });
    const updated = await device.updateFeature('plug-index', { energy_parent_id: null });
    expect(updated.energy_parent_id).to.equal(null);
    const check = await db.DeviceFeature.findOne({ where: { id: plugIndex.id } });
    expect(check.energy_parent_id).to.equal(null);
    expect(stateManager.get('deviceFeatureById', plugIndex.id).energy_parent_id).to.equal(null);
  });

  it('should prevent circular energy_parent_id', async () => {
    await device.updateFeature('plug-index', { energy_parent_id: meterIndex.id });
    const promise = device.updateFeature('meter-index', { energy_parent_id: plugIndex.id });
    await assert.isRejected(promise, 'Circular energy_parent_id not allowed');
  });

  it('should not loop on a cycle above the new parent', async () => {
    // a cycle left in the database between the meter and the plug, not involving the third device
    await db.DeviceFeature.update({ energy_parent_id: meterIndex.id }, { where: { id: plugIndex.id } });
    await db.DeviceFeature.update({ energy_parent_id: plugIndex.id }, { where: { id: meterIndex.id } });
    const updated = await device.updateFeature('third-index', { energy_parent_id: plugIndex.id });
    expect(updated.energy_parent_id).to.equal(plugIndex.id);
  });

  it('should refuse a feature that does not attach a device to a meter', async () => {
    await assert.isRejected(
      device.updateFeature('test-device-feature', { energy_parent_id: null }),
      'only an energy index or consumption is attached to a meter',
    );
    // a derived link is maintained by Gladys
    await assert.isRejected(
      device.updateFeature(plugConsumption.selector, { energy_parent_id: meterIndex.id }),
      'this link is derived and maintained by Gladys',
    );
    // a derived link is never created by the user
    await assert.isRejected(
      device.updateFeature('plug-index', { energy_parent_id: plugConsumption.id }),
      'a device is attached to another device',
    );
    await assert.isRejected(
      device.updateFeature('plug-index', { energy_parent_id: '2f5b2b52-6e3e-4f3b-9b52-0d1b6a3c7e11' }),
      'Parent DeviceFeature not found',
    );
  });

  it('should keep an electric meter a root', async () => {
    await db.EnergyContract.create({
      name: 'Meter contract',
      electric_meter_device_id: meterIndex.device_id,
      valid_from: '2025-01-01',
      currency: 'EUR',
      timezone: 'Europe/Paris',
      tariff: { tariff_version: 1, components: [] },
    });
    await assert.isRejected(
      device.updateFeature('meter-index', { energy_parent_id: thirdIndex.id }),
      'an electric meter is a root',
    );
    const updated = await device.updateFeature('meter-index', { energy_parent_id: null });
    expect(updated.energy_parent_id).to.equal(null);
  });

  it('should throw NotFoundError when selector does not exist', async () => {
    await assert.isRejected(device.updateFeature('unknown-selector', {}), 'DeviceFeature not found');
    await assert.isRejected(
      device.updateFeature('unknown-selector', { energy_parent_id: null }),
      'DeviceFeature not found',
    );
  });
});
