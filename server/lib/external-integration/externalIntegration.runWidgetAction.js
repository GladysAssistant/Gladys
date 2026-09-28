const { NotFoundError, TooManyRequests } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const {
  ACTION_DEFAULT_TIMEOUT_SECONDS,
  MAX_WIDGET_ACTIONS_PER_MINUTE,
  MAX_WIDGET_MESSAGE_LENGTH,
} = require('./constants');
const { findWidgetAction } = require('./externalIntegration.normalizeWidgetContent');
const { findDeclaredWidget, validateWidgetSettings } = require('./externalIntegration.validateWidgetSettings');
const { countPerMinute } = require('./externalIntegration.widgetCache');
const { toWidgetHttpError } = require('./externalIntegration.widgetErrors');

const LANGUAGE_KEY_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;

/**
 * @description Bound the optional result message of an action: a string or a
 * multi-language object, each value at most 200 characters; anything else
 * is null.
 * @param {any} message - The `data.message` of the command-result.
 * @returns {string|object|null} The bounded message.
 * @example
 * boundMessage({ en: 'Cleaning started' });
 */
function boundMessage(message) {
  if (typeof message === 'string') {
    return message.length > 0 ? message.slice(0, MAX_WIDGET_MESSAGE_LENGTH) : null;
  }
  if (message === null || typeof message !== 'object' || Array.isArray(message)) {
    return null;
  }
  const bounded = {};
  Object.keys(message).forEach((language) => {
    if (LANGUAGE_KEY_REGEX.test(language) && typeof message[language] === 'string' && message[language].length > 0) {
      bounded[language] = message[language].slice(0, MAX_WIDGET_MESSAGE_LENGTH);
    }
  });
  return typeof bounded.en === 'string' ? bounded : null;
}

/**
 * @description Run a widget action (the `button` component, section 7 of
 * capabilities/dashboard-widgets.md): rate-limited per integration (30 per
 * minute → 429), allowlisted from the integration's own last normalized
 * content — the content of that (integration, widget, settings) is re-pulled
 * when nothing is cached, an action key absent from it 404s without reaching
 * the integration, and the `params` relayed are the ones declared in that
 * content, never taken from the request. Relayed over widget.action within
 * the widget's declared `action_timeout_seconds`; a success drops the cached
 * contents of the widget and broadcasts widget-updated so the tile reflects
 * the new state without a nudge.
 * @param {string} selector - The selector of the external integration.
 * @param {string} widgetKey - The declared widget key.
 * @param {string} actionKey - The action key of a button of the content.
 * @param {object} [rawSettings] - The settings of the box instance.
 * @param {object} options - The requesting user's preferences (session-derived).
 * @param {string} options.language - ISO 639-1 language.
 * @param {string} options.units - 'metric' or 'us'.
 * @returns {Promise<object>} Resolve with { message } (null when the integration returned none).
 * @example
 * const preferences = { language: 'fr', units: 'metric' };
 * await gladys.externalIntegration.runWidgetAction('ext-roborock', 'vacuum', 'start', {}, preferences);
 */
async function runWidgetAction(selector, widgetKey, actionKey, rawSettings, { language, units }) {
  const service = await this.getBySelector(selector);
  const widget = findDeclaredWidget(service, widgetKey);
  if (!widget) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_WIDGET_NOT_FOUND');
  }
  if (!countPerMinute(this.widgetActionRates, service.id, MAX_WIDGET_ACTIONS_PER_MINUTE)) {
    throw new TooManyRequests('EXTERNAL_INTEGRATION_WIDGET_ACTION_RATE_LIMITED', 60);
  }
  // validates the settings too (422 naming the key) and re-pulls when
  // nothing is cached: the allowlist is always the integration's own content
  const { content } = await this.getWidgetContent(selector, widgetKey, rawSettings, { language, units });
  const action = findWidgetAction(content.components, actionKey);
  if (!action) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_WIDGET_ACTION_NOT_FOUND');
  }
  const timeoutSeconds = widget.action_timeout_seconds || ACTION_DEFAULT_TIMEOUT_SECONDS;
  let result;
  try {
    result = await this.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_ACTION,
      {
        key: widgetKey,
        action_key: actionKey,
        params: action.params,
        // the validated settings with defaults applied, as sent to widget.get
        settings: await validateWidgetSettings(service, widget, rawSettings),
      },
      { timeoutMs: timeoutSeconds * 1000 },
    );
  } catch (e) {
    throw toWidgetHttpError(e);
  }
  this.invalidateWidgetContent(service, widgetKey, { broadcast: true });
  return { message: boundMessage(result && result.data && result.data.message) };
}

module.exports = {
  runWidgetAction,
};
