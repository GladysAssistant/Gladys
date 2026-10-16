const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { authenticatedRequest, request } = require('../request.test');

const OFFER = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n';
const ANSWER = 'v=0\r\no=- 3 4 IN IP4 0.0.0.0\r\n';

describe('Camera WebRTC routes', () => {
  let camera;

  beforeEach(() => {
    ({ camera } = global.TEST_GLADYS_INSTANCE.device);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('POST /api/v1/camera/:camera_selector/webrtc/start should give the answer back', async () => {
    sinon.stub(camera, 'startWebRtc').resolves({ session_id: 'session-1', sdp_answer: ANSWER });
    await authenticatedRequest
      .post('/api/v1/camera/test-camera/webrtc/start')
      .send({ sdp: OFFER })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ session_id: 'session-1', sdp_answer: ANSWER });
      });
    sinon.assert.calledOnceWithExactly(camera.startWebRtc, 'test-camera', OFFER);
  });

  it('POST /api/v1/camera/:camera_selector/webrtc/start should answer 400 to a camera without WebRTC', async () => {
    // the real path: test-camera declares no GLADYS_CAMERA_STREAM_PROTOCOL
    await authenticatedRequest
      .post('/api/v1/camera/test-camera/webrtc/start')
      .send({ sdp: OFFER })
      .expect(400)
      .then((res) => {
        expect(res.body.message).to.equal('CAMERA_WEBRTC_NOT_SUPPORTED');
      });
  });

  it('POST /api/v1/camera/:camera_selector/webrtc/ping should answer 404 to an ended session', async () => {
    await authenticatedRequest
      .post('/api/v1/camera/test-camera/webrtc/ping')
      .send({ session_id: 'unknown-session' })
      .expect(404);
    sinon.stub(camera, 'pingWebRtc').returns(undefined);
    await authenticatedRequest
      .post('/api/v1/camera/test-camera/webrtc/ping')
      .send({ session_id: 'session-1' })
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ success: true });
      });
    sinon.assert.calledOnceWithExactly(camera.pingWebRtc, 'test-camera', 'session-1');
  });

  it('POST /api/v1/camera/:camera_selector/webrtc/stop should stop the session', async () => {
    const stop = sinon.spy(camera, 'stopWebRtc');
    await authenticatedRequest
      .post('/api/v1/camera/test-camera/webrtc/stop')
      .send({ session_id: 'unknown-session' })
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ success: true });
      });
    sinon.assert.calledOnceWithExactly(stop, 'test-camera', 'unknown-session');
  });

  it('should refuse an unauthenticated caller', async () => {
    await request
      .post('/api/v1/camera/test-camera/webrtc/start')
      .send({ sdp: OFFER })
      .expect(401);
  });
});
