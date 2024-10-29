const { expect } = require('chai');
const fse = require('fs-extra');
const path = require('path');
const { fake, assert: fakeAssert } = require('sinon');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');

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

const childProcessMock = {};

describe('Camera.onNewCameraFile', () => {
  const folderName = 'camera-a10bca14-fa0e-4484-b6ad-fedef6fd897f';
  const folderPath = path.join(gladys.config.tempFolder, folderName);
  const indexFilePath = path.join(folderPath, 'index.m3u8');
  const keyfilePath = path.join(folderPath, 'index.m3u8.key');
  const videoFilePath = path.join(folderPath, 'index0.ts');
  let rtspCameraManager;
  before(async () => {
    await fse.ensureDir(folderPath);
    await fse.writeFile(indexFilePath, 'this is index');
    await fse.writeFile(keyfilePath, 'this is a key');
    await fse.writeFile(videoFilePath, 'this is a video');
  });
  after(async () => {
    await fse.remove(folderPath);
  });
  beforeEach(() => {
    rtspCameraManager = new RtspCameraManager(gladys, childProcessMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    rtspCameraManager.sendCameraFileToGatewayLimited = fake.resolves(null);
  });
  it('should return directly, no live stream', async () => {
    const res = await rtspCameraManager.onNewCameraFile('my-camera', folderPath, 'camera-folder', 'index.m3u8', {}, {});
    expect(res).to.equal(null);
    fakeAssert.notCalled(rtspCameraManager.sendCameraFileToGatewayLimited);
  });
  it('should return directly, no filename', async () => {
    const res = await rtspCameraManager.onNewCameraFile('my-camera', folderPath, 'camera-folder', null, {}, {});
    expect(res).to.equal(null);
    fakeAssert.notCalled(rtspCameraManager.sendCameraFileToGatewayLimited);
  });
  it('should return directly for temp/key file', async () => {
    rtspCameraManager.sendCameraFileToGatewayLimited = fake.resolves(null);
    const res = await rtspCameraManager.onNewCameraFile('my-camera', folderPath, folderName, 'index.m3u8.tmp', {}, {});
    expect(res).to.equal(null);
    const res2 = await rtspCameraManager.onNewCameraFile('my-camera', folderPath, folderName, 'index.m3u8.key', {}, {});
    expect(res2).to.equal(null);
    fakeAssert.notCalled(rtspCameraManager.sendCameraFileToGatewayLimited);
  });
  it('should return directly, not a Gladys Gateway live', async () => {
    rtspCameraManager.liveStreams.set('my-camera', {
      isGladysGateway: false,
    });
    const res = await rtspCameraManager.onNewCameraFile('my-camera', folderPath, folderName, 'index.m3u8', {}, {});
    expect(res).to.equal(null);
    fakeAssert.notCalled(rtspCameraManager.sendCameraFileToGatewayLimited);
  });
  it('should upload index and have an event emitted', async () => {
    rtspCameraManager.liveStreams.set('my-camera', {
      isGladysGateway: true,
    });
    const sharedObject = {};
    const eventEmitter = {
      emit: fake.returns(null),
    };
    const res = await rtspCameraManager.onNewCameraFile(
      'my-camera',
      folderPath,
      folderName,
      'index.m3u8',
      sharedObject,
      eventEmitter,
    );
    expect(res).to.equal(null);
    fakeAssert.calledWith(
      rtspCameraManager.sendCameraFileToGatewayLimited,
      folderName,
      'index.m3u8',
      Buffer.from('this is index', 'utf8'),
    );
    fakeAssert.calledWith(eventEmitter.emit, 'gateway-ready');
  });
  it('should upload a file that fail, and return null', async () => {
    rtspCameraManager = new RtspCameraManager(gladys, childProcessMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
    rtspCameraManager.sendCameraFileToGatewayLimited = fake.rejects(null);
    rtspCameraManager.liveStreams.set('my-camera', {
      isGladysGateway: true,
    });
    const sharedObject = {};
    const eventEmitter = {};
    const res = await rtspCameraManager.onNewCameraFile(
      'my-camera',
      folderPath,
      folderName,
      'index0.ts',
      sharedObject,
      eventEmitter,
    );
    expect(res).to.equal(null);
    fakeAssert.called(rtspCameraManager.sendCameraFileToGatewayLimited);
  });
  it('should upload index and hot replace url in case of a mixed live (local&gateway)', async () => {
    await fse.writeFile(
      indexFilePath,
      `BACKEND_URL_TO_REPLACE/api/v1/service/rtsp-camera/camera/streaming/${folderName}/index.m3u8.key`,
    );
    rtspCameraManager.liveStreams.set('my-camera', {
      isGladysGateway: true,
    });
    const sharedObject = {};
    const eventEmitter = {
      emit: fake.returns(null),
    };
    const res = await rtspCameraManager.onNewCameraFile(
      'my-camera',
      folderPath,
      folderName,
      'index.m3u8',
      sharedObject,
      eventEmitter,
    );
    expect(res).to.equal(null);
    // Upload a second time, but should not emit gateway-ready
    const res2 = await rtspCameraManager.onNewCameraFile(
      'my-camera',
      folderPath,
      folderName,
      'index.m3u8',
      sharedObject,
      eventEmitter,
    );
    expect(res2).to.equal(null);
    fakeAssert.calledWith(
      rtspCameraManager.sendCameraFileToGatewayLimited,
      folderName,
      'index.m3u8',
      Buffer.from(
        `https://api.gladysgateway.com/cameras/camera-a10bca14-fa0e-4484-b6ad-fedef6fd897f/index.m3u8.key`,
        'utf8',
      ),
    );
    fakeAssert.calledWith(eventEmitter.emit, 'gateway-ready');
    fakeAssert.calledOnce(eventEmitter.emit);
  });
});
