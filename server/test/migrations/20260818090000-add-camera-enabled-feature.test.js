const { expect } = require('chai');

const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

const migration = require('../../migrations/20260818090000-add-camera-enabled-feature');

const RTSP_SERVICE_ID = '4b6f6a0b-2e29-4b83-9f3a-1cbd77b2b8f0';
const RTSP_DEVICE_ID = '9c0a1e83-1cd0-4d4b-9f27-2f2a1e1f9a01';

const createRtspCamera = async () => {
  await db.Service.create({
    id: RTSP_SERVICE_ID,
    name: 'rtsp-camera',
    selector: 'rtsp-camera',
    version: '0.1.0',
    has_message_feature: false,
  });
  await db.Device.create({
    id: RTSP_DEVICE_ID,
    name: 'Nest box camera',
    selector: 'nest-box-camera',
    external_id: 'nest-box-camera-external',
    service_id: RTSP_SERVICE_ID,
  });
  await db.DeviceFeature.create({
    device_id: RTSP_DEVICE_ID,
    name: 'Nest box camera',
    selector: 'nest-box-camera-image',
    external_id: 'nest-box-camera-external',
    category: DEVICE_FEATURE_CATEGORIES.CAMERA,
    type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
    read_only: false,
    keep_history: false,
    has_feedback: false,
    min: 0,
    max: 0,
  });
};

const getEnabledFeatures = () =>
  db.DeviceFeature.findAll({
    where: {
      device_id: RTSP_DEVICE_ID,
      category: DEVICE_FEATURE_CATEGORIES.CAMERA,
      type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
    },
  });

describe('migration 20260818090000-add-camera-enabled-feature', () => {
  it('should do nothing when the rtsp-camera service is not installed', async () => {
    await migration.up();
    const features = await db.DeviceFeature.findAll({
      where: {
        category: DEVICE_FEATURE_CATEGORIES.CAMERA,
        type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
      },
    });
    expect(features).to.have.lengthOf(0);
  });

  it('should add an enabled feature to every existing RTSP camera', async () => {
    await createRtspCamera();
    await migration.up();
    const features = await getEnabledFeatures();
    expect(features).to.have.lengthOf(1);
    expect(features[0].selector).to.equal('nest-box-camera-enabled');
    expect(features[0].external_id).to.equal('nest-box-camera-external:enabled');
    expect(features[0].last_value).to.equal(1);
    expect(features[0].read_only).to.equal(false);
    expect(features[0].keep_history).to.equal(false);
    expect(features[0].min).to.equal(0);
    expect(features[0].max).to.equal(1);
  });

  it('should not add the feature twice when run again', async () => {
    await createRtspCamera();
    await migration.up();
    await migration.up();
    const features = await getEnabledFeatures();
    expect(features).to.have.lengthOf(1);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
