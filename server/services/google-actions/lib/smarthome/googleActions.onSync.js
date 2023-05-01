const logger = require('../../../../utils/logger');
const { syncDeviceConverter } = require('../utils/googleActions.syncDeviceConverter');

/**
 * @description The function that will run for an SYNC request.
 * It should return a valid response or a Promise that resolves to valid response.
 * @param {object} body - Request body.
 * @returns {Promise} A valid response.
 * @example
 * googleActions.onSync({}, {});
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#onsync
 */
async function onSync(body) {
  const { user, requestId } = body;

  logger.debug('GoogleActions: syncing...');

  // Get all Gladys devices
  const gladysDevices = Object.values(this.gladys.stateManager.state.device).map((store) => store.get());
  // Convert it to managed Google devices
  const devices = gladysDevices.map((d) => syncDeviceConverter(d)).filter((d) => d !== null);

  logger.debug('GoogleActions: synced');

  return {
    requestId,
    payload: {
      agentUserId: user.id,
      devices,
    },
  };
}

module.exports = {
  onSync,
};
