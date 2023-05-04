const get = require('get-value');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { DIRECTIVE_NAMESPACES_LIST } = require('../../services/alexa/lib/alexa.constants');

/**
 * @description Handle a new Gladys Alexa Gateway message.
 * @param {object} data - Gateway message.
 * @param {object} rawMessage - Message with metadata.
 * @param {Function} cb - Callback.
 * @returns {Promise} Resolve when finished.
 * @example
 * handleNewMessage({
 *  type: 'gladys-api-call',
 * });
 */
async function handleAlexaMessage(data, rawMessage, cb) {
  try {
    const service = this.serviceManager.getService('alexa');
    const body = {
      ...data.data,
      user: {
        id: rawMessage.sender_id,
        local_user_id: rawMessage.local_user_id,
      },
    };
    // save that the user is connected to gateway alexa
    if (!this.alexaConnected) {
      await this.variable.setValue(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_ALEXA_USER_IS_CONNECTED_WITH_GATEWAY,
        rawMessage.sender_id,
      );
      this.alexaConnected = true;
    }
    const directiveNamespace = get(body, 'directive.header.namespace');
    const directiveName = get(body, 'directive.header.name');
    logger.debug(`gateway.handleAlexaMessage: New message : ${directiveNamespace}`);
    let response;
    if (directiveNamespace === 'Alexa.Discovery') {
      response = service.alexaHandler.onDiscovery();
    } else if (DIRECTIVE_NAMESPACES_LIST.indexOf(directiveNamespace) !== -1) {
      response = service.alexaHandler.onExecute(body);
    } else if (directiveNamespace === 'Alexa' && directiveName === 'ReportState') {
      response = service.alexaHandler.onReportState(body);
    } else {
      response = {
        status: 400,
      };
    }

    cb(response);
  } catch (e) {
    logger.error(e);
    cb({ status: 400 });
  }
}

module.exports = {
  handleAlexaMessage,
};
