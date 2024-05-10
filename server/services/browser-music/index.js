const logger = require('../../utils/logger');
const { EVENTS, DEVICE_FEATURE_TYPES, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

module.exports = function BrowserMusicService(gladys, serviceId) {
  /**
   * @description Send the new device value over device protocol.
   * @param {object} device - Updated Gladys device.
   * @param {object} deviceFeature - Updated Gladys device feature.
   * @param {string|number} value - The new device feature value.
   * @example
   * setValue(device, deviceFeature, 0);
   */
  async function setValue(device, deviceFeature, value) {
    if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION) {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.BROWSER_MUSIC.PLAY_VOICE_NOTIFICATION,
        payload: {
          device_feature: deviceFeature.selector,
          value,
        },
      });
    }
  }

  /**
   * @public
   * @description This function starts the enedis service.
   * @example
   * gladys.services.enedis.start();
   */
  async function start() {
    logger.info('Starting enedis service');
  }

  /**
   * @public
   * @description This function stops the enedis service.
   * @example
   * gladys.services.enedis.stop();
   */
  async function stop() {
    logger.info('Stopping enedis service');
  }

  return Object.freeze({
    start,
    stop,
    device: {
      setValue,
    },
  });
};
