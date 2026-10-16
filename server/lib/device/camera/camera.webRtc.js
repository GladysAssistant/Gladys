const { v4: uuidv4 } = require('uuid');
const get = require('get-value');

const logger = require('../../../utils/logger');
const {
  BadParameters,
  NotFoundError,
  ServiceNotConfiguredError,
  TooManyRequests,
} = require('../../../utils/coreErrors');
const { getDeviceParam, isCameraEnabled } = require('../../../utils/device');
const { CAMERA_STREAM_PROTOCOL_PARAM, CAMERA_STREAM_PROTOCOLS } = require('../../../utils/constants');

// A complete offer (every ICE candidate inlined, no trickle) is a few KB: the bound only keeps an
// oversized body from reaching the camera's service.
const MAX_SDP_LENGTH = 64 * 1024;
// The browser pings every 10s while the video is on screen. A tab closed or a network gone
// without a stop leaves no ping: the session is ended for it, so the camera's cloud does not keep
// a stream nobody watches.
const SESSION_TTL_MS = 30 * 1000;
const SWEEP_INTERVAL_MS = 10 * 1000;
// Live views open at the same time on the instance, every camera and user together
const MAX_SESSIONS = 20;

/**
 * @description Tell if a camera negotiates its live view in WebRTC.
 * @param {object} device - The camera device.
 * @returns {boolean} True when the device declares the WebRTC stream protocol.
 * @example
 * isWebRtcCamera({ params: [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'webrtc' }] });
 */
function isWebRtcCamera(device) {
  return getDeviceParam(device, CAMERA_STREAM_PROTOCOL_PARAM) === CAMERA_STREAM_PROTOCOLS.WEBRTC;
}

/**
 * @description End a WebRTC session on the camera's service. A failure is only logged: the
 * session is already forgotten by Gladys, and the vendor ends an abandoned stream on its side.
 * @param {object} session - The session to end.
 * @returns {Promise} Resolve when the service was told.
 * @example
 * await this.endWebRtcSession(session);
 */
async function endWebRtcSession(session) {
  const device = this.stateManager.get('device', session.selector);
  const service = this.serviceManager.getServiceById(session.serviceId);
  if (device === null || typeof get(service, 'device.stopWebRtc') !== 'function') {
    return;
  }
  try {
    await service.device.stopWebRtc(device, { sessionId: session.serviceSessionId, streamId: session.streamId });
  } catch (e) {
    logger.warn(`Camera ${session.selector}: unable to stop the WebRTC session: ${e.message}`);
  }
}

/**
 * @description End the sessions no browser pinged for SESSION_TTL_MS, and stop sweeping once
 * none is left.
 * @returns {Promise} Resolve when the expired sessions are ended.
 * @example
 * await this.sweepWebRtcSessions();
 */
async function sweepWebRtcSessions() {
  const now = Date.now();
  const expired = [...this.webRtcSessions.values()].filter((session) => session.expiresAt <= now);
  expired.forEach((session) => this.webRtcSessions.delete(session.id));
  if (this.webRtcSessions.size === 0 && this.webRtcSweepInterval) {
    clearInterval(this.webRtcSweepInterval);
    this.webRtcSweepInterval = null;
  }
  await Promise.all(
    expired.map((session) => {
      logger.debug(`Camera ${session.selector}: WebRTC session ${session.id} expired without a stop`);
      return this.endWebRtcSession(session);
    }),
  );
}

/**
 * @description Start a WebRTC live view: relay the browser's SDP offer to the camera's service
 * and give its SDP answer back. Only the signalling goes through Gladys.
 * @param {string} selector - Selector of the camera.
 * @param {string} sdp - The browser's SDP offer, with every ICE candidate.
 * @returns {Promise<object>} Resolve with { session_id, sdp_answer }.
 * @example
 * const { session_id, sdp_answer } = await camera.startWebRtc('doorbell', 'v=0...');
 */
async function startWebRtc(selector, sdp) {
  if (typeof sdp !== 'string' || sdp.length === 0 || sdp.length > MAX_SDP_LENGTH) {
    throw new BadParameters(`sdp must be a non-empty string of at most ${MAX_SDP_LENGTH} characters`);
  }
  const device = this.stateManager.get('device', selector);
  if (device === null) {
    throw new NotFoundError('Camera not found');
  }
  // A disabled camera never streams (docs/specs/camera-enable-disable.md)
  if (!isCameraEnabled(device)) {
    throw new NotFoundError('Camera is disabled');
  }
  if (!isWebRtcCamera(device)) {
    throw new BadParameters('CAMERA_WEBRTC_NOT_SUPPORTED');
  }
  const service = this.serviceManager.getServiceById(device.service_id);
  if (service === null) {
    throw new ServiceNotConfiguredError('Service is not found or not configured.');
  }
  if (typeof get(service, 'device.startWebRtc') !== 'function') {
    throw new BadParameters('CAMERA_WEBRTC_NOT_SUPPORTED');
  }
  await this.sweepWebRtcSessions();
  if (this.webRtcSessions.size >= MAX_SESSIONS) {
    throw new TooManyRequests('CAMERA_WEBRTC_TOO_MANY_SESSIONS', SESSION_TTL_MS);
  }

  const sessionId = uuidv4();
  const answer = await service.device.startWebRtc(device, { sessionId, sdp });
  this.webRtcSessions.set(sessionId, {
    id: sessionId,
    selector,
    serviceId: device.service_id,
    serviceSessionId: answer.sessionId,
    streamId: answer.streamId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  if (!this.webRtcSweepInterval) {
    // unref: a sweep due never keeps Gladys from shutting down
    this.webRtcSweepInterval = setInterval(() => this.sweepWebRtcSessions(), SWEEP_INTERVAL_MS).unref();
  }
  logger.debug(`Camera ${selector}: WebRTC session ${sessionId} started`);
  return { session_id: sessionId, sdp_answer: answer.sdpAnswer };
}

/**
 * @description Keep a WebRTC session alive while its video is on screen. A camera turned off (or
 * deleted) meanwhile ends the session here: the media does not go through Gladys, so the ping is
 * where the "a disabled camera never streams" rule is enforced on a stream already running.
 * @param {string} selector - Selector of the camera.
 * @param {string} sessionId - The session id startWebRtc returned.
 * @returns {Promise} Resolve when the session is extended.
 * @example
 * await camera.pingWebRtc('doorbell', '0c2d…');
 */
async function pingWebRtc(selector, sessionId) {
  const session = this.webRtcSessions.get(sessionId);
  // An unknown session is the browser's cue that its stream is over (expired, or Gladys restarted)
  if (!session || session.selector !== selector || session.expiresAt <= Date.now()) {
    throw new NotFoundError('CAMERA_WEBRTC_SESSION_NOT_FOUND');
  }
  const device = this.stateManager.get('device', selector);
  if (device === null || !isCameraEnabled(device)) {
    this.webRtcSessions.delete(sessionId);
    await this.endWebRtcSession(session);
    throw new NotFoundError('CAMERA_WEBRTC_SESSION_NOT_FOUND');
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
}

/**
 * @description Stop a WebRTC live view. Stopping a session that is already gone is a no-op: the
 * browser stops on every exit path, some of which race with the expiry.
 * @param {string} selector - Selector of the camera.
 * @param {string} sessionId - The session id startWebRtc returned.
 * @returns {Promise} Resolve when the session is ended.
 * @example
 * await camera.stopWebRtc('doorbell', '0c2d…');
 */
async function stopWebRtc(selector, sessionId) {
  const session = this.webRtcSessions.get(sessionId);
  if (!session || session.selector !== selector) {
    return;
  }
  this.webRtcSessions.delete(sessionId);
  logger.debug(`Camera ${selector}: WebRTC session ${sessionId} stopped`);
  await this.endWebRtcSession(session);
}

module.exports = {
  startWebRtc,
  pingWebRtc,
  stopWebRtc,
  endWebRtcSession,
  sweepWebRtcSessions,
  SESSION_TTL_MS,
  MAX_SESSIONS,
  MAX_SDP_LENGTH,
};
