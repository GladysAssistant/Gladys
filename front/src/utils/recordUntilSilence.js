import { getSpeechUserMedia } from './speechMicrophoneAccess';
import { STT_SAMPLE_RATE, float32SamplesToSttWav } from './speechAudioForStt';

/** Target bitrate for voice upload (STT does not need hi-fi). */
const SPEECH_RECORDER_BITRATE = 24000;

/** Microphone constraints tuned for speech, not music. */
const SPEECH_AUDIO_CONSTRAINTS = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: { ideal: STT_SAMPLE_RATE }
};

const SPEECH_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mp4;codecs=mp4a.40.2'
];

/**
 * @description Create an AbortError-compatible error.
 * @returns {Error} Abort error.
 */
function createAbortError() {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Aborted', 'AbortError');
  }
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

/**
 * @description Returns true when the error is an abort/cancel error.
 * @param {Error} error - Error to check.
 * @returns {boolean} Whether the error is an abort error.
 */
export function isRecordUntilSilenceAbortError(error) {
  return Boolean(error && (error.name === 'AbortError' || error.message === 'Aborted'));
}

/**
 * @description Pick a MediaRecorder mime type supported by the browser.
 * @returns {string|undefined} Mime type or undefined if none supported.
 */
function pickSpeechMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  return SPEECH_MIME_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type));
}

/**
 * @description Safari/WebKit records MP4/AAC; decoding it for Whisper is unreliable.
 * Record PCM → WAV instead (Scaleway whisper-large-v3 expects WAV/MP3).
 * @returns {boolean} True when PCM recording should be used.
 */
function prefersPcmWavRecording() {
  if (typeof MediaRecorder === 'undefined') {
    return true;
  }
  if (!MediaRecorder.isTypeSupported) {
    return true;
  }
  return !SPEECH_MIME_CANDIDATES.some(type => type.includes('webm') && MediaRecorder.isTypeSupported(type));
}

/**
 * @description Create AudioContext with Safari prefix when needed.
 * @returns {AudioContext} Audio context instance.
 */
function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('AUDIO_CONTEXT_NOT_SUPPORTED');
  }
  return new AudioContextClass({ sampleRate: STT_SAMPLE_RATE });
}

/**
 * @description Create a MediaRecorder with low-bitrate speech settings when supported.
 * @param {MediaStream} stream - Microphone stream.
 * @returns {MediaRecorder} Recorder instance.
 */
function createSpeechMediaRecorder(stream) {
  const mimeType = pickSpeechMimeType();
  const options = { audioBitsPerSecond: SPEECH_RECORDER_BITRATE };
  if (mimeType) {
    options.mimeType = mimeType;
  }

  try {
    return new MediaRecorder(stream, options);
  } catch (e) {
    if (mimeType) {
      try {
        return new MediaRecorder(stream, { mimeType });
      } catch (e2) {
        return new MediaRecorder(stream);
      }
    }
    return new MediaRecorder(stream);
  }
}

/**
 * @description Compute RMS level from an analyser node.
 * @param {AnalyserNode} analyser - Audio analyser.
 * @param {Uint8Array} dataArray - Reusable buffer.
 * @returns {number} RMS value between 0 and 1.
 */
function computeRms(analyser, dataArray) {
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i += 1) {
    const sample = (dataArray[i] - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / dataArray.length);
}

/**
 * @description Run silence / max-duration detection until stopRecording is called.
 * @param {object} params - Loop parameters.
 * @param {AnalyserNode} params.analyser - Analyser for VAD.
 * @param {Uint8Array} params.dataArray - Reusable buffer.
 * @param {number} params.silenceThreshold - RMS silence threshold.
 * @param {number} params.silenceDurationMs - Silence duration before stop.
 * @param {number} params.maxDurationMs - Max recording duration.
 * @param {number} params.minRecordingMs - Min duration before silence can stop.
 * @param {AbortSignal} [params.signal] - Abort signal.
 * @param {() => boolean} params.isActive - Whether recording is still active.
 * @param {() => void} params.stopRecording - Called when silence or timeout is reached.
 * @param {() => void} params.onAbort - Called when aborted before/during stop.
 * @returns {() => void} Cancel function for the animation frame loop.
 */
function startSilenceDetection({
  analyser,
  dataArray,
  silenceThreshold,
  silenceDurationMs,
  maxDurationMs,
  minRecordingMs,
  signal,
  isActive,
  stopRecording,
  onAbort
}) {
  let silenceStart = null;
  const recordingStart = Date.now();
  let rafId = null;

  const tick = () => {
    if (!isActive()) {
      return;
    }

    if (signal && signal.aborted) {
      onAbort();
      return;
    }

    const rms = computeRms(analyser, dataArray);
    const elapsed = Date.now() - recordingStart;

    if (rms < silenceThreshold) {
      if (!silenceStart) {
        silenceStart = Date.now();
      } else if (Date.now() - silenceStart > silenceDurationMs && elapsed > minRecordingMs) {
        stopRecording();
        return;
      }
    } else {
      silenceStart = null;
    }

    if (elapsed > maxDurationMs) {
      stopRecording();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

/**
 * @description Record PCM and export 16 kHz mono WAV (Safari / WebKit).
 * @param {object} options - Same options as recordUntilSilence.
 * @returns {Promise<Blob>} WAV audio blob.
 */
async function recordUntilSilenceWithPcm({
  signal,
  silenceThreshold = 0.02,
  silenceDurationMs = 1500,
  maxDurationMs = 30000,
  minRecordingMs = 500
} = {}) {
  const stream = await getSpeechUserMedia({ audio: SPEECH_AUDIO_CONSTRAINTS });

  const stopStream = () => {
    stream.getTracks().forEach(track => track.stop());
  };

  if (signal && signal.aborted) {
    stopStream();
    throw createAbortError();
  }

  const audioContext = createAudioContext();
  let analyser;
  let processor;
  let silentGain;
  let cancelSilenceLoop = null;
  let recording = true;
  const pcmChunks = [];

  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);

    processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = event => {
      if (!recording) {
        return;
      }
      pcmChunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };

    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);
  } catch (e) {
    stopStream();
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
    throw e;
  }

  const dataArray = new Uint8Array(analyser.fftSize);

  return new Promise((resolve, reject) => {
    let aborted = false;
    let finished = false;

    const endRecording = async () => {
      if (finished || aborted) {
        return;
      }
      finished = true;
      recording = false;

      const sampleRate = audioContext.sampleRate;
      const totalLength = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Float32Array(totalLength);
      let writeOffset = 0;
      pcmChunks.forEach(chunk => {
        merged.set(chunk, writeOffset);
        writeOffset += chunk.length;
      });

      if (processor) {
        processor.onaudioprocess = null;
        processor.disconnect();
      }
      if (silentGain) {
        silentGain.disconnect();
      }
      stopStream();
      if (cancelSilenceLoop) {
        cancelSilenceLoop();
        cancelSilenceLoop = null;
      }
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      if (audioContext.state !== 'closed') {
        await audioContext.close();
      }

      try {
        const wavBlob = await float32SamplesToSttWav(merged, sampleRate);
        resolve(wavBlob);
      } catch (e) {
        reject(e);
      }
    };

    const rejectAbort = async () => {
      if (aborted || finished) {
        return;
      }
      aborted = true;
      recording = false;
      if (processor) {
        processor.onaudioprocess = null;
        processor.disconnect();
      }
      if (silentGain) {
        silentGain.disconnect();
      }
      stopStream();
      if (cancelSilenceLoop) {
        cancelSilenceLoop();
        cancelSilenceLoop = null;
      }
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      if (audioContext.state !== 'closed') {
        await audioContext.close();
      }
      reject(createAbortError());
    };

    const onAbort = () => {
      if (finished) {
        return;
      }
      rejectAbort().catch(reject);
    };

    if (signal) {
      signal.addEventListener('abort', onAbort);
    }

    cancelSilenceLoop = startSilenceDetection({
      analyser,
      dataArray,
      silenceThreshold,
      silenceDurationMs,
      maxDurationMs,
      minRecordingMs,
      signal,
      isActive: () => recording && !finished && !aborted,
      stopRecording: () => {
        endRecording().catch(reject);
      },
      onAbort
    });
  });
}

/**
 * @description Record with MediaRecorder (Chrome / Firefox WebM path).
 * @param {object} options - Same options as recordUntilSilence.
 * @returns {Promise<Blob>} Recorded audio blob.
 */
async function recordUntilSilenceWithMediaRecorder({
  signal,
  silenceThreshold = 0.02,
  silenceDurationMs = 1500,
  maxDurationMs = 30000,
  minRecordingMs = 500
} = {}) {
  const stream = await getSpeechUserMedia({ audio: SPEECH_AUDIO_CONSTRAINTS });

  const stopStream = () => {
    stream.getTracks().forEach(track => track.stop());
  };

  if (signal && signal.aborted) {
    stopStream();
    throw createAbortError();
  }

  const chunks = [];
  let mediaRecorder;
  let audioContext;
  let analyser;

  try {
    mediaRecorder = createSpeechMediaRecorder(stream);
    audioContext = createAudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
  } catch (e) {
    stopStream();
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close();
    }
    throw e;
  }

  const dataArray = new Uint8Array(analyser.fftSize);

  return new Promise((resolve, reject) => {
    let cancelSilenceLoop = null;
    let aborted = false;

    const releaseResources = async () => {
      stopStream();
      if (cancelSilenceLoop) {
        cancelSilenceLoop();
        cancelSilenceLoop = null;
      }
      if (audioContext.state !== 'closed') {
        await audioContext.close();
      }
    };

    const rejectAbort = () => {
      if (aborted) {
        return;
      }
      aborted = true;
      releaseResources().then(() => reject(createAbortError()));
    };

    const onAbort = () => {
      aborted = true;
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
      }
      rejectAbort();
    };

    if (signal) {
      signal.addEventListener('abort', onAbort);
    }

    mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      releaseResources()
        .then(() => {
          if (aborted) {
            reject(createAbortError());
            return;
          }
          const recordedType = mediaRecorder.mimeType || pickSpeechMimeType() || 'audio/webm';
          resolve(new Blob(chunks, { type: recordedType }));
        })
        .catch(reject);
    };

    mediaRecorder.onerror = () => {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      releaseResources().then(() => reject(new Error('MEDIA_RECORDER_ERROR')));
    };

    mediaRecorder.start(250);

    cancelSilenceLoop = startSilenceDetection({
      analyser,
      dataArray,
      silenceThreshold,
      silenceDurationMs,
      maxDurationMs,
      minRecordingMs,
      signal,
      isActive: () => mediaRecorder.state === 'recording' && !aborted,
      stopRecording: () => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      },
      onAbort: () => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        } else {
          rejectAbort();
        }
      }
    });
  });
}

/**
 * @description Record audio from the microphone until silence is detected.
 * WebKit/Safari uses PCM→WAV (Whisper / Scaleway). Chrome/Firefox use WebM.
 * @param {object} options - Recording options.
 * @param {AbortSignal} [options.signal] - Abort signal to cancel recording.
 * @param {number} [options.silenceThreshold=0.02] - RMS threshold below which audio is considered silent.
 * @param {number} [options.silenceDurationMs=1500] - Duration of silence before stopping (ms).
 * @param {number} [options.maxDurationMs=30000] - Maximum recording duration (ms).
 * @param {number} [options.minRecordingMs=500] - Minimum recording duration before silence can stop (ms).
 * @returns {Promise<Blob>} Recorded audio blob.
 */
export async function recordUntilSilence(options = {}) {
  if (options.signal && options.signal.aborted) {
    throw createAbortError();
  }

  if (prefersPcmWavRecording()) {
    return recordUntilSilenceWithPcm(options);
  }

  return recordUntilSilenceWithMediaRecorder(options);
}
