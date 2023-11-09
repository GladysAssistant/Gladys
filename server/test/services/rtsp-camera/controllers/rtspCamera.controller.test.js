const { assert: chaiAssert } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const fse = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

const RtspCameraController = require('../../../../services/rtsp-camera/api/rtspCamera.controller');

const RtspCameraControllerWithFsMocked = proxyquire('../../../../services/rtsp-camera/api/rtspCamera.controller', {
  fs: {
    createReadStream: () => {
      const event = new EventEmitter();
      // @ts-ignore
      event.pipe = () => event.emit('error');
      return event;
    },
  },
});

const gladys = {
  config: {
    tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
  },
};

const rtspCameraService = {
  getImage: fake.resolves('base64image'),
  startStreamingIfNotStarted: fake.resolves({}),
  stopStreaming: fake.resolves({}),
  liveActivePing: fake.resolves(null),
};

const res = {
  send: fake.returns(null),
};

describe('camera controller test', () => {
  it('should return an image', async () => {
    const device = {
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
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      body: device,
    };
    await rtspCameraController['post /api/v1/service/rtsp-camera/camera/test'].controller(req, res);
    assert.calledWith(rtspCameraService.getImage, device);
  });
  it('should start streaming', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        camera_selector: 'my-camera',
      },
      body: {
        is_gladys_gateway: false,
        segment_duration: 4,
      },
    };
    await rtspCameraController['post /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/start'].controller(
      req,
      res,
    );
    assert.calledWith(rtspCameraService.startStreamingIfNotStarted, 'my-camera', false, 4);
  });
  it('should stop streaming', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        camera_selector: 'my-camera',
      },
    };
    await rtspCameraController['post /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/stop'].controller(
      req,
      res,
    );
    assert.calledWith(rtspCameraService.stopStreaming, 'my-camera');
  });
  it('should ping streaming', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        camera_selector: 'my-camera',
      },
    };
    await rtspCameraController['post /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/ping'].controller(
      req,
      res,
    );
    assert.calledWith(rtspCameraService.liveActivePing, 'my-camera');
  });
  it('should get index.m3u8 file', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        folder: 'camera-1',
        file: 'index.m3u8',
      },
    };
    await fse.ensureDir(path.join(gladys.config.tempFolder, 'camera-1'));
    await fse.writeFile(path.join(gladys.config.tempFolder, 'camera-1', 'index.m3u8'), 'test-toto-content');
    const resWriteStream = fse.createWriteStream(path.join(gladys.config.tempFolder, 'camera-1', 'result.txt'));
    await rtspCameraController['get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file'].controller(
      req,
      resWriteStream,
    );
  });
  it('should get index1.ts file', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        folder: 'camera-1',
        file: 'index1.ts',
      },
    };
    await fse.ensureDir(path.join(gladys.config.tempFolder, 'camera-1'));
    await fse.writeFile(path.join(gladys.config.tempFolder, 'camera-1', 'index1.ts'), 'test-toto-content');
    const resWriteStream = fse.createWriteStream(path.join(gladys.config.tempFolder, 'camera-1', 'result.txt'));
    await rtspCameraController['get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file'].controller(
      req,
      resWriteStream,
    );
  });
  it('should return 404, file not found (res.status) ', async () => {
    const rtspCameraController = RtspCameraControllerWithFsMocked(gladys, rtspCameraService);
    const req = {
      params: {
        folder: 'camera-1',
        file: 'index12212.ts',
      },
    };
    const resWriteStream = fse.createWriteStream(path.join(gladys.config.tempFolder, 'camera-1', 'result.txt'));
    const end = fake.returns(null);
    // @ts-ignore
    resWriteStream.status = fake.returns({
      end,
    });
    await rtspCameraController['get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file'].controller(
      req,
      resWriteStream,
    );
    // @ts-ignore
    assert.calledWith(resWriteStream.status, 404);
    assert.calledOnce(end);
  });
  it('should return 404, file not found (throw error)', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {};
    const resWriteStream = {};
    const promise = rtspCameraController['get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file'].controller(
      req,
      resWriteStream,
    );
    await chaiAssert.isRejected(promise, 'FILE_NOT_FOUND');
  });
  it('should return 400, bad request, invalid filename', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        folder: 'camera-1',
        file: 'lalalalala',
      },
    };
    const resWriteStream = {};
    const promise = rtspCameraController['get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file'].controller(
      req,
      resWriteStream,
    );
    await chaiAssert.isRejected(promise, 'Invalid filename');
  });
  it('should return 400, bad request, invalid filename', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        folder: 'camera-1',
        file: '`index1.tslala',
      },
    };
    const resWriteStream = {};
    const promise = rtspCameraController['get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file'].controller(
      req,
      resWriteStream,
    );
    await chaiAssert.isRejected(promise, 'Invalid filename');
  });
  it('should return 400, bad request, invalid session id', async () => {
    const rtspCameraController = RtspCameraController(gladys, rtspCameraService);
    const req = {
      params: {
        folder: '.....',
        file: 'lalalalala',
      },
    };
    const resWriteStream = {};
    const promise = rtspCameraController['get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file'].controller(
      req,
      resWriteStream,
    );
    await chaiAssert.isRejected(promise, 'Invalid session id');
  });
});
