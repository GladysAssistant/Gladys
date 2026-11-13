const logger = require('../../../utils/logger');
const { ConflictError } = require('../../../utils/coreErrors');
const { CONFIGURATION, ERRORS } = require('./constants');

/**
 * @description Tell if the Matter bridge of Gladys (the `matter-bridge` service) is turned on. It
 * listens on the standard Matter port, 5540, which the Matterbridge container needs as well, on
 * the host network: both cannot run.
 * @returns {Promise<boolean>} True when the Matter bridge is turned on.
 * @example
 * await matterbridge.isMatterBridgeEnabled();
 */
async function isMatterBridgeEnabled() {
  const matterBridge = this.gladys.service.getService('matter-bridge');
  if (!matterBridge || !matterBridge.bridge) {
    return false;
  }
  return matterBridge.bridge.isEnabled();
}

/**
 * @description Refuse to start Matterbridge while the Matter bridge of Gladys is turned on. The
 * page turns Matterbridge on before asking to start it: it is turned off again, so that the
 * Matter bridge is not refused in turn because of a Matterbridge that never started.
 * @returns {Promise} Resolves when Matterbridge can start.
 * @throws {ConflictError} MATTER_BRIDGE_ENABLED when the Matter bridge is turned on.
 * @example
 * await matterbridge.checkMatterBridgeConflict();
 */
async function checkMatterBridgeConflict() {
  if (!(await this.isMatterBridgeEnabled())) {
    return;
  }
  logger.warn('Matterbridge: not started, the Matter bridge of Gladys is turned on and uses port 5540');
  await this.gladys.variable.setValue(CONFIGURATION.MATTERBRIDGE_ENABLED, '0', this.serviceId);
  throw new ConflictError(ERRORS.MATTER_BRIDGE_ENABLED);
}

module.exports = {
  isMatterBridgeEnabled,
  checkMatterBridgeConflict,
};
