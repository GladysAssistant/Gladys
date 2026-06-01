/** Sample rate expected by Whisper / Scaleway Generative APIs transcription. */
export const STT_SAMPLE_RATE = 16000;

/**
 * @description Create AudioContext with Safari prefix when needed.
 * @returns {AudioContext} Audio context instance.
 */
function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('AUDIO_CONTEXT_NOT_SUPPORTED');
  }
  return new AudioContextClass();
}

/**
 * @description Whether the blob is already in a STT-friendly webm/ogg container.
 * @param {Blob} blob - Recorded audio blob.
 * @returns {boolean} True when conversion can be skipped.
 */
export function isWebmOrOggBlob(blob) {
  const type = (blob.type || '').toLowerCase();
  return type.includes('webm') || type.includes('ogg');
}

/**
 * @description Whether the blob is already 16-bit PCM WAV.
 * @param {Blob} blob - Recorded audio blob.
 * @returns {boolean} True when the blob is WAV.
 */
export function isWavBlob(blob) {
  const type = (blob.type || '').toLowerCase();
  return type.includes('wav');
}

/**
 * @description Encode mono AudioBuffer as 16-bit PCM WAV.
 * @param {AudioBuffer} audioBuffer - Decoded audio (mono preferred).
 * @returns {Blob} WAV blob.
 */
export function encodeWavBlob(audioBuffer) {
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = channel.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const sample = Math.max(-1, Math.min(1, channel[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * @description Build mono 16 kHz WAV from raw PCM samples (Safari / WebKit path).
 * @param {Float32Array} samples - Recorded mono samples.
 * @param {number} sampleRate - Sample rate of the samples.
 * @returns {Promise<Blob>} WAV blob for STT upload.
 */
export async function float32SamplesToSttWav(samples, sampleRate) {
  const audioContext = createAudioContext();
  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const buffer = audioContext.createBuffer(1, samples.length, sampleRate);
    buffer.getChannelData(0).set(samples);
    if (sampleRate === STT_SAMPLE_RATE) {
      return encodeWavBlob(buffer);
    }
    const frameCount = Math.max(1, Math.ceil(buffer.duration * STT_SAMPLE_RATE));
    const offline = new OfflineAudioContext(1, frameCount, STT_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    return encodeWavBlob(rendered);
  } finally {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
}

/**
 * @description Resample decoded audio to mono 16 kHz WAV for STT upload.
 * @param {Blob} blob - Source recording (e.g. Safari audio/mp4).
 * @returns {Promise<Blob>} WAV blob or original blob if conversion fails.
 */
export async function convertBlobToWav(blob) {
  const audioContext = createAudioContext();
  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const duration = decoded.duration;
    const frameCount = Math.max(1, Math.ceil(duration * STT_SAMPLE_RATE));
    const offline = new OfflineAudioContext(1, frameCount, STT_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    return encodeWavBlob(rendered);
  } finally {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
}

/**
 * @description Normalize browser recordings for Gladys Plus STT (Safari → WAV).
 * @param {Blob} blob - Recorded audio from MediaRecorder.
 * @returns {Promise<Blob>} Blob suitable for POST /gateway/voice.
 */
export async function normalizeSpeechBlobForStt(blob) {
  if (!blob || blob.size === 0) {
    return blob;
  }
  if (isWavBlob(blob)) {
    return blob;
  }

  try {
    return await convertBlobToWav(blob);
  } catch (e) {
    const type = blob.type || 'audio/mp4';
    return new Blob([await blob.arrayBuffer()], { type });
  }
}
