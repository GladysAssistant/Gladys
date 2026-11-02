const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

const migration = require('../../migrations/20261031000000-matter-onoff-light-category');

const MATTER_SERVICE_ID = '9b2e6c4a-1d3f-4a8e-b5c7-2f1e0d9a8c63';
const BULB_DEVICE_ID = '4c7a1e9b-2d6f-4b3a-8e1c-5f9d2a7b0e18';
const PLUG_DEVICE_ID = '7e3b9d1c-5a2f-4c8e-9b6d-1a4f8e2c7d05';

const createFeature = (deviceId, externalId, category, type) =>
  db.DeviceFeature.create({
    device_id: deviceId,
    name: externalId,
    selector: externalId.replace(/:/g, '-'),
    external_id: externalId,
    category,
    type,
    read_only: false,
    has_feedback: true,
    min: 0,
    max: 1,
  });

const createMatterDevices = async () => {
  await db.Service.create({
    id: MATTER_SERVICE_ID,
    name: 'matter',
    selector: 'matter',
    version: '0.1.0',
    has_message_feature: false,
  });
  await db.Device.create({
    id: BULB_DEVICE_ID,
    name: 'IKEA (Kajplats) 1',
    selector: 'matter-111-1',
    external_id: 'matter:111:1',
    service_id: MATTER_SERVICE_ID,
  });
  await createFeature(
    BULB_DEVICE_ID,
    'matter:111:1:6',
    DEVICE_FEATURE_CATEGORIES.SWITCH,
    DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  );
  await createFeature(
    BULB_DEVICE_ID,
    'matter:111:1:8',
    DEVICE_FEATURE_CATEGORIES.LIGHT,
    DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
  );
  await db.Device.create({
    id: PLUG_DEVICE_ID,
    name: 'Eve (Energy) 1',
    selector: 'matter-222-1',
    external_id: 'matter:222:1',
    service_id: MATTER_SERVICE_ID,
  });
  await createFeature(
    PLUG_DEVICE_ID,
    'matter:222:1:6',
    DEVICE_FEATURE_CATEGORIES.SWITCH,
    DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  );
};

const getFeature = (externalId) => db.DeviceFeature.findOne({ where: { external_id: externalId } });

describe('migration 20261031000000-matter-onoff-light-category', () => {
  it('should do nothing when the matter service is not installed', async () => {
    await migration.up();
  });

  it('should turn the on/off of a Matter light into a light binary feature', async () => {
    await createMatterDevices();
    await migration.up();
    const onOff = await getFeature('matter:111:1:6');
    expect(onOff.category).to.equal(DEVICE_FEATURE_CATEGORIES.LIGHT);
    expect(onOff.type).to.equal(DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    const brightness = await getFeature('matter:111:1:8');
    expect(brightness.category).to.equal(DEVICE_FEATURE_CATEGORIES.LIGHT);
    expect(brightness.type).to.equal(DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);
  });

  it('should keep the on/off of a Matter plug a switch', async () => {
    await createMatterDevices();
    await migration.up();
    const onOff = await getFeature('matter:222:1:6');
    expect(onOff.category).to.equal(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(onOff.type).to.equal(DEVICE_FEATURE_TYPES.SWITCH.BINARY);
  });

  it('should be idempotent', async () => {
    await createMatterDevices();
    await migration.up();
    await migration.up();
    const onOff = await getFeature('matter:111:1:6');
    expect(onOff.category).to.equal(DEVICE_FEATURE_CATEGORIES.LIGHT);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
