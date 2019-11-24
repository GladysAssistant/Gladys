const db = require('../../../../models');
const { VARIABLES } = require('../../utils/constants');

/**
 * @description Loads all stored callback information.
 * @example
 * smartthings.loadCallbackInformation();
 */
async function loadCallbackInformation() {
  const variables = await db.Variable.findAll({
    where: {
      name: VARIABLES.SMT_CALLBACK_OAUTH,
      service_id: this.serviceId,
    },
  });

  variables.forEach((oauthInfo) => {
    const userId = oauthInfo.user_id;
    this.callbackUsers[userId] = JSON.parse(oauthInfo.value);
  });
}

module.exports = { loadCallbackInformation };
