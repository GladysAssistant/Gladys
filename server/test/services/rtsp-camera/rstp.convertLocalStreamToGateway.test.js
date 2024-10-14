const { expect, assert } = require('chai');
const fse = require('fs-extra');
const path = require('path');
const { fake, assert: fakeAssert } = require('sinon');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');
const { NotFoundError } = require('../../../utils/coreErrors');

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

describe('Camera.convertLocalStreamToGateway', () => {
  const folderName = 'camera-a10bca14-fa0e-4484-b6ad-fedef6fd897f';
  const folderPath = path.join(gladys.config.tempFolder, folderName);
  const indexFilePath = path.join(folderPath, 'index.m3u8');
  const keyfilePath = path.join(folderPath, 'index.m3u8.key');
  const videoFilePath = path.join(folderPath, 'index0.ts');
  const rtspCameraManager = new RtspCameraManager(gladys, childProcessMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  before(async () => {
    await fse.ensureDir(folderPath);
    await fse.writeFile(indexFilePath, 'this is index');
    await fse.writeFile(keyfilePath, 'this is a key');
    await fse.writeFile(videoFilePath, 'this is a video');
  });
  after(async () => {
    await fse.remove(folderPath);
  });
  it('should return not found', async () => {
    const promise = rtspCameraManager.convertLocalStreamToGateway('my-camera');
    assert.isRejected(promise, NotFoundError);
  });
  it('should upload 3 files to gateway', async () => {
    rtspCameraManager.liveStreams.set('my-camera', {
      isGladysGateway: false,
      cameraFolder: folderName,
      fullFolderPath: folderPath,
    });
    rtspCameraManager.onNewCameraFile = fake.resolves(null);
    await rtspCameraManager.convertLocalStreamToGateway('my-camera');
    // @ts-ignore
    fakeAssert.callCount(rtspCameraManager.onNewCameraFile, 3);
    expect(rtspCameraManager.liveStreams.get('my-camera')).to.have.property('isGladysGateway', true);
  });
});
