const logger = require('../../../../utils/logger');

const CTRL_STATES = {
  0: 'No command in progress',
  1: 'The command is starting',
  2: 'The command was cancelled',
  3: 'Command invocation had error(s) and was aborted',
  4: 'Controller is waiting for a user action',
  5: 'Controller command is on a sleep queue wait for device',
  6: 'The controller is communicating with the other device to carry out the command',
  7: 'The command has completed successfully',
  8: 'The command has failed',
  9: 'The controller thinks the node is OK',
  10: 'The controller thinks the node has failed',
};

const CTRL_ERRORS = {
  0: 'No error',
  1: 'ButtonNotFound',
  2: 'NodeNotFound',
  3: 'NotBridge',
  4: 'NotSUC',
  5: 'NotSecondary',
  6: 'NotPrimary',
  7: 'IsPrimary',
  8: 'NotFound',
  9: 'Busy',
  10: 'Failed',
  11: 'Disabled',
  12: 'Overflow',
};

/**
 * @description The ZWave Controller is reporting the result of the currently active command.
 * @param {number} nodeId - The nodeID.
 * @param {number} ctrlState - The controller state.
 * @param {number} ctrlError - The error.
 * @param {string} helpMsg - An help message.
 * @example
 * zwave.on('controller command', this.zwave.controllerCommand);
 */
function controllerCommand(nodeId, ctrlState, ctrlError, helpMsg) {
  logger.debug(
    `Zwave.controllerCommand : NodeId = ${nodeId}, ctrlState = ${CTRL_STATES[ctrlState]}, ctrlError = ${
      CTRL_ERRORS[ctrlError]
    }, helpMsg = ${helpMsg}`,
  );
}

module.exports = {
  controllerCommand,
};
