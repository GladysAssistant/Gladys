const { assert, fake } = require('sinon');
const RtspCameraController = require('../../../../services/rtsp-camera/api/rtspCamera.controller');

const gladys = {};

const rtspCameraService = {
  getImage: fake.resolves('base64image'),
  startStreamingIfNotStarted: fake.resolves({}),
  stopStreaming: fake.resolves({}),
};

const res = {
  send: fake.returns(null),
};

describe('POST /api/v1/service/rtsp-camera/camera/test', () => {
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
        origin: 'http://origin',
      },
    };
    await rtspCameraController['post /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/start'].controller(
      req,
      res,
    );
    assert.calledWith(rtspCameraService.startStreamingIfNotStarted, 'my-camera', 'http://origin');
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
});
