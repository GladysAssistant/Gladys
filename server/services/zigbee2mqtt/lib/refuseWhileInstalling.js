const { ConflictError } = require('../../../utils/coreErrors');
const { INSTALLATION_STATE } = require('./constants');

/**
 * @description Refuse a request that an installation or an init in progress would undo or run into: they recreate the
 * containers and save the configuration. Called by the routes and the setup, with no wait between this check and what
 * they start, rather than by disconnect or init, which stop and start the service too.
 * @param {string} action - What the request does, told in the error.
 * @example
 * this.refuseWhileInstalling('reset');
 */
function refuseWhileInstalling(action) {
  if (this.installation.state === INSTALLATION_STATE.RUNNING) {
    throw new ConflictError(`Zigbee2mqtt: cannot ${action} while an installation is running`);
  }
  // An init outside an installation, at the start of Gladys or after the connect route: the one of an installation is
  // refused above
  if (this.runningInits > 0) {
    throw new ConflictError(`Zigbee2mqtt: cannot ${action} while the integration is starting`);
  }
}

module.exports = {
  refuseWhileInstalling,
};
