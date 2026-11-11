const { ConflictError } = require('../../../utils/coreErrors');
const { INSTALLATION_STATE } = require('./constants');

/**
 * @description Refuse a request that an installation or an operation in progress would undo or run into: an init, a
 * disconnect, a reset or an ezsp fallback create or remove the containers, and save or destroy the configuration.
 * Called by the routes and the setup, with no wait between this check and what they start, rather than by these
 * operations, which call one another and stop and start the service too.
 * @param {string} action - What the request does, told in the error.
 * @example
 * this.refuseWhileInstalling('reset');
 */
function refuseWhileInstalling(action) {
  if (this.installation.state === INSTALLATION_STATE.RUNNING) {
    throw new ConflictError(`Zigbee2mqtt: cannot ${action} while an installation is running`);
  }
  // An operation outside an installation: an init at the start of Gladys or after the connect route, a disconnect or a
  // reset sent from another tab, an ezsp fallback started in the background once the logs of Zigbee2mqtt are read. The
  // ones of an installation are refused above.
  if (this.runningOperations > 0) {
    throw new ConflictError(`Zigbee2mqtt: cannot ${action} while the integration is busy`);
  }
}

module.exports = {
  refuseWhileInstalling,
};
