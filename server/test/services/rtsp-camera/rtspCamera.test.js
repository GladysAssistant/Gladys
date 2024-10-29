const { expect } = require('chai');
const fse = require('fs-extra');
const assertChai = require('chai').assert;
const { fake, assert } = require('sinon');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');
const RtspCameraService = require('../../../services/rtsp-camera');

const device = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'test',
    },
    {
      name: 'CAMERA_ROTATION',
      value: '0',
    },
  ],
};

const gladys = {
  config: {
    tempFolder: '/tmp/gladys',
  },
  device: {
    camera: {
      setImage: fake.resolves(null),
    },
    getBySelector: fake.resolves(device),
  },
};

const deviceRotation90 = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6c',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'test',
    },
    {
      name: 'CAMERA_ROTATION',
      value: '90',
    },
  ],
};

const deviceRotation180 = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6c',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'test',
    },
    {
      name: 'CAMERA_ROTATION',
      value: '180',
    },
  ],
};

const deviceRotation270 = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6c',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'test',
    },
    {
      name: 'CAMERA_ROTATION',
      value: '270',
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

const deviceThatResultInNoImage = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'no-image-written',
    },
  ],
};

const childProcessMock = {
  execFile: (prog, args, options, cb) => {
    if (args[1] === 'broken') {
      cb(new Error('broken url'));
    } else if (args[1] === 'no-image-written') {
      cb(null, '', '');
    } else {
      fse.writeFileSync(args[args.length - 1], 'image');
      cb(null, '', '');
    }
  },
  spawn: (command, args, options) => {
    const writeFile = () => {
      fse.writeFileSync(args[args.length - 1], 'hello');
    };
    setTimeout(writeFile, 100);
    return {
      kill: fake.returns(null),
      stdout: {
        on: fake.returns(null),
      },
      stderr: {
        on: fake.returns(null),
      },
      on: fake.returns(null),
    };
  },
};

describe('RtspCameraManager commands', () => {
  const rtspCameraManager = new RtspCameraManager(gladys, childProcessMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  before(async () => {
    await fse.ensureDir(gladys.config.tempFolder);
  });
  it('should start service', async () => {
    const rtspCameraService = RtspCameraService(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    await rtspCameraService.start();
  });
  it('should getImage', async () => {
    const image = await rtspCameraManager.getImage(device);
    expect(image).to.equal('image/jpg;base64,aW1hZ2U=');
  });
  it('should getImage 90°', async () => {
    const image = await rtspCameraManager.getImage(deviceRotation90);
    expect(image).to.equal('image/jpg;base64,aW1hZ2U=');
  });
  it('should getImage 180°', async () => {
    const image = await rtspCameraManager.getImage(deviceRotation180);
    expect(image).to.equal('image/jpg;base64,aW1hZ2U=');
  });
  it('should getImage 270°', async () => {
    const image = await rtspCameraManager.getImage(deviceRotation270);
    expect(image).to.equal('image/jpg;base64,aW1hZ2U=');
  });
  it('should return error', async () => {
    const promise = rtspCameraManager.getImage(brokenDevice);
    return assertChai.isRejected(promise, 'broken');
  });
  it('should crash because no image was saved', async () => {
    const promise = rtspCameraManager.getImage(deviceThatResultInNoImage);
    return assertChai.isRejected(promise, 'ENOENT');
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
    assert.calledWith(gladys.device.camera.setImage, 'my-camera', 'image/jpg;base64,aW1hZ2U=');
  });
  it('should fail to poll, but not crash', async () => {
    const rtspCameraManagerBroken = new RtspCameraManager(
      gladys,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManagerBroken.getImage = fake.rejects('NOT_WORKING');
    await rtspCameraManagerBroken.poll(device);
  });
  it('should stop service', async () => {
    const rtspCameraService = RtspCameraService(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    await rtspCameraService.stop();
  });
});
