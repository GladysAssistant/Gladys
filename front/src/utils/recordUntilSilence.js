/** Target bitrate for voice upload (STT does not need hi-fi). */
const SPEECH_RECORDER_BITRATE = 24000;

/** Microphone constraints tuned for speech, not music. */
const SPEECH_AUDIO_CONSTRAINTS = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: { ideal: 16000 }
};

const SPEECH_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

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
 * @description Record audio from the microphone until silence is detected.
 * @param {object} options - Recording options.
 * @param {AbortSignal} [options.signal] - Abort signal to cancel recording.
 * @param {number} [options.silenceThreshold=0.02] - RMS threshold below which audio is considered silent.
 * @param {number} [options.silenceDurationMs=1500] - Duration of silence before stopping (ms).
 * @param {number} [options.maxDurationMs=30000] - Maximum recording duration (ms).
 * @param {number} [options.minRecordingMs=500] - Minimum recording duration before silence can stop (ms).
 * @returns {Promise<Blob>} Recorded audio blob.
 */
export async function recordUntilSilence({
  signal,
  silenceThreshold = 0.02,
  silenceDurationMs = 1500,
  maxDurationMs = 30000,
  minRecordingMs = 500
} = {}) {
  if (signal && signal.aborted) {
    throw createAbortError();
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: SPEECH_AUDIO_CONSTRAINTS });

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
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
  } catch (e) {
    stopStream();
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    throw e;
  }

  const dataArray = new Uint8Array(analyser.fftSize);

  return new Promise((resolve, reject) => {
    let silenceStart = null;
    const recordingStart = Date.now();
    let rafId = null;
    let aborted = false;

    const releaseResources = () => {
      stopStream();
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };

    const rejectAbort = () => {
      if (aborted) {
        return;
      }
      aborted = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      releaseResources();
      reject(createAbortError());
    };

    const onAbort = () => {
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
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      releaseResources();
      if (aborted) {
        reject(createAbortError());
        return;
      }
      resolve(new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' }));
    };

    mediaRecorder.onerror = () => {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      releaseResources();
      reject(new Error('MEDIA_RECORDER_ERROR'));
    };

    mediaRecorder.start(250);

    const checkSilence = () => {
      if (aborted || (signal && signal.aborted)) {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        } else {
          rejectAbort();
        }
        return;
      }

      if (mediaRecorder.state !== 'recording') {
        return;
      }

      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        const sample = (dataArray[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const elapsed = Date.now() - recordingStart;

      if (rms < silenceThreshold) {
        if (!silenceStart) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > silenceDurationMs && elapsed > minRecordingMs) {
          mediaRecorder.stop();
          return;
        }
      } else {
        silenceStart = null;
      }

      if (elapsed > maxDurationMs) {
        mediaRecorder.stop();
        return;
      }

      rafId = requestAnimationFrame(checkSilence);
    };

    rafId = requestAnimationFrame(checkSilence);
  });
}
