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
    const { Client, DefaultMediaReceiver } = this.googleCastLib;
    const client = new Client();

    client.connect(ipAddress, () => {
      logger.debug('Google Cast Connected, launching app ...');

      client.launch(DefaultMediaReceiver, (err, player) => {
        const media = {
          // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
          contentId: value,
          contentType: 'audio/mp3',
          streamType: 'BUFFERED', // or LIVE

          // Title and cover displayed while buffering
          metadata: {
            type: 0,
            metadataType: 0,
            title: 'Gladys Assistant Speaking...',
            images: [],
          },
        };

        player.on('status', (status) => {
          logger.debug('status broadcast playerState=%s', status.playerState);
        });

        logger.debug('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

        player.load(media, { autoplay: true }, (loadError, status) => {
          logger.debug('media loaded playerState=%s', status.playerState);
        });
      });
    });

    client.on('error', (err) => {
      logger.error('Error: %s', err.message);
      client.close();
    });
  }
}

module.exports = {
  setValue,
};
