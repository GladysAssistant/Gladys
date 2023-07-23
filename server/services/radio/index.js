const { SYSTEM_VARIABLE_NAMES, MUSIC } = require('../../utils/constants');
const logger = require('../../utils/logger');
const RadioHandler = require('./lib');
const RadioController = require('./api/radio.controller');
const { RADIO } = require('./lib/utils/radio.constants');

module.exports = function RadioService(gladys, serviceId) {
  const radioHandler = new RadioHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.Radio.start();
   */
  async function start() {
    logger.info('Starting Radio service');

    const RadioServiceEnabled = await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED);
    if (RadioServiceEnabled && JSON.parse(RadioServiceEnabled)[RADIO.SERVICE_NAME] === MUSIC.PROVIDER.STATUS.ENABLED) {
      // Start radio handler
      let defaultRadioCountry = await gladys.variable.getValue(RADIO.DEFAULT_COUNTRY, serviceId);
      if (defaultRadioCountry) {
        radioHandler.defaultCountry = defaultRadioCountry;
      }
      radioHandler.getStationsByCountry(radioHandler.defaultCountry);
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.Radio.stop();
   */
  async function stop() {
    logger.info('Stopping Radio service');
  }

  return Object.freeze({
    start,
    stop,
    soundHandler: radioHandler,
    controllers: RadioController(radioHandler),
  });
};
