const appAPI = require('../api/app');
const { SCOPES } = require('../../utils/constants');

/**
 * @description Checks if Gladys application exists in SmartThings, if not create it.
 * @param {Object} user - The current Gladys user.
 * @param {Object} publicURL - The public URL.
 * @returns {Object} The (created) SmartThings app.
 * @example
 * smartthings.checkApp(oauth)
 */
async function checkApp(user, publicURL) {
  const appName = this.getAppName();
  try {
    // Get Gladys app from SmartThings
    const gladysApp = await appAPI.get(appName, this.getToken(user));
    gladysApp.oauthClientId = await this.gladys.variable.getValue('smt_oauthClientId', this.serviceId, user.id);
    gladysApp.oauthClientSecret = await this.gladys.variable.getValue('smt_oauthClientSecret', this.serviceId, user.id);
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
      classifications: ['CONNECTED_SERVICE'],
      webhookSmartApp: {
        targetUrl: publicURL,
      },
      oauth: {
        clientName: 'Gladys SmartThings integration',
        scope: SCOPES,
        redirectUris: [publicURL],
      },
    };
    const createdApp = await appAPI.create(app, this.getToken(user));
    await this.gladys.variable.setValue('smt_oauthClientId', createdApp.oauthClientId, this.serviceId, user.id);
    await this.gladys.variable.setValue('smt_oauthClientSecret', createdApp.oauthClientSecret, this.serviceId, user.id);
    return createdApp;
  }
}

module.exports = {
  checkApp,
};
