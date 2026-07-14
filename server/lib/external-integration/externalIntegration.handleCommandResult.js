const logger = require('../../utils/logger');
const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');

/**
 * @description Handle a command-result ack sent by an integration. A
 * `success: false` result is treated exactly like a timeout: the pending
 * command rejects (error visible in the device UI).
 * @param {object} service - The external integration service.
 * @param {object} payload - The command result payload ({ message_id, success, error }).
 * @example
 * gladys.externalIntegration.handleCommandResult(service, { message_id: 'uuid', success: true });
 */
function handleCommandResult(service, payload) {
  if (!payload || !payload.message_id) {
    logger.debug(`External integration ${service.selector}: command result without message_id, ignoring`);
    return;
  }
  const pendingCommand = this.pendingCommands.get(payload.message_id);
  if (!pendingCommand) {
    logger.debug(`External integration ${service.selector}: unknown command ${payload.message_id}, ignoring`);
    return;
  }
  this.pendingCommands.delete(payload.message_id);
  clearTimeout(pendingCommand.timer);
  if (payload.success) {
    pendingCommand.resolve(payload);
  } else {
    pendingCommand.reject(
      new ExternalIntegrationUnavailableError(payload.error || 'EXTERNAL_INTEGRATION_COMMAND_FAILED'),
    );
  }
}

module.exports = {
  handleCommandResult,
};
