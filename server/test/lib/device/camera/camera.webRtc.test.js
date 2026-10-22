const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');
const ServiceManager = require('../../../../lib/service');
const { BadParameters, NotFoundError, TooManyRequests } = require('../../../../utils/coreErrors');
const { SESSION_TTL_MS, MAX_SESSIONS, MAX_SDP_LENGTH } = require('../../../../lib/device/camera/camera.webRtc');

const OFFER = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\na=candidate:1 1 udp 2122260223 192.168.1.10 54321 typ host\r\n';
const ANSWER = 'v=0\r\no=- 3 4 IN IP4 0.0.0.0\r\n';

const webRtcCamera = (overrides = {}) => ({
  selector: 'doorbell',
  service_id: 'netatmo-service-id',
  params: [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'webrtc' }],
  features: [],
  ...overrides,
});

const buildCamera = ({ device = webRtcCamera(), service } = {}) => {
  // one emitter per camera: the device manager registers its listeners on it
  const event = new EventEmitter();
  const job = new Job(event);
  const stateManager = new StateManager(event);
  const serviceManager = new ServiceManager({}, stateManager);
  const cameraService = service || {
    device: {
      startWebRtc: fake.resolves({ sdpAnswer: ANSWER, sessionId: 'netatmo-session', streamId: 'tag-1' }),
      stopWebRtc: fake.resolves(null),
    },
  };
  serviceManager.getServiceById = fake.returns(cameraService);
  const deviceManager = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
  if (device) {
    stateManager.setState('device', device.selector, device);
  }
  return { camera: deviceManager.camera, cameraService, device };
};

describe('Camera WebRTC live view', () => {
  let clock;
  let cameras;

  beforeEach(() => {
    clock = sinon.useFakeTimers({ now: Date.parse('2026-10-16T12:00:00.000Z'), toFake: ['Date', 'setInterval'] });
    cameras = [];
  });

  afterEach(() => {
    // no sweep interval may outlive its test
    cameras.forEach((camera) => clearInterval(camera.webRtcSweepInterval));
    clock.restore();
    sinon.restore();
  });

  const build = (options) => {
    const built = buildCamera(options);
    cameras.push(built.camera);
    return built;
  };

  describe('startWebRtc', () => {
    it('should relay the offer to the camera service and give its answer back', async () => {
      const { camera, cameraService, device } = build();
      const answer = await camera.startWebRtc('doorbell', OFFER);
      expect(answer.sdp_answer).to.equal(ANSWER);
      expect(answer.session_id).to.be.a('string');
      sinon.assert.calledOnceWithExactly(cameraService.device.startWebRtc, device, {
        sessionId: answer.session_id,
        sdp: OFFER,
      });
      expect(camera.webRtcSessions.get(answer.session_id)).to.include({
        selector: 'doorbell',
        serviceSessionId: 'netatmo-session',
        streamId: 'tag-1',
      });
    });

    it('should refuse a missing, empty or oversized offer before any lookup', async () => {
      const { camera, cameraService } = build();
      const invalidOffers = [undefined, null, 42, '', 'a'.repeat(MAX_SDP_LENGTH + 1)];
      await Promise.all(
        invalidOffers.map((sdp) => assert.isRejected(camera.startWebRtc('doorbell', sdp), BadParameters)),
      );
      sinon.assert.notCalled(cameraService.device.startWebRtc);
    });

    it('should refuse an unknown camera', async () => {
      const { camera } = build();
      await assert.isRejected(camera.startWebRtc('unknown-camera', OFFER), NotFoundError, 'Camera not found');
    });

    it('should never stream a disabled camera', async () => {
      const { camera, cameraService } = build({
        device: webRtcCamera({ features: [{ category: 'camera', type: 'enabled', last_value: 0 }] }),
      });
      await assert.isRejected(camera.startWebRtc('doorbell', OFFER), NotFoundError, 'Camera is disabled');
      sinon.assert.notCalled(cameraService.device.startWebRtc);
    });

    it('should refuse a camera that does not declare WebRTC', async () => {
      const { camera, cameraService } = build({
        device: webRtcCamera({ params: [{ name: 'CAMERA_URL', value: 'rtsp://192.168.1.20/live' }] }),
      });
      await assert.isRejected(camera.startWebRtc('doorbell', OFFER), BadParameters, 'CAMERA_WEBRTC_NOT_SUPPORTED');
      sinon.assert.notCalled(cameraService.device.startWebRtc);
    });

    it('should refuse when the service is gone or cannot negotiate WebRTC', async () => {
      const { camera: withoutService } = build({ service: null });
      withoutService.serviceManager.getServiceById = fake.returns(null);
      await assert.isRejected(withoutService.startWebRtc('doorbell', OFFER), 'Service is not found or not configured.');

      const { camera: withoutCapability } = build({ service: { device: { getImage: fake.resolves('image') } } });
      await assert.isRejected(
        withoutCapability.startWebRtc('doorbell', OFFER),
        BadParameters,
        'CAMERA_WEBRTC_NOT_SUPPORTED',
      );
    });

    it('should not keep a session when the service fails', async () => {
      const startWebRtc = fake.rejects(new Error('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT'));
      const { camera } = build({ service: { device: { startWebRtc, stopWebRtc: fake.resolves(null) } } });
      await assert.isRejected(camera.startWebRtc('doorbell', OFFER), 'EXTERNAL_INTEGRATION_COMMAND_TIMEOUT');
      expect(camera.webRtcSessions.size).to.equal(0);
      expect(camera.webRtcPendingStarts).to.equal(0);
      expect(camera.webRtcSweepInterval).to.equal(null);
    });

    it('should count the starts still waiting for the camera cloud against the cap', async () => {
      let answerAll;
      const pendingAnswer = new Promise((resolve) => {
        answerAll = resolve;
      });
      const startWebRtc = sinon.fake(() => pendingAnswer);
      const { camera } = build({ service: { device: { startWebRtc, stopWebRtc: fake.resolves(null) } } });
      const starts = Array.from({ length: MAX_SESSIONS }, () => camera.startWebRtc('doorbell', OFFER));
      // let every start reach the vendor round trip
      await Promise.resolve();
      await Promise.resolve();
      await assert.isRejected(camera.startWebRtc('doorbell', OFFER), TooManyRequests);
      answerAll({ sdpAnswer: ANSWER, sessionId: 's', streamId: null });
      await Promise.all(starts);
      expect(camera.webRtcSessions.size).to.equal(MAX_SESSIONS);
      expect(camera.webRtcPendingStarts).to.equal(0);
    });

    it('should cap the live views open at the same time', async () => {
      const { camera, cameraService } = build();
      for (let i = 0; i < MAX_SESSIONS; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await camera.startWebRtc('doorbell', OFFER);
      }
      await assert.isRejected(camera.startWebRtc('doorbell', OFFER), TooManyRequests);
      sinon.assert.callCount(cameraService.device.startWebRtc, MAX_SESSIONS);
    });
  });

  describe('pingWebRtc', () => {
    it('should keep a session alive past its first deadline', async () => {
      const { camera, cameraService } = build();
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      clock.tick(SESSION_TTL_MS - 1000);
      await camera.pingWebRtc('doorbell', sessionId);
      clock.tick(SESSION_TTL_MS - 1000);
      await camera.sweepWebRtcSessions();
      expect(camera.webRtcSessions.has(sessionId)).to.equal(true);
      sinon.assert.notCalled(cameraService.device.stopWebRtc);
    });

    it('should tell the browser its stream is over', async () => {
      const { camera } = build();
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      await assert.isRejected(camera.pingWebRtc('doorbell', 'unknown-session'), NotFoundError);
      // a session of another camera is not this camera's
      await assert.isRejected(camera.pingWebRtc('other-camera', sessionId), NotFoundError);
      clock.tick(SESSION_TTL_MS);
      await assert.isRejected(
        camera.pingWebRtc('doorbell', sessionId),
        NotFoundError,
        'CAMERA_WEBRTC_SESSION_NOT_FOUND',
      );
    });

    it('should end the session of a camera turned off or deleted while streaming', async () => {
      const { camera, cameraService, device } = build();
      const { session_id: turnedOff } = await camera.startWebRtc('doorbell', OFFER);
      device.features = [{ category: 'camera', type: 'enabled', last_value: 0 }];
      await assert.isRejected(camera.pingWebRtc('doorbell', turnedOff), NotFoundError);
      expect(camera.webRtcSessions.has(turnedOff)).to.equal(false);
      sinon.assert.calledOnce(cameraService.device.stopWebRtc);

      device.features = [];
      const { session_id: deleted } = await camera.startWebRtc('doorbell', OFFER);
      camera.stateManager.deleteState('device', 'doorbell');
      await assert.isRejected(camera.pingWebRtc('doorbell', deleted), NotFoundError);
      expect(camera.webRtcSessions.has(deleted)).to.equal(false);
    });
  });

  describe('stopWebRtc', () => {
    it('should end the session on the camera service with the ids it gave', async () => {
      const { camera, cameraService, device } = build();
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      await camera.stopWebRtc('doorbell', sessionId);
      expect(camera.webRtcSessions.has(sessionId)).to.equal(false);
      sinon.assert.calledOnceWithExactly(
        cameraService.device.stopWebRtc,
        { external_id: device.external_id, selector: 'doorbell', params: device.params },
        { sessionId: 'netatmo-session', streamId: 'tag-1' },
      );
    });

    it('should be a no-op for a session already gone or of another camera', async () => {
      const { camera, cameraService } = build();
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      await camera.stopWebRtc('doorbell', 'unknown-session');
      await camera.stopWebRtc('other-camera', sessionId);
      expect(camera.webRtcSessions.has(sessionId)).to.equal(true);
      sinon.assert.notCalled(cameraService.device.stopWebRtc);
    });

    it('should forget the session even when the service fails to stop it', async () => {
      const stopWebRtc = fake.rejects(new Error('EXTERNAL_INTEGRATION_NOT_CONNECTED'));
      const { camera } = build({
        service: {
          device: { startWebRtc: fake.resolves({ sdpAnswer: ANSWER, sessionId: 's', streamId: null }), stopWebRtc },
        },
      });
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      await camera.stopWebRtc('doorbell', sessionId);
      expect(camera.webRtcSessions.has(sessionId)).to.equal(false);
      sinon.assert.calledOnce(stopWebRtc);
    });

    it('should only forget the session when its service is gone', async () => {
      const { camera, cameraService } = build();
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      camera.serviceManager.getServiceById = fake.returns(null);
      await camera.stopWebRtc('doorbell', sessionId);
      expect(camera.webRtcSessions.has(sessionId)).to.equal(false);
      sinon.assert.notCalled(cameraService.device.stopWebRtc);
    });

    it('should still end the vendor session of a camera deleted meanwhile', async () => {
      const { camera, cameraService } = build();
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      camera.stateManager.deleteState('device', 'doorbell');
      await camera.stopWebRtc('doorbell', sessionId);
      // the device as it was at start, enough for the integration to address the vendor
      sinon.assert.calledOnceWithExactly(
        cameraService.device.stopWebRtc,
        {
          external_id: undefined,
          selector: 'doorbell',
          params: [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'webrtc' }],
        },
        { sessionId: 'netatmo-session', streamId: 'tag-1' },
      );
    });
  });

  describe('expiry', () => {
    it('should end a session no browser pinged, then stop sweeping', async () => {
      const { camera, cameraService } = build();
      const { session_id: sessionId } = await camera.startWebRtc('doorbell', OFFER);
      expect(camera.webRtcSweepInterval).to.not.equal(null);
      clock.tick(SESSION_TTL_MS);
      await camera.sweepWebRtcSessions();
      expect(camera.webRtcSessions.has(sessionId)).to.equal(false);
      sinon.assert.calledOnce(cameraService.device.stopWebRtc);
      expect(camera.webRtcSweepInterval).to.equal(null);
    });

    it('should sweep on its own interval', async () => {
      const { camera } = build();
      const sweep = sinon.spy(camera, 'sweepWebRtcSessions');
      await camera.startWebRtc('doorbell', OFFER);
      sweep.resetHistory();
      clock.tick(10 * 1000);
      sinon.assert.calledOnce(sweep);
    });
  });
});
