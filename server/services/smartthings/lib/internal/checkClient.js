const logger = require('../../../../utils/logger');

/**
 * @description Check if OAuth client exists, if not, creates it.
 * @example
 * oauthManager.checkClient();
 */
async function checkClient() {
  const client = await this.gladys.oauth.getClient('smartthings');

  if (client === null) {
    await this.gladys.oauth.createClient({
      id: 'smartthings',
      name: 'Samsung SmartThings',
      redirect_uris: [
        'https://c2c-us.smartthings.com/oauth/callback',
        'https://c2c-eu.smartthings.com/oauth/callback',
        'https://c2c-ap.smartthings.com/oauth/callback',
      ],
      grants: ['authorization_code'],
    });

    logger.info(`Smartthings OAuth client correctly created.`);
  } else {
    logger.debug(`Smartthings OAuth client already created.`);
  }
}

module.exports = {
  checkClient,
};
