import { recordSpeechCommandUntilSilence } from './speechCommandRecorder';

/**
 * @description Returns true when the error is an abort/cancel error.
 * @param {Error} error - Error to check.
 * @returns {boolean} Whether the error is an abort error.
 * @example
 * isRecordUntilSilenceAbortError(new DOMException('Aborted', 'AbortError'));
 */
export function isRecordUntilSilenceAbortError(error) {
  return Boolean(error && (error.name === 'AbortError' || error.message === 'Aborted'));
}

/**
 * @description Record audio from the microphone until the user stops speaking.
 * @param {object} options - Recording options.
 * @param {AbortSignal} [options.signal] - Abort signal to cancel recording.
 * @param {() => void} [options.onReady] - Called once microphone capture is active.
 * @returns {Promise<Blob>} 16 kHz mono WAV blob.
 * @example
 * recordUntilSilence({ signal });
 */
export async function recordUntilSilence(options = {}) {
  return recordSpeechCommandUntilSilence(options);
}
