const { assert, fake } = require('sinon');
const RtspCameraController = require('../../../../services/rtsp-camera/api/rtspCamera.controller');

const rtspCameraService = {
  getImage: fake.resolves('base64image'),
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
      ],
    };
    const rtspCameraController = RtspCameraController(rtspCameraService);
    const req = {
      body: device,
    };
    await rtspCameraController['post /api/v1/service/rtsp-camera/camera/test'].controller(req, res);
    assert.calledWith(rtspCameraService.getImage, device);
    assert.calledWith(res.send, 'base64image');
  });
});
