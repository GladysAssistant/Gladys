const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const deviceName = device.external_id.split(':')[1];
  const ipAddress = this.deviceIpAddresses.get(deviceName);
  if (!ipAddress) {
    throw new Error('Device not found on network');
  }

  if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION) {
    const client = new this.Airtunes();
    const airplayDevice = client.add(ipAddress, {
      volume: 70,
    });
    let decodeProcess;

    client.on('buffer', (event) => {
      if (event === 'end') {
        logger.debug('Playback ended, waiting for AirTunes devices');
        setTimeout(() => {
          client.stopAll(() => {
            if (decodeProcess) {
              decodeProcess.kill();
            }
          });
        }, 5000);
      }
    });

    airplayDevice.on('status', async (status) => {
      if (status === 'ready') {
        decodeProcess = this.childProcess.spawn('ffmpeg', [
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
        decodeProcess.stdout.pipe(client);

        // detect if ffmpeg was not spawned correctly
        decodeProcess.stderr.setEncoding('utf8');
        decodeProcess.stderr.on('data', (data) => {
          if (/^execvp\(\)/.test(data)) {
            logger.error('Failed to start ffmpeg');
            logger.error(`stderr: ${data}`);
            client.stopAll(() => {});
          }
        });
      }
    });
  }
}

module.exports = {
  setValue,
};
