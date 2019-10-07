const appAPI = require('../api/app');
const { SCOPES, VARIABLES } = require('../../utils/constants');

/**
 * @description Checks if Gladys application exists in SmartThings, if not create it.
 * @param {string} token - User access token.
 * @param {Object} user - The current Gladys user.
 * @param {Object} publicURL - The public URL.
 * @returns {Promise} The (created) SmartThings app.
 * @example
 * smartthings.checkApp(token, user, publicURL);
 */
async function checkApp(token, user, publicURL) {
  const appName = 'gladys-v4';
  try {
    // Get Gladys app from SmartThings
    const gladysApp = await appAPI.get(appName, token);

    const appCredentials = await appAPI.generateCredentials(gladysApp.appId, token);
    await this.gladys.variable.setValue(
      VARIABLES.SMT_PUBLIC_KEY,
      appCredentials.oauthClientId,
      this.serviceId,
      user.id,
    );
    await this.gladys.variable.setValue(
      VARIABLES.SMT_SECRET_KEY,
      appCredentials.oauthClientSecret,
      this.serviceId,
      user.id,
    );

    return gladysApp;
  } catch (e) {
    // If error, then create it
    const app = {
      appName,
      displayName: 'Gladys',
      description: 'Link with Gladys application',
      iconImage:
        'https://community.gladysassistant.com/uploads/default/original/2X/f/f43f0c6065d262c9255637f673ab9335b2e718b7.png',
      appType: 'WEBHOOK_SMART_APP',
      classifications: ['CONNECTED_SERVICE', 'DEVICE'],
      webhookSmartApp: {
        targetUrl: `${publicURL}/api/v1/smartthings/webhook`,
      },
      oauth: {
        clientName: 'Gladys SmartThings integration',
        scope: SCOPES,
      },
    };

    const createdApp = await appAPI.create(app, token);
    await this.gladys.variable.setValue(VARIABLES.SMT_PUBLIC_KEY, createdApp.oauthClientId, this.serviceId, user.id);
    await this.gladys.variable.setValue(
      VARIABLES.SMT_SECRET_KEY,
      createdApp.oauthClientSecret,
      this.serviceId,
      user.id,
    );

    return createdApp;
  }
}

module.exports = {
  checkApp,
};
