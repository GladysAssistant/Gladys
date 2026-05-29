/**
 * @description Record audio from the microphone until silence is detected.
 * @param {object} options - Recording options.
 * @param {number} [options.silenceThreshold=0.02] - RMS threshold below which audio is considered silent.
 * @param {number} [options.silenceDurationMs=1500] - Duration of silence before stopping (ms).
 * @param {number} [options.maxDurationMs=30000] - Maximum recording duration (ms).
 * @param {number} [options.minRecordingMs=500] - Minimum recording duration before silence can stop (ms).
 * @returns {Promise<Blob>} Recorded audio blob.
 */
export async function recordUntilSilence({
  silenceThreshold = 0.02,
  silenceDurationMs = 1500,
  maxDurationMs = 30000,
  minRecordingMs = 500
} = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks = [];

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const dataArray = new Uint8Array(analyser.fftSize);

  return new Promise((resolve, reject) => {
    let silenceStart = null;
    const recordingStart = Date.now();

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      resolve(new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' }));
    };

    mediaRecorder.onerror = () => {
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      reject(new Error('MEDIA_RECORDER_ERROR'));
    };

    mediaRecorder.start(100);

    const checkSilence = () => {
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

      requestAnimationFrame(checkSilence);
    };

    requestAnimationFrame(checkSilence);
  });
}

/**
 * @description Convert a Blob to a base64 string (without data URL prefix).
 * @param {Blob} blob - Audio blob.
 * @returns {Promise<string>} Base64-encoded data.
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('INVALID_BLOB_READ'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
