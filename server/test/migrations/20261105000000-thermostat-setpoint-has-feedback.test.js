const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

const migration = require('../../migrations/20261105000000-thermostat-setpoint-has-feedback');

const THERMOSTAT_SERVICE_ID = '9b2c4e6a-1d3f-4a5b-8c7d-2e4f6a8b0c1d';
const THERMOSTAT_DEVICE_ID = '4c6e8a0b-2d4f-4b6c-9d8e-3f5a7b9c1d2e';
const OTHER_SERVICE_ID = '1a3c5e7b-9d2f-4e6a-8b0c-4d6f8a2b3c5e';
const OTHER_DEVICE_ID = '7e9a1c3d-5f7b-4d9e-8a1b-5c7e9a3d4f6b';

const createService = (id, name) =>
  db.Service.create({ id, name, selector: name, version: '0.1.0', has_message_feature: false });

const createDeviceWithFeatures = async (serviceId, deviceId, slug) => {
  await db.Device.create({
    id: deviceId,
    name: slug,
    selector: slug,
    external_id: `${slug}:device`,
    service_id: serviceId,
  });
  await db.DeviceFeature.create({
    device_id: deviceId,
    name: 'Setpoint',
    selector: `${slug}-setpoint`,
    external_id: `${slug}:target-temperature`,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 8,
    max: 25,
  });
  await db.DeviceFeature.create({
    device_id: deviceId,
    name: 'Preset',
    selector: `${slug}-preset`,
    external_id: `${slug}:preset`,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 5,
  });
};

const feature = (selector) => db.DeviceFeature.findOne({ where: { selector } });

describe('migration 20261105000000-thermostat-setpoint-has-feedback', () => {
  it('should do nothing when the thermostat service is not installed', async () => {
    await migration.up();
  });

  it('should do nothing when there is no thermostat', async () => {
    await createService(THERMOSTAT_SERVICE_ID, 'thermostat');
    await migration.up();
  });

  it("should give a thermostat's setpoint feedback, and leave everything else alone", async () => {
    await createService(THERMOSTAT_SERVICE_ID, 'thermostat');
    await createDeviceWithFeatures(THERMOSTAT_SERVICE_ID, THERMOSTAT_DEVICE_ID, 'living-room-thermostat');
    // The real device of an external thermostat belongs to another service.
    await createService(OTHER_SERVICE_ID, 'matter');
    await createDeviceWithFeatures(OTHER_SERVICE_ID, OTHER_DEVICE_ID, 'tado');

    await migration.up();

    expect((await feature('living-room-thermostat-setpoint')).has_feedback).to.equal(true);
    expect((await feature('living-room-thermostat-preset')).has_feedback).to.equal(false);
    expect((await feature('tado-setpoint')).has_feedback).to.equal(false);
  });

  it('should be harmless when run again', async () => {
    await createService(THERMOSTAT_SERVICE_ID, 'thermostat');
    await createDeviceWithFeatures(THERMOSTAT_SERVICE_ID, THERMOSTAT_DEVICE_ID, 'living-room-thermostat');

    await migration.up();
    await migration.up();

    expect((await feature('living-room-thermostat-setpoint')).has_feedback).to.equal(true);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
