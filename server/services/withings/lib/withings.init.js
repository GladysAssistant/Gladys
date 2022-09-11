const { OAUTH2 } = require('./oauth2-client/utils/constants.js');

/**
 * @description Check if withings oauth2 configuration is in catabase and save it if necessary.
 * @example
 * withings.init();
 */
async function init() {
  // check if variable necessary to oauth2 connection is in variable table
  const tokenHost = await this.gladys.variable.getValue(OAUTH2.VARIABLE.TOKEN_HOST, this.serviceId);
  if (!tokenHost) {
    // Init variable in db
    await this.gladys.variable.setValue(OAUTH2.VARIABLE.TOKEN_HOST, 'https://wbsapi.withings.net', this.serviceId);
    await this.gladys.variable.setValue(OAUTH2.VARIABLE.TOKEN_PATH, '/v2/oauth2', this.serviceId);
    await this.gladys.variable.setValue(OAUTH2.VARIABLE.AUTHORIZE_HOST, 'https://account.withings.com', this.serviceId);
    await this.gladys.variable.setValue(OAUTH2.VARIABLE.AUTHORIZE_PATH, '/oauth2_user/authorize2', this.serviceId);
    await this.gladys.variable.setValue(
      OAUTH2.VARIABLE.ADDITIONAL_ACCESS_TOKEN_REQUEST_ACTION_PARAM,
      'requesttoken',
      this.serviceId,
    );
    await this.gladys.variable.setValue(
      OAUTH2.VARIABLE.INTEGRATION_SCOPE,
      'user.info,user.metrics,user.activity,user.sleepevents',
      this.serviceId,
    );
    await this.gladys.variable.setValue(OAUTH2.VARIABLE.GRANT_TYPE, 'authorization_code', this.serviceId);
    await this.gladys.variable.setValue(
      OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX,
      'dashboard/integration/health/withings/settings',
      this.serviceId,
    );
  }
}

module.exports = {
  init,
};
