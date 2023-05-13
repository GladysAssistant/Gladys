const fse = require('fs-extra');
const path = require('path');
const { fake, assert: fakeAssert } = require('sinon');
const FfmpegMock = require('./FfmpegMock.test');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');

const gladys = {
  config: {
    tempFolder: '/tmp/gladys',
  },
  gateway: {
    gladysGatewayClient: {
      cameraUploadFile: fake.resolves(null),
    },
  },
};

const childProcessMock = {};

describe('Camera.sendCameraFileToGateway', () => {
  const folderName = 'camera-a10bca14-fa0e-4484-b6ad-fedef6fd897f';
  const folderPath = path.join(gladys.config.tempFolder, folderName);
  const indexFilePath = path.join(folderPath, 'index.m3u8');
  const keyfilePath = path.join(folderPath, 'index.m3u8.key');
  const videoFilePath = path.join(folderPath, 'index0.ts');
  const rtspCameraManager = new RtspCameraManager(
    gladys,
    FfmpegMock,
    childProcessMock,
    'de051f90-f34a-4fd5-be2e-e502339ec9bc',
  );
  before(async () => {
    await fse.ensureDir(folderPath);
    await fse.writeFile(indexFilePath, 'this is index');
    await fse.writeFile(keyfilePath, 'this is a key');
    await fse.writeFile(videoFilePath, 'this is a video');
  });
  after(async () => {
    await fse.remove(folderPath);
  });
  it('should upload 1 file', async () => {
    await rtspCameraManager.sendCameraFileToGateway(
      'camera-76561cdf-1e94-47c9-96b0-341b2d7e8d11',
      'filename',
      Buffer.from('lala', 'utf8'),
    );
    // @ts-ignore
    fakeAssert.calledWith(
      rtspCameraManager.gladys.gateway.gladysGatewayClient.cameraUploadFile,
      'camera-76561cdf-1e94-47c9-96b0-341b2d7e8d11',
      'filename',
      Buffer.from('lala', 'utf8'),
    );
  });
});
