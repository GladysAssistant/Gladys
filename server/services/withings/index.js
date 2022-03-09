const logger = require('../../utils/logger');
const WithingsHandler = require('./lib/index');
const WithingsController = require('./api/withings.controller');
const { OAUTH2 } = require('../../utils/constants.js');

module.exports = function WithingsService(gladys, serviceId) {
  const withingsHandler = new WithingsHandler(gladys, serviceId, 'https://wbsapi.withings.net', 'withings');

  /**
   * @public
   * @description This function starts the WithingsService service
   * @example
   * gladys.services.withings.start();
   */
  async function start() {
    logger.log('starting Withings service');

    // check if variable necessary to oauth2 connection is in variable table
    const tokenHost = await gladys.variable.getValue(OAUTH2.VARIABLE.TOKEN_HOST, serviceId);
    if (!tokenHost) {
      // Init variable in db
      await gladys.variable.setValue(OAUTH2.VARIABLE.TOKEN_HOST, 'https://wbsapi.withings.net', serviceId);
      await gladys.variable.setValue(OAUTH2.VARIABLE.TOKEN_PATH, '/v2/oauth2', serviceId);
      await gladys.variable.setValue(OAUTH2.VARIABLE.AUTHORIZE_HOST, 'https://account.withings.com', serviceId);
      await gladys.variable.setValue(OAUTH2.VARIABLE.AUTHORIZE_PATH, '/oauth2_user/authorize2', serviceId);
      await gladys.variable.setValue(
        OAUTH2.VARIABLE.ADDITIONAL_ACCESS_TOKEN_REQUEST_ACTION_PARAM,
        'requesttoken',
        serviceId,
      );
      await gladys.variable.setValue(
        OAUTH2.VARIABLE.INTEGRATION_SCOPE,
        'user.info,user.metrics,user.activity,user.sleepevents',
        serviceId,
      );
      await gladys.variable.setValue(OAUTH2.VARIABLE.GRANT_TYPE, 'authorization_code', serviceId);
      await gladys.variable.setValue(
        OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX,
        'dashboard/integration/health/withings/settings',
        serviceId,
      );
    }
  }

  /**
   * @public
   * @description This function stops the WithingsService service
   * @example
   * gladys.services.withings.stop();
   */
  async function stop() {
    logger.log('stopping Withings service');
  }

  return Object.freeze({
    start,
    stop,
    device: withingsHandler,
    controllers: WithingsController(withingsHandler),
  });
};
