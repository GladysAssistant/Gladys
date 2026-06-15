import { float32SamplesToSttWav } from './speechAudioForStt';
import { getSpeechUserMedia, SpeechRecordingError } from './speechMicrophoneAccess';

const DEFAULT_OPTIONS = {
  silenceThreshold: 0.01,
  speechThreshold: 0.015,
  silenceDurationMs: 1200,
  maxDurationMs: 30000,
  maxWaitForSpeechMs: 12000
};

const SPEECH_AUDIO_CONSTRAINTS = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
};

const WORKLET_NAME = 'gladys-speech-command-recorder';

const WORKLET_SOURCE = `
class GladysSpeechCommandRecorder extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const processorOptions = options.processorOptions || {};
    this.chunks = [];
    this.sampleCount = 0;
    this.silenceSamples = 0;
    this.speechDetected = false;
    this.stopRequested = false;
    this.stopReason = null;
    this.noiseFloor = 0.003;
    this.silenceThreshold = processorOptions.silenceThreshold;
    this.speechThreshold = processorOptions.speechThreshold;
    this.silenceDurationSamples = Math.round((processorOptions.silenceDurationMs / 1000) * sampleRate);
    this.maxDurationSamples = Math.round((processorOptions.maxDurationMs / 1000) * sampleRate);
    this.maxWaitForSpeechSamples = Math.round((processorOptions.maxWaitForSpeechMs / 1000) * sampleRate);
    this.hasSentReady = false;
    this.port.onmessage = event => {
      if (event.data && event.data.type === 'flush') {
        this.flush();
      }
    };
  }

  computeRms(channel) {
    let sum = 0;
    for (let i = 0; i < channel.length; i += 1) {
      sum += channel[i] * channel[i];
    }
    return Math.sqrt(sum / channel.length);
  }

  requestStop(reason) {
    if (this.stopRequested) {
      return;
    }
    this.stopRequested = true;
    this.stopReason = reason;
    this.port.postMessage({ type: 'stop', reason });
  }

  flush() {
    const samples = new Float32Array(this.sampleCount);
    let offset = 0;
    for (let i = 0; i < this.chunks.length; i += 1) {
      samples.set(this.chunks[i], offset);
      offset += this.chunks[i].length;
    }
    this.chunks = [];
    this.port.postMessage(
      {
        type: 'recording',
        samples,
        sampleRate,
        reason: this.stopReason || 'manual'
      },
      [samples.buffer]
    );
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel || channel.length === 0) {
      return true;
    }

    if (!this.hasSentReady) {
      this.hasSentReady = true;
      this.port.postMessage({ type: 'ready' });
    }

    const copy = new Float32Array(channel.length);
    copy.set(channel);
    this.chunks.push(copy);
    this.sampleCount += copy.length;

    const rms = this.computeRms(channel);
    if (!this.speechDetected) {
      this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
      const speechThreshold = Math.max(this.speechThreshold, this.noiseFloor * 3);
      if (rms >= speechThreshold) {
        this.speechDetected = true;
        this.silenceSamples = 0;
      } else if (this.sampleCount >= this.maxWaitForSpeechSamples) {
        this.requestStop('no_speech');
      }
    } else {
      const silenceThreshold = Math.max(this.silenceThreshold, Math.min(0.03, this.noiseFloor * 2.5));
      if (rms < silenceThreshold) {
        this.silenceSamples += copy.length;
        if (this.silenceSamples >= this.silenceDurationSamples) {
          this.requestStop('silence');
        }
      } else {
        this.silenceSamples = 0;
      }
    }

    if (this.sampleCount >= this.maxDurationSamples) {
      this.requestStop('max_duration');
    }

    return true;
  }
}

registerProcessor('${WORKLET_NAME}', GladysSpeechCommandRecorder);
`;

let workletUrl = null;
let preloadedAudioContext = null;
let preloadPromise = null;
const loadedAudioContexts = new WeakSet();
let preparedStream = null;
let preparedStreamPromise = null;
let preparedStreamCleanupTimeout = null;

/**
 * @description Create an AbortError-compatible error.
 * @returns {Error} Abort error.
 * @example
 * createAbortError();
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
 * @description Create AudioContext with Safari prefix when needed.
 * @returns {AudioContext} Audio context instance.
 * @example
 * createAudioContext();
 */
function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('AUDIO_CONTEXT_NOT_SUPPORTED');
  }
  return new AudioContextClass();
}

/**
 * @description Return true when an error is an abort error.
 * @param {Error} error - Error to inspect.
 * @returns {boolean} Whether it is an abort error.
 * @example
 * isAbortError(new DOMException('Aborted', 'AbortError'));
 */
function isAbortError(error) {
  return Boolean(error && (error.name === 'AbortError' || error.message === 'Aborted'));
}

/**
 * @description Stop all tracks in a media stream.
 * @param {MediaStream} stream - Media stream to stop.
 * @returns {void}
 * @example
 * stopStream(stream);
 */
function stopStream(stream) {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * @description Clear the prepared stream cleanup timer.
 * @returns {void}
 * @example
 * clearPreparedStreamCleanup();
 */
function clearPreparedStreamCleanup() {
  if (preparedStreamCleanupTimeout) {
    clearTimeout(preparedStreamCleanupTimeout);
    preparedStreamCleanupTimeout = null;
  }
}

/**
 * @description Schedule cleanup for a prepared stream if it is not consumed soon.
 * @returns {void}
 * @example
 * schedulePreparedStreamCleanup();
 */
function schedulePreparedStreamCleanup() {
  clearPreparedStreamCleanup();
  preparedStreamCleanupTimeout = setTimeout(() => {
    if (preparedStream) {
      stopStream(preparedStream);
      preparedStream = null;
    }
    preparedStreamPromise = null;
    preparedStreamCleanupTimeout = null;
  }, 5000);
}

/**
 * @description Return true only when the browser reports an already-granted microphone permission.
 * @returns {Promise<boolean>} Whether getUserMedia can be called without opening a permission prompt.
 * @example
 * isMicrophonePermissionAlreadyGranted();
 */
async function isMicrophonePermissionAlreadyGranted() {
  if (typeof navigator === 'undefined' || !navigator.permissions || typeof navigator.permissions.query !== 'function') {
    return false;
  }

  try {
    const status = await navigator.permissions.query({ name: 'microphone' });
    return status && status.state === 'granted';
  } catch (e) {
    return false;
  }
}

/**
 * @description Merge Float32 PCM chunks into one buffer.
 * @param {Float32Array[]} chunks - PCM chunks.
 * @returns {Float32Array} Merged samples.
 * @example
 * mergeChunks([new Float32Array([0, 1])]);
 */
function mergeChunks(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const samples = new Float32Array(totalLength);
  let offset = 0;
  chunks.forEach(chunk => {
    samples.set(chunk, offset);
    offset += chunk.length;
  });
  return samples;
}

/**
 * @description Compute RMS for one Float32 PCM buffer.
 * @param {Float32Array} samples - PCM samples.
 * @returns {number} RMS level.
 * @example
 * computeRms(new Float32Array([0, 0.1]));
 */
function computeRms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * @description Run an async operation from a synchronous callback and route errors to reject.
 * @param {() => Promise<void>} operation - Async operation.
 * @param {(error: Error) => void} reject - Promise reject function.
 * @returns {void}
 * @example
 * settleAsync(async () => {}, reject);
 */
async function settleAsync(operation, reject) {
  try {
    await operation();
  } catch (e) {
    reject(e);
  }
}

/**
 * @description Load the inline AudioWorklet module.
 * @param {AudioContext} audioContext - Active audio context.
 * @returns {Promise<void>} Resolves once loaded.
 * @example
 * loadWorklet(audioContext);
 */
async function loadWorklet(audioContext) {
  if (!audioContext.audioWorklet) {
    throw new Error('AUDIO_WORKLET_NOT_SUPPORTED');
  }
  if (loadedAudioContexts.has(audioContext)) {
    return;
  }
  if (!workletUrl) {
    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
    workletUrl = URL.createObjectURL(blob);
  }
  await audioContext.audioWorklet.addModule(workletUrl);
  loadedAudioContexts.add(audioContext);
}

/**
 * @description Preload the AudioWorklet so the first click starts recording faster.
 * @returns {Promise<void>} Resolves once the worklet is ready.
 * @example
 * preloadSpeechCommandRecorder();
 */
export function preloadSpeechCommandRecorder() {
  if (preloadedAudioContext && preloadedAudioContext.state !== 'closed') {
    return preloadPromise || Promise.resolve();
  }
  try {
    preloadedAudioContext = createAudioContext();
    const preload = async () => {
      try {
        await loadWorklet(preloadedAudioContext);
      } catch (e) {
        if (preloadedAudioContext && preloadedAudioContext.state !== 'closed') {
          await preloadedAudioContext.close();
        }
        preloadedAudioContext = null;
        throw e;
      }
    };
    preloadPromise = preload();
    return preloadPromise;
  } catch (e) {
    preloadedAudioContext = null;
    return Promise.reject(e);
  }
}

/**
 * @description Prepare microphone access before the click handler consumes it.
 * @returns {Promise<void>} Resolves once the microphone stream is ready.
 * @example
 * prepareSpeechCommandRecording();
 */
export async function prepareSpeechCommandRecording() {
  if (!(await isMicrophonePermissionAlreadyGranted())) {
    return;
  }
  await preloadSpeechCommandRecorder();
  if (preparedStream && preparedStream.active) {
    schedulePreparedStreamCleanup();
    return;
  }
  if (!preparedStreamPromise) {
    const openPreparedStream = async () => {
      try {
        const stream = await getSpeechUserMedia({ audio: SPEECH_AUDIO_CONSTRAINTS });
        preparedStream = stream;
        schedulePreparedStreamCleanup();
        return stream;
      } catch (e) {
        preparedStream = null;
        preparedStreamPromise = null;
        throw e;
      }
    };
    preparedStreamPromise = openPreparedStream();
  }
  await preparedStreamPromise;
}

/**
 * @description Consume a previously prepared stream, or open one now.
 * @returns {Promise<MediaStream>} Microphone stream.
 * @example
 * consumePreparedStream();
 */
async function consumePreparedStream() {
  if (preparedStream && preparedStream.active) {
    const stream = preparedStream;
    preparedStream = null;
    preparedStreamPromise = null;
    clearPreparedStreamCleanup();
    return stream;
  }
  if (preparedStreamPromise) {
    const stream = await preparedStreamPromise;
    preparedStream = null;
    preparedStreamPromise = null;
    clearPreparedStreamCleanup();
    return stream;
  }
  return getSpeechUserMedia({ audio: SPEECH_AUDIO_CONSTRAINTS });
}

/**
 * @description Take the preloaded context if available, otherwise create a fresh one.
 * @returns {Promise<AudioContext>} Prepared audio context.
 * @example
 * getPreparedAudioContext();
 */
async function getPreparedAudioContext() {
  if (preloadedAudioContext && preloadedAudioContext.state !== 'closed') {
    if (preloadPromise) {
      await preloadPromise;
    }
    const audioContext = preloadedAudioContext;
    preloadedAudioContext = null;
    preloadPromise = null;
    return audioContext;
  }
  return createAudioContext();
}

/**
 * @description Create options passed to the AudioWorklet processor.
 * @param {object} options - Recording options.
 * @returns {object} Worklet options.
 * @example
 * buildWorkletOptions({ silenceDurationMs: 1200 });
 */
function buildWorkletOptions(options) {
  return {
    silenceThreshold: options.silenceThreshold,
    speechThreshold: options.speechThreshold,
    silenceDurationMs: options.silenceDurationMs,
    maxDurationMs: options.maxDurationMs,
    maxWaitForSpeechMs: options.maxWaitForSpeechMs
  };
}

/**
 * @description Record speech using AudioWorklet and return a 16 kHz mono WAV blob.
 * @param {MediaStream} stream - Microphone stream.
 * @param {object} options - Recording options.
 * @param {AbortSignal} [options.signal] - Abort signal.
 * @param {() => void} [options.onReady] - Called once the audio graph receives the first microphone frame.
 * @returns {Promise<Blob>} WAV blob.
 * @example
 * recordWithAudioWorklet(stream, options);
 */
async function recordWithAudioWorklet(stream, options) {
  const audioContext = await getPreparedAudioContext();
  let source;
  let recorderNode;
  let silentGain;
  let finished = false;

  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    await loadWorklet(audioContext);
    source = audioContext.createMediaStreamSource(stream);
    recorderNode = new AudioWorkletNode(audioContext, WORKLET_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      processorOptions: buildWorkletOptions(options)
    });
    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    source.connect(recorderNode);
    recorderNode.connect(silentGain);
    silentGain.connect(audioContext.destination);
  } catch (e) {
    if (source) {
      source.disconnect();
    }
    if (recorderNode) {
      recorderNode.disconnect();
    }
    if (silentGain) {
      silentGain.disconnect();
    }
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
    throw e;
  }

  const cleanup = async () => {
    recorderNode.port.onmessage = null;
    recorderNode.port.close();
    recorderNode.disconnect();
    silentGain.disconnect();
    source.disconnect();
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  };

  return new Promise((resolve, reject) => {
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      recorderNode.port.postMessage({ type: 'flush' });
    };

    const abort = () => {
      if (finished) {
        return;
      }
      finished = true;
      const rejectAbort = async () => {
        await cleanup();
        reject(createAbortError());
      };
      settleAsync(rejectAbort, reject);
    };

    if (options.signal) {
      options.signal.addEventListener('abort', abort, { once: true });
    }

    recorderNode.port.onmessage = event => {
      const { data } = event;
      if (!data) {
        return;
      }
      if (data.type === 'stop') {
        finish();
      }
      if (data.type === 'ready' && options.onReady) {
        options.onReady();
      }
      if (data.type === 'recording') {
        if (options.signal) {
          options.signal.removeEventListener('abort', abort);
        }
        const resolveRecording = async () => {
          await cleanup();
          if (data.reason === 'no_speech') {
            reject(new SpeechRecordingError('NO_SPEECH'));
            return;
          }
          const wavBlob = await float32SamplesToSttWav(data.samples, data.sampleRate);
          resolve(wavBlob);
        };
        settleAsync(resolveRecording, reject);
      }
    };
  });
}

/**
 * @description Record speech using ScriptProcessor fallback.
 * @param {MediaStream} stream - Microphone stream.
 * @param {object} options - Recording options.
 * @param {() => void} [options.onReady] - Called once the audio graph receives the first microphone frame.
 * @returns {Promise<Blob>} WAV blob.
 * @example
 * recordWithScriptProcessor(stream, options);
 */
async function recordWithScriptProcessor(stream, options) {
  const audioContext = createAudioContext();
  let source;
  let processor;
  let silentGain;
  let finished = false;
  let speechDetected = false;
  let stopReason = null;
  let silenceStartedAt = null;
  let noiseFloor = 0.003;
  let ready = false;
  const chunks = [];
  const startedAt = Date.now();

  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);
  } catch (e) {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
    throw e;
  }

  const cleanup = async () => {
    processor.onaudioprocess = null;
    processor.disconnect();
    silentGain.disconnect();
    source.disconnect();
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  };

  return new Promise((resolve, reject) => {
    const finish = reason => {
      if (finished) {
        return;
      }
      finished = true;
      if (reason) {
        stopReason = reason;
      }
      const samples = mergeChunks(chunks);
      const resolveRecording = async () => {
        await cleanup();
        if (stopReason === 'no_speech') {
          reject(new SpeechRecordingError('NO_SPEECH'));
          return;
        }
        const wavBlob = await float32SamplesToSttWav(samples, audioContext.sampleRate);
        resolve(wavBlob);
      };
      settleAsync(resolveRecording, reject);
    };

    const abort = () => {
      if (finished) {
        return;
      }
      finished = true;
      const rejectAbort = async () => {
        await cleanup();
        reject(createAbortError());
      };
      settleAsync(rejectAbort, reject);
    };

    if (options.signal) {
      options.signal.addEventListener('abort', abort, { once: true });
    }

    processor.onaudioprocess = event => {
      if (finished) {
        return;
      }
      const samples = new Float32Array(event.inputBuffer.getChannelData(0));
      chunks.push(samples);
      if (!ready) {
        ready = true;
        if (options.onReady) {
          options.onReady();
        }
      }
      const rms = computeRms(samples);
      const elapsed = Date.now() - startedAt;
      if (!speechDetected) {
        noiseFloor = noiseFloor * 0.95 + rms * 0.05;
        if (rms >= Math.max(options.speechThreshold, noiseFloor * 3)) {
          speechDetected = true;
        } else if (elapsed >= options.maxWaitForSpeechMs) {
          finish('no_speech');
        }
      } else if (rms < Math.max(options.silenceThreshold, Math.min(0.03, noiseFloor * 2.5))) {
        if (!silenceStartedAt) {
          silenceStartedAt = Date.now();
        } else if (Date.now() - silenceStartedAt >= options.silenceDurationMs) {
          finish('silence');
        }
      } else {
        silenceStartedAt = null;
      }
      if (elapsed >= options.maxDurationMs) {
        finish('max_duration');
      }
    };
  });
}

/**
 * @description Record a voice command until the user stops speaking.
 * @param {object} [options={}] - Recording options.
 * @param {AbortSignal} [options.signal] - Abort signal.
 * @param {number} [options.silenceThreshold=0.01] - RMS below this value is silence.
 * @param {number} [options.speechThreshold=0.015] - RMS above this value starts speech.
 * @param {number} [options.silenceDurationMs=1200] - Silence duration before stop.
 * @param {number} [options.maxDurationMs=30000] - Maximum recording duration.
 * @param {number} [options.maxWaitForSpeechMs=12000] - Maximum wait for speech.
 * @param {() => void} [options.onReady] - Called once the microphone capture is active.
 * @returns {Promise<Blob>} 16 kHz mono WAV blob.
 * @example
 * recordSpeechCommandUntilSilence();
 */
export async function recordSpeechCommandUntilSilence(options = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  if (mergedOptions.signal && mergedOptions.signal.aborted) {
    throw createAbortError();
  }
  const stream = await consumePreparedStream();
  try {
    try {
      return await recordWithAudioWorklet(stream, mergedOptions);
    } catch (e) {
      if (isAbortError(e)) {
        throw e;
      }
      return await recordWithScriptProcessor(stream, mergedOptions);
    }
  } finally {
    stopStream(stream);
  }
}
