const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

const migration = require('../../migrations/20261031000000-thermostat-mode-has-feedback');

const THERMOSTAT_SERVICE_ID = '6d1a2f4e-8b3c-4f2a-9e1d-7c5b3a2f1e0d';
const THERMOSTAT_DEVICE_ID = '2f8e4c1a-6b3d-4e9f-8a2c-1d7e5b3f9a04';
const OTHER_SERVICE_ID = '9b4e2c7a-1d3f-4a8e-b6c2-5f7d9e1a3c08';
const OTHER_DEVICE_ID = '4c7a9e2b-3f1d-4b6e-a8c5-2e9f7d1b3a06';

const createService = (id, name) =>
  db.Service.create({ id, name, selector: name, version: '0.1.0', has_message_feature: false });

const createModeFeature = (deviceId, selector) =>
  db.DeviceFeature.create({
    device_id: deviceId,
    name: 'Mode',
    selector,
    external_id: selector,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 2,
  });

const hasFeedback = async (selector) => (await db.DeviceFeature.findOne({ where: { selector } })).has_feedback;

describe('migration 20261031000000-thermostat-mode-has-feedback', () => {
  it('should do nothing when the thermostat service is not installed', async () => {
    await migration.up();
  });

  it('should do nothing when the thermostat service has no device', async () => {
    await createService(THERMOSTAT_SERVICE_ID, 'thermostat');
    await migration.up();
  });

  it('should give the mode feature of every thermostat feedback, and nothing else', async () => {
    await createService(THERMOSTAT_SERVICE_ID, 'thermostat');
    await createService(OTHER_SERVICE_ID, 'zigbee2mqtt');
    await db.Device.create({
      id: THERMOSTAT_DEVICE_ID,
      name: 'Living room thermostat',
      selector: 'living-room-thermostat',
      external_id: 'thermostat:living-room',
      service_id: THERMOSTAT_SERVICE_ID,
    });
    await db.Device.create({
      id: OTHER_DEVICE_ID,
      name: 'Radiator valve',
      selector: 'radiator-valve',
      external_id: 'zigbee2mqtt:radiator-valve',
      service_id: OTHER_SERVICE_ID,
    });
    await createModeFeature(THERMOSTAT_DEVICE_ID, 'thermostat-living-room-mode');
    // The preset is the service's own state as well, but it is not the mode.
    await db.DeviceFeature.create({
      device_id: THERMOSTAT_DEVICE_ID,
      name: 'Preset',
      selector: 'thermostat-living-room-preset',
      external_id: 'thermostat-living-room-preset',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 5,
    });
    // Another integration's thermostat mode is its own business.
    await createModeFeature(OTHER_DEVICE_ID, 'zigbee2mqtt-radiator-valve-mode');

    await migration.up();
    // Run again: nothing left to change.
    await migration.up();

    expect(await hasFeedback('thermostat-living-room-mode')).to.equal(true);
    expect(await hasFeedback('zigbee2mqtt-radiator-valve-mode')).to.equal(false);
    expect(await hasFeedback('thermostat-living-room-preset')).to.equal(false);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
