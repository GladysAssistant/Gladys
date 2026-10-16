const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { BadParameters, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

const OFFER = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n';
const ANSWER = 'v=0\r\no=- 3 4 IN IP4 0.0.0.0\r\n';

const DOORBELL = {
  external_id: 'ext:netatmo:doorbell',
  selector: 'doorbell',
  params: [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'webrtc' }],
};
const DEVICE_PAYLOAD = {
  external_id: 'ext:netatmo:doorbell',
  selector: 'doorbell',
  params: [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'webrtc' }],
};

const buildProxy = async (commandResult) => {
  const service = await seedExternalService();
  const { externalIntegration, stateManager } = buildSupervisor();
  externalIntegration.sendCommand = fake.resolves(commandResult);
  externalIntegration.registerProxyService(service);
  return { service, externalIntegration, proxyService: stateManager.get('service', service.name) };
};

describe('externalIntegration proxy-service startWebRtc', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should relay the offer with the 15s deadline and return the answer', async () => {
    const { service, externalIntegration, proxyService } = await buildProxy({
      success: true,
      data: { sdp_answer: ANSWER, session_id: 'netatmo-session', stream_id: 'tag-1' },
    });
    const answer = await proxyService.device.startWebRtc(DOORBELL, { sessionId: 'gladys-session', sdp: OFFER });
    expect(answer).to.deep.equal({ sdpAnswer: ANSWER, sessionId: 'netatmo-session', streamId: 'tag-1' });
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CAMERA_WEBRTC_OFFER,
      { device: DEVICE_PAYLOAD, session_id: 'gladys-session', sdp: OFFER },
      // the integration waits for the camera's cloud: 15s, not the 5s command rule
      { timeoutMs: 15000 },
    );
  });

  it('should keep the session id Gladys gave when the integration names none', async () => {
    const { proxyService } = await buildProxy({ success: true, data: { sdp_answer: ANSWER } });
    const answer = await proxyService.device.startWebRtc(DOORBELL, { sessionId: 'gladys-session', sdp: OFFER });
    expect(answer).to.deep.equal({ sdpAnswer: ANSWER, sessionId: 'gladys-session', streamId: null });
  });

  it('should refuse an answer the browser could not use', async () => {
    const invalidResults = [
      { success: true },
      { success: true, data: {} },
      { success: true, data: { sdp_answer: '' } },
      { success: true, data: { sdp_answer: 42 } },
      { success: true, data: { sdp_answer: 'a'.repeat(64 * 1024 + 1) } },
      { success: true, data: { sdp_answer: ANSWER, session_id: 42 } },
      { success: true, data: { sdp_answer: ANSWER, stream_id: 'a'.repeat(257) } },
    ];
    // one integration: the proxy reads sendCommand at call time
    const { proxyService, externalIntegration } = await buildProxy({});
    await Promise.all(
      invalidResults.map(async (result) => {
        externalIntegration.sendCommand = fake.resolves(result);
        const promise = proxyService.device.startWebRtc(DOORBELL, { sessionId: 'gladys-session', sdp: OFFER });
        try {
          await promise;
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
          expect(e.message).to.equal('EXTERNAL_INTEGRATION_INVALID_WEBRTC_ANSWER');
        }
      }),
    );
  });

  it('should let a command error through (integration disconnected, timeout)', async () => {
    const { proxyService, externalIntegration } = await buildProxy({});
    externalIntegration.sendCommand = fake.rejects(
      new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT'),
    );
    try {
      await proxyService.device.startWebRtc(DOORBELL, { sessionId: 'gladys-session', sdp: OFFER });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT');
    }
  });
});

describe('externalIntegration proxy-service stopWebRtc', () => {
  it('should relay the stop with the ids the integration gave', async () => {
    const { service, externalIntegration, proxyService } = await buildProxy({ success: true });
    await proxyService.device.stopWebRtc(DOORBELL, { sessionId: 'netatmo-session', streamId: 'tag-1' });
    sinonAssert.calledOnceWithExactly(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CAMERA_WEBRTC_STOP,
      { device: DEVICE_PAYLOAD, session_id: 'netatmo-session', stream_id: 'tag-1' },
    );
  });
});

describe('externalIntegration reserved GLADYS_CAMERA_STREAM_PROTOCOL param', () => {
  const buildCamera = (service, params) => ({
    name: 'Sonnette',
    external_id: `ext:${service.selector}:doorbell`,
    features: [],
    params,
  });

  it('should accept a camera declaring a WebRTC live view', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const count = await externalIntegration.setDiscoveredDevices(service, [
      buildCamera(service, [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'webrtc' }]),
    ]);
    expect(count).to.equal(1);
  });

  it('should refuse a protocol Gladys cannot negotiate', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const invalidParamsLists = [
      [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'hls' }],
      [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'WEBRTC' }],
      [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: '' }],
    ];
    await Promise.all(
      invalidParamsLists.map(async (params) => {
        try {
          await externalIntegration.setDiscoveredDevices(service, [buildCamera(service, params)]);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
          expect(e.message).to.contain('must be one of webrtc');
        }
      }),
    );
  });
});
