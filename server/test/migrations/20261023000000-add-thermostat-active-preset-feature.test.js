const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

const migration = require('../../migrations/20261023000000-add-thermostat-active-preset-feature');

const THERMOSTAT_SERVICE_ID = '6d1a2f4e-8b3c-4f2a-9e1d-7c5b3a2f1e0d';
const THERMOSTAT_DEVICE_ID = '2f8e4c1a-6b3d-4e9f-8a2c-1d7e5b3f9a04';

const createThermostat = async () => {
  await db.Service.create({
    id: THERMOSTAT_SERVICE_ID,
    name: 'thermostat',
    selector: 'thermostat',
    version: '0.1.0',
    has_message_feature: false,
  });
  await db.Device.create({
    id: THERMOSTAT_DEVICE_ID,
    name: 'Living room thermostat',
    selector: 'living-room-thermostat',
    external_id: 'thermostat:living-room',
    service_id: THERMOSTAT_SERVICE_ID,
  });
  await db.DeviceFeature.create({
    device_id: THERMOSTAT_DEVICE_ID,
    name: 'Preset',
    selector: 'thermostat-living-room-preset',
    external_id: 'thermostat:living-room:preset',
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 5,
  });
};

const getActivePresetFeatures = () =>
  db.DeviceFeature.findAll({
    where: {
      device_id: THERMOSTAT_DEVICE_ID,
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.ACTIVE_PRESET,
    },
  });

describe('migration 20261023000000-add-thermostat-active-preset-feature', () => {
  it('should do nothing when the thermostat service is not installed', async () => {
    await migration.up();
    const features = await db.DeviceFeature.findAll({
      where: {
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.ACTIVE_PRESET,
      },
    });
    expect(features).to.have.lengthOf(0);
  });

  it('should add an active preset feature to every existing thermostat', async () => {
    await createThermostat();
    await migration.up();
    const features = await getActivePresetFeatures();
    expect(features).to.have.lengthOf(1);
    expect(features[0].selector).to.equal('thermostat-living-room-active-preset');
    // The external_id createDevice builds, so the next save of the device
    // matches this feature instead of adding a second one.
    expect(features[0].external_id).to.equal('thermostat:living-room:active-preset');
    expect(features[0].read_only).to.equal(true);
    expect(features[0].last_value).to.equal(null);
    expect(features[0].min).to.equal(0);
    expect(features[0].max).to.equal(5);
  });

  it('should not add the feature twice when run again', async () => {
    await createThermostat();
    await migration.up();
    await migration.up();
    const features = await getActivePresetFeatures();
    expect(features).to.have.lengthOf(1);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
