const { expect } = require('chai');
const assertChai = require('chai').assert;
const { fake, assert } = require('sinon');
const FfmpegMock = require('./FfmpegMock.test');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');

const gladys = {
  config: {
    tempFolder: './.tmp',
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
      value: 'test',
    },
  ],
};

const brokenDevice = {
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
  it('should getImage', async () => {
    const image = await rtspCameraManager.getImage(device);
    expect(image).to.equal('image/png;base64,aW1hZ2U=');
  });
  it('should return error', async () => {
    const promise = rtspCameraManager.getImage(brokenDevice);
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
});
