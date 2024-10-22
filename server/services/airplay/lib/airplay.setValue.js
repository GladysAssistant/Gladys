const axios = require('axios');
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
    const airplayDevice = client.add(ipAddress, {});
    client.on('buffer', (event) => {
      if (event === 'end') {
        logger.debug('Playback ended, waiting for AirTunes devices');
        setTimeout(() => {
          client.stopAll(() => { });
        }, 5000);
      }
    });

    airplayDevice.on('status', async (status) => {
      if (status === 'ready') {
        const { data } = await axios.get('https://cdn.pixabay.com/audio/2022/03/10/audio_9809d70f8f.mp3', { responseType: 'stream' });
        data
          .pipe(this.lame.Decoder())
          .pipe(client);
      }
    });
  }
}

module.exports = {
  setValue,
};
