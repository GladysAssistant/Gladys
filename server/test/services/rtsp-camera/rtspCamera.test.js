const { expect } = require('chai');
const fse = require('fs-extra');
const assertChai = require('chai').assert;
const { fake, assert } = require('sinon');
const FfmpegMock = require('./FfmpegMock.test');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');
const RtspCameraService = require('../../../services/rtsp-camera');

const gladys = {
  config: {
    tempFolder: '/tmp/gladys',
  },
  device: {
    camera: {
      setImage: fake.resolves(null),
    },
  },
};

const device = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'rstp://test',
    },
  ],
};

const securedDevice = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'rstp://test',
    },
    {
      name: 'CAMERA_USERNAME',
      value: 'username',
    },
    {
      name: 'CAMERA_PASSWORD',
      value: null,
    },
  ],
};

const brokenDevice = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'rstp://broken',
    },
  ],
};

const invalidUrlDevice = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'broken',
    },
  ],
};

describe('RtspCameraManager commands', () => {
  const rtspCameraManager = new RtspCameraManager(gladys, FfmpegMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  before(async () => {
    await fse.ensureDir(gladys.config.tempFolder);
  });
  it('should start service', async () => {
    const rtspCameraService = RtspCameraService(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    await rtspCameraService.start();
  });
  it('should getImage', async () => {
    const image = await rtspCameraManager.getImage(device);
    expect(image).to.equal('image/png;base64,aW1hZ2U=');
  });
  it('should getImage with username/password', async () => {
    const image = await rtspCameraManager.getImage(securedDevice);
    expect(image).to.equal('image/png;base64,aW1hZ2U=');
  });
  it('should return error', async () => {
    const promise = rtspCameraManager.getImage(brokenDevice);
    return assertChai.isRejected(promise);
  });
  it('should return error, invalid camera url param', async () => {
    const promise = rtspCameraManager.getImage(invalidUrlDevice);
    return assertChai.isRejected(promise);
  });
  it('should return error, no camera url param', async () => {
    const promise = rtspCameraManager.getImage({});
    return assertChai.isRejected(promise);
  });
  it('should return error, empty camera url', async () => {
    const promise = rtspCameraManager.getImage({
      params: [
        {
          name: 'CAMERA_URL',
          value: '',
        },
      ],
    });
    return assertChai.isRejected(promise);
  });
  it('should poll', async () => {
    await rtspCameraManager.poll(device);
    assert.calledWith(gladys.device.camera.setImage, 'my-camera', 'image/png;base64,aW1hZ2U=');
  });
  it('should fail to poll, but not crash', async () => {
    const rtspCameraManagerBroken = new RtspCameraManager(gladys, FfmpegMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    rtspCameraManagerBroken.getImage = fake.rejects('NOT_WORKI?NG');
    await rtspCameraManagerBroken.poll(device);
  });
});
