const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../utils/constants');

const migration = require('../../migrations/20261123000000-retype-zlinky-umoy3-features');

const ZIGBEE2MQTT_SERVICE_ID = '2f2ebeb0-6d0c-4a3f-9f2a-4c2b9b0f1e11';
const ZLINKY_DEVICE_ID = '7a1c3d8e-5b6f-4e2a-8c9d-0f1e2d3c4b5a';
const OTHER_DEVICE_ID = 'c3d4e5f6-0a1b-4c2d-8e9f-1a2b3c4d5e6f';

const createZlinky = async () => {
  await db.Service.create({
    id: ZIGBEE2MQTT_SERVICE_ID,
    name: 'zigbee2mqtt',
    selector: 'zigbee2mqtt',
    version: '0.1.0',
    has_message_feature: false,
  });
  await db.Device.create({
    id: ZLINKY_DEVICE_ID,
    name: 'Lixee ZLinky TIC',
    selector: 'zigbee2mqtt-lixee-zlinky-tic',
    external_id: 'zigbee2mqtt:Lixee ZLinky TIC',
    model: 'ZLinky_TIC',
    service_id: ZIGBEE2MQTT_SERVICE_ID,
  });
};

const createOtherDevice = () =>
  db.Device.create({
    id: OTHER_DEVICE_ID,
    name: 'Custom TIC',
    selector: 'mqtt-custom-tic',
    external_id: 'mqtt:custom-tic',
    service_id: ZIGBEE2MQTT_SERVICE_ID,
  });

const createFeature = (deviceId, externalId, type) =>
  db.DeviceFeature.create({
    device_id: deviceId,
    name: 'Tension moyenne Phase 3',
    selector: `sel-${externalId.replace(/[^a-zA-Z0-9]/g, '-')}`,
    external_id: externalId,
    category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
    type,
    unit: DEVICE_FEATURE_UNITS.VOLT,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 10000,
  });

const getFeatureByType = async (type) => {
  const feature = await db.DeviceFeature.findOne({
    where: { device_id: ZLINKY_DEVICE_ID, type },
  });
  return feature;
};

describe('migration 20261123000000-retype-zlinky-umoy3-features', () => {
  it('should do nothing when there is no matching feature', async () => {
    await migration.up();
  });

  it('should retype the UMOY3 feature wrongly typed as UMOY2, keeping its selector', async () => {
    await createZlinky();
    const oldExternalId = 'zigbee2mqtt:Lixee ZLinky TIC:teleinformation:umoy2:UMOY3';
    const created = await createFeature(ZLINKY_DEVICE_ID, oldExternalId, DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2);

    await migration.up();

    const feature = await getFeatureByType(DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY3);
    expect(feature).not.to.equal(null);
    expect(feature.external_id).to.equal('zigbee2mqtt:Lixee ZLinky TIC:teleinformation:umoy3:UMOY3');
    expect(feature.selector).to.equal(created.selector);
    expect(await getFeatureByType(DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2)).to.equal(null);
  });

  it('should keep a genuine UMOY2 feature untouched', async () => {
    await createZlinky();
    await createFeature(
      ZLINKY_DEVICE_ID,
      'zigbee2mqtt:Lixee ZLinky TIC:teleinformation:umoy2:UMOY2',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
    );

    await migration.up();

    const feature = await getFeatureByType(DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2);
    expect(feature).not.to.equal(null);
    expect(feature.external_id).to.equal('zigbee2mqtt:Lixee ZLinky TIC:teleinformation:umoy2:UMOY2');
  });

  it('should keep the features of other services untouched', async () => {
    await createZlinky();
    await createOtherDevice();
    const created = await createFeature(
      OTHER_DEVICE_ID,
      'mqtt:custom-tic:teleinformation:umoy2:UMOY3',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
    );

    await migration.up();

    const feature = await db.DeviceFeature.findOne({
      where: { device_id: OTHER_DEVICE_ID, type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2 },
    });
    expect(feature).not.to.equal(null);
    expect(feature.external_id).to.equal(created.external_id);
  });

  it('should be idempotent', async () => {
    await createZlinky();
    await createFeature(
      ZLINKY_DEVICE_ID,
      'zigbee2mqtt:Lixee ZLinky TIC:teleinformation:umoy2:UMOY3',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
    );

    await migration.up();
    await migration.up();

    const feature = await getFeatureByType(DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY3);
    expect(feature).not.to.equal(null);
    expect(feature.external_id).to.equal('zigbee2mqtt:Lixee ZLinky TIC:teleinformation:umoy3:UMOY3');
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
