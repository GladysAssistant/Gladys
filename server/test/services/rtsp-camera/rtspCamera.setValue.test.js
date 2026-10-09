const { assert: chaiAssert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const RtspCameraManager = require('../../../services/rtsp-camera/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const device = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
};

const enabledFeature = {
  category: DEVICE_FEATURE_CATEGORIES.CAMERA,
  type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
};

describe('Camera.setValue', () => {
  let rtspCameraManager;

  beforeEach(() => {
    rtspCameraManager = new RtspCameraManager({}, {}, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    rtspCameraManager.stopStreaming = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should stop the live stream when the camera is disabled', async () => {
    await rtspCameraManager.setValue(device, enabledFeature, 0);
    assert.calledOnceWithExactly(rtspCameraManager.stopStreaming, 'my-camera');
  });

  it('should do nothing on the camera when it is enabled', async () => {
    await rtspCameraManager.setValue(device, enabledFeature, 1);
    assert.notCalled(rtspCameraManager.stopStreaming);
  });

  it('should reject a feature that is not writable', async () => {
    const promise = rtspCameraManager.setValue(
      device,
      { category: DEVICE_FEATURE_CATEGORIES.CAMERA, type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE },
      1,
    );
    await chaiAssert.isRejected(promise, 'RTSP camera: feature camera/image is not writable.');
    assert.notCalled(rtspCameraManager.stopStreaming);
  });

  it('should reject a feature of another category', async () => {
    const promise = rtspCameraManager.setValue(
      device,
      { category: DEVICE_FEATURE_CATEGORIES.LIGHT, type: DEVICE_FEATURE_TYPES.LIGHT.BINARY },
      1,
    );
    await chaiAssert.isRejected(promise, 'RTSP camera: feature light/binary is not writable.');
  });

  it('should be exposed by the rtsp-camera handler', async () => {
    expect(typeof rtspCameraManager.setValue).to.equal('function');
  });
});
