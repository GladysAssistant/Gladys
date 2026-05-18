const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @param {object} options - Optional configs.
 * @example
 * setValue(device, deviceFeature, 0, 30);
 */
async function setValue(device, deviceFeature, value, options) {
  const deviceName = device.external_id.split(':')[1];
  const ipAddress = this.deviceIpAddresses.get(deviceName);
  if (!ipAddress) {
    throw new Error('Device not found on network');
  }

  if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION) {
    const MAX_NOTIFICATION_DURATION_MS = 5 * 60 * 1000; // 5 minutes max
    let decodeProcess;
    let killTimer;

    const cleanup = () => {
      clearTimeout(killTimer);
      if (decodeProcess) {
        decodeProcess.kill();
        decodeProcess = null;
      }
    };

    const sender = this.airplaySender(
      {
        host: ipAddress,
        airplay2: true,
        volume: options?.volume ?? 70,
      },
      async (event) => {
        if (event.event === 'device' && event.message === 'ready') {
          decodeProcess = this.childProcess.spawn('ffmpeg', [
            '-re',
            '-i',
            value,
            '-acodec',
            'pcm_s16le',
            '-f',
            's16le', // PCM 16bits, little-endian
            '-ar',
            '44100', // Sampling rate
            '-ac',
            2, // Stereo
            'pipe:1', // Output on stdout
          ]);

          killTimer = setTimeout(() => {
            logger.warn('ffmpeg exceeded max notification duration, killing process');
            cleanup();
            sender.stop();
          }, MAX_NOTIFICATION_DURATION_MS);

          decodeProcess.on('error', (err) => {
            logger.error('Failed to start ffmpeg');
            logger.error(err);
            cleanup();
            sender.stop();
          });

          decodeProcess.stdout.on('data', (chunk) => sender.sendPcm(chunk));
          decodeProcess.stdout.on('end', () => {
            clearTimeout(killTimer);
            setTimeout(() => {
              sender.stop();
            }, 7000);
          });

          // detect if ffmpeg was not spawned correctly
          decodeProcess.stderr.setEncoding('utf8');
          decodeProcess.stderr.on('data', (data) => {
            if (/^execvp\(\)/.test(data)) {
              logger.error('Failed to start ffmpeg');
              logger.error(`stderr: ${data}`);
              cleanup();
              sender.stop();
            }
          });
        }

        if (event.event === 'buffer' && event.message === 'end') {
          cleanup();
        }
      },
    );
  }
}

module.exports = {
  setValue,
};
