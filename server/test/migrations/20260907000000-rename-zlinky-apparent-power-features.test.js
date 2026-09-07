const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../utils/constants');

const migration = require('../../migrations/20260907000000-rename-zlinky-apparent-power-features');

const ZIGBEE2MQTT_SERVICE_ID = '2f2ebeb0-6d0c-4a3f-9f2a-4c2b9b0f1e11';
const ZLINKY_DEVICE_ID = '7a1c3d8e-5b6f-4e2a-8c9d-0f1e2d3c4b5a';

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

const OTHER_DEVICE_ID = 'c3d4e5f6-0a1b-4c2d-8e9f-1a2b3c4d5e6f';

const createOtherTeleinformationDevice = () =>
  db.Device.create({
    id: OTHER_DEVICE_ID,
    name: 'Custom TIC',
    selector: 'mqtt-custom-tic',
    external_id: 'mqtt:custom-tic',
    service_id: ZIGBEE2MQTT_SERVICE_ID,
  });

const createFeature = (name, type, property, deviceId = ZLINKY_DEVICE_ID) =>
  db.DeviceFeature.create({
    device_id: deviceId,
    name,
    selector: `zigbee2mqtt-lixee-zlinky-tic-teleinformation-${type}-${property}`,
    external_id: `zigbee2mqtt:Lixee ZLinky TIC:teleinformation:${type}:${property}`,
    category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
    type,
    unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 10000,
  });

const getFeatureName = async (type, deviceId = ZLINKY_DEVICE_ID) => {
  const feature = await db.DeviceFeature.findOne({
    where: { device_id: deviceId, type },
  });
  return feature.name;
};

describe('migration 20260907000000-rename-zlinky-apparent-power-features', () => {
  it('should do nothing when there is no ZLinky_TIC feature', async () => {
    await migration.up();
  });

  it('should drop the "Phase 1" suffix of the features still carrying the old default name', async () => {
    await createZlinky();
    await createFeature(
      'Puissance apparente instantanée soutirée Phase 1',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
      'total_apparent_power',
    );
    await createFeature(
      'Puissance apparente maximale soutirée n Phase 1',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN,
      'active_power_max',
    );
    await createFeature(
      'Puissance apparente maximale soutirée n-1 Phase 1',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1,
      'drawn_v_a_max_n1',
    );

    await migration.up();

    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS)).to.equal(
      'Puissance apparente instantanée soutirée',
    );
    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN)).to.equal(
      'Puissance apparente maximale soutirée n',
    );
    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1)).to.equal(
      'Puissance apparente maximale soutirée n-1',
    );
  });

  it('should keep a name chosen by the user', async () => {
    await createZlinky();
    await createFeature('Puissance totale', DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS, 'total_apparent_power');

    await migration.up();

    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS)).to.equal('Puissance totale');
  });

  it('should keep the features of the other phases untouched', async () => {
    await createZlinky();
    await createFeature(
      'Puissance apparente instantanée soutirée Phase 2',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2,
      'apparent_power_ph_b',
    );
    await createFeature(
      'Puissance apparente maximale soutirée n Phase 1',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN1,
      'active_power_max',
    );

    await migration.up();

    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2)).to.equal(
      'Puissance apparente instantanée soutirée Phase 2',
    );
    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN1)).to.equal(
      'Puissance apparente maximale soutirée n Phase 1',
    );
  });

  it('should keep the features of a device which is not a ZLinky_TIC untouched', async () => {
    await createZlinky();
    await createOtherTeleinformationDevice();
    await createFeature(
      'Puissance apparente instantanée soutirée Phase 1',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
      'total_apparent_power',
      OTHER_DEVICE_ID,
    );

    await migration.up();

    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS, OTHER_DEVICE_ID)).to.equal(
      'Puissance apparente instantanée soutirée Phase 1',
    );
  });

  it('should be idempotent', async () => {
    await createZlinky();
    await createFeature(
      'Puissance apparente instantanée soutirée Phase 1',
      DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
      'total_apparent_power',
    );

    await migration.up();
    await migration.up();

    expect(await getFeatureName(DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS)).to.equal(
      'Puissance apparente instantanée soutirée',
    );
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
