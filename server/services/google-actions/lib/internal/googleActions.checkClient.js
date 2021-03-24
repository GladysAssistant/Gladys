const logger = require('../../../../utils/logger');
const db = require('../../../../models');
const { VARIABLES } = require('../../utils/constants');

/**
 * @description Check if OAuth client exists, if not, creates it.
 * @example
 * googleActions.checkClient();
 */
async function checkClient() {
  const projectKey = await this.gladys.variable.getValue(VARIABLES.GOOGLEACTIONS_PROJECT_KEY, this.serviceId);
  const client = await this.gladys.oauth.getClient(VARIABLES.GOOGLEACTIONS_OAUTH_CLIENT_ID, null, false);
  const expectedUrl = `https://oauth-redirect.googleusercontent.com/r/${projectKey}`;

  // Delete and recreate client
  if (!client) {
    db.Session.destroy({
      where: {
        client_id: VARIABLES.GOOGLEACTIONS_OAUTH_CLIENT_ID,
      },
    });
    db.OAuthClient.destroy({
      where: {
        id: VARIABLES.GOOGLEACTIONS_OAUTH_CLIENT_ID,
      },
    });

    await this.gladys.oauth.createClient({
      id: VARIABLES.GOOGLEACTIONS_OAUTH_CLIENT_ID,
      name: 'Google Actions',
      redirect_uris: [expectedUrl],
      grants: ['authorization_code', 'refresh_token'],
    });

    logger.info(`GoogleActions OAuth client correctly created.`);
  } else if (!client.active) {
    logger.info(`Enabling GoogleActions OAuth...`);
    await this.gladys.oauth.updateClientStatus(VARIABLES.GOOGLEACTIONS_OAUTH_CLIENT_ID, true);
  }
}

module.exports = {
  checkClient,
};
