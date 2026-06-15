/** @typedef {'INSECURE_CONTEXT'|'NOT_SUPPORTED'|'PERMISSION_DENIED'|'NO_MICROPHONE'|'MICROPHONE_UNAVAILABLE'|'NO_SPEECH'} SpeechRecordingErrorCode */

/**
 * @description Error thrown when the microphone cannot be used for speech recording.
 */
export class SpeechRecordingError extends Error {
  /**
   * @param {SpeechRecordingErrorCode} code - Error category.
   * @param {Error} [cause] - Original DOM error.
   */
  constructor(code, cause) {
    super(code);
    this.name = 'SpeechRecordingError';
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * @description Returns the getUserMedia function when available.
 * @returns {((constraints: MediaStreamConstraints) => Promise<MediaStream>)|null} getUserMedia or null.
 */
function resolveGetUserMedia() {
  if (typeof navigator === 'undefined') {
    return null;
  }

  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    return constraints => navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  if (typeof legacyGetUserMedia === 'function') {
    return constraints =>
      new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
      });
  }

  return null;
}

/**
 * @description Whether the page runs in a secure context (HTTPS or localhost).
 * getUserMedia is unavailable on iOS Safari over plain HTTP.
 * @returns {boolean} True when secure.
 */
export function isSecureRecordingContext() {
  if (typeof window === 'undefined') {
    return false;
  }
  if (window.isSecureContext === true) {
    return true;
  }
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * @description Whether speech recording APIs are available in this browser.
 * @returns {boolean} True when getUserMedia can be called.
 */
export function isSpeechRecordingSupported() {
  if (!isSecureRecordingContext()) {
    return false;
  }
  return resolveGetUserMedia() !== null;
}

/**
 * @description Reason why the microphone is unavailable (for UI hints).
 * @returns {SpeechRecordingErrorCode|null} Error code or null if available.
 */
export function getSpeechRecordingUnavailableReason() {
  if (!isSecureRecordingContext()) {
    return 'INSECURE_CONTEXT';
  }
  if (!resolveGetUserMedia()) {
    return 'NOT_SUPPORTED';
  }
  return null;
}

/**
 * @description Returns true when the error is a SpeechRecordingError.
 * @param {Error} error - Error to check.
 * @returns {boolean} Whether the error is a SpeechRecordingError.
 */
export function isSpeechRecordingError(error) {
  return Boolean(error && error.name === 'SpeechRecordingError');
}

/**
 * @description Map a getUserMedia DOM error to a SpeechRecordingError when possible.
 * @param {Error} error - DOM error from getUserMedia.
 * @returns {SpeechRecordingError|Error} Mapped error.
 */
function mapGetUserMediaError(error) {
  if (!error) {
    return error;
  }
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return new SpeechRecordingError('PERMISSION_DENIED', error);
  }
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return new SpeechRecordingError('NO_MICROPHONE', error);
  }
  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return new SpeechRecordingError('MICROPHONE_UNAVAILABLE', error);
  }
  if (error.name === 'OverconstrainedError') {
    return new SpeechRecordingError('NO_MICROPHONE', error);
  }
  return error;
}

/**
 * @description Probe whether an audio input device is available.
 * Requires microphone permission for reliable device IDs on some browsers.
 * @returns {Promise<SpeechRecordingErrorCode|null>} Error code or null when a mic may be available.
 */
export async function probeMicrophoneAvailability() {
  const unavailableReason = getSpeechRecordingUnavailableReason();
  if (unavailableReason) {
    return unavailableReason;
  }

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
    return null;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    if (audioInputs.length === 0) {
      return 'NO_MICROPHONE';
    }
    const hasUsableInput = audioInputs.some(device => device.deviceId && device.deviceId !== 'default');
    if (!hasUsableInput && audioInputs.every(device => !device.label)) {
      return null;
    }
    if (!hasUsableInput && audioInputs.length > 0 && audioInputs.every(device => device.deviceId === '')) {
      return null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * @description Request microphone access for speech recording.
 * @param {MediaStreamConstraints} constraints - getUserMedia constraints.
 * @returns {Promise<MediaStream>} Media stream.
 */
export async function getSpeechUserMedia(constraints) {
  if (!isSecureRecordingContext()) {
    throw new SpeechRecordingError('INSECURE_CONTEXT');
  }

  const getUserMedia = resolveGetUserMedia();
  if (!getUserMedia) {
    throw new SpeechRecordingError('NOT_SUPPORTED');
  }

  try {
    return await getUserMedia(constraints);
  } catch (e) {
    throw mapGetUserMediaError(e);
  }
}
