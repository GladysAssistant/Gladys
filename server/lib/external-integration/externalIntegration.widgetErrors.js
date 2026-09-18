const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { MAX_WIDGET_MESSAGE_LENGTH } = require('./constants');
const { INVALID_CONTENT_ERROR } = require('./externalIntegration.normalizeWidgetContent');
const { INVALID_IMAGE_ERROR } = require('./externalIntegration.normalizeWidgetImage');

// The core's own failure codes of the widget command path: they never carry
// an integration-authored message, so nothing is echoed to the user for them.
const CORE_ERROR_CODES = [
  'EXTERNAL_INTEGRATION_NOT_CONNECTED',
  'EXTERNAL_INTEGRATION_COMMAND_TIMEOUT',
  'EXTERNAL_INTEGRATION_COMMAND_FAILED',
  INVALID_CONTENT_ERROR,
  INVALID_IMAGE_ERROR,
];

/**
 * @description Translate a widget command failure into the HTTP error the
 * frontend maps to a translated state, so no internal code ever reaches the
 * user as an opaque "unknown error": integration not connected, ack timeout,
 * `success: false`, invalid payload → 400 REQUEST_TO_THIRD_PARTY_FAILED, with
 * the integration's own `error` string bounded to 200 characters alongside
 * ("API key invalid" is more actionable than "unavailable"); a content
 * version above the supported one → 400 WIDGET_CONTENT_VERSION_UNSUPPORTED,
 * the one failure whose remedy is on the user's side. Anything else is
 * returned unchanged.
 * @param {Error} error - The error thrown by the command path.
 * @returns {Error} The error to throw.
 * @example
 * throw toWidgetHttpError(e);
 */
function toWidgetHttpError(error) {
  if (!(error instanceof ExternalIntegrationUnavailableError)) {
    return error;
  }
  if (error.message === ERROR_MESSAGES.WIDGET_CONTENT_VERSION_UNSUPPORTED) {
    return new Error400(ERROR_MESSAGES.WIDGET_CONTENT_VERSION_UNSUPPORTED);
  }
  const httpError = new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
  if (!CORE_ERROR_CODES.includes(error.message)) {
    // the `error` of the integration's command-result, displayed as escaped
    // plain text under the generic message
    httpError.error = `${error.message}`.slice(0, MAX_WIDGET_MESSAGE_LENGTH);
  }
  return httpError;
}

module.exports = {
  toWidgetHttpError,
};
