const logger = require('../../utils/logger');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const {
  WEBHOOK_DEFAULT_MODE,
  MAX_WEBHOOK_BODY_BYTES,
  MAX_WEBHOOK_RESPONSE_BODY_BYTES,
  WEBHOOK_RESPONSE_MIN_STATUS,
  WEBHOOK_RESPONSE_MAX_STATUS,
} = require('./constants');

/**
 * @description Build the response relayed back to the gateway (so to the
 * third-party caller) from the command-result of a sync webhook. Anything
 * out of the contract — status outside 200-499, non-string body, body over
 * 64 KB — falls back to the empty 200: the third party must never see the
 * instance fail.
 * @param {object} response - The `data` of the integration command-result.
 * @returns {object} The ack payload for the gateway.
 * @example
 * const ack = buildSyncResponse({ status: 200, content_type: 'text/plain', body: 'hub.challenge' });
 */
function buildSyncResponse(response) {
  const { status, content_type: contentType, body } = response;
  const validStatus =
    status === undefined ||
    (Number.isInteger(status) && status >= WEBHOOK_RESPONSE_MIN_STATUS && status <= WEBHOOK_RESPONSE_MAX_STATUS);
  const validContentType = contentType === undefined || typeof contentType === 'string';
  const validBody =
    body === undefined || (typeof body === 'string' && Buffer.byteLength(body) <= MAX_WEBHOOK_RESPONSE_BODY_BYTES);
  if (!validStatus || !validContentType || !validBody) {
    logger.warn(`External integration answered an out-of-contract webhook response, falling back to empty 200`);
    return { status: 200 };
  }
  const ack = { status: status === undefined ? 200 : status };
  if (contentType !== undefined) {
    ack.content_type = contentType;
  }
  if (body !== undefined) {
    ack.body = body;
  }
  return ack;
}

/**
 * @description Handle a third-party webhook relayed by the generic
 * external-integration route of the Gladys Plus gateway. The supervisor
 * checks selector + declared webhook_key — anything unknown gets a silent
 * empty 200 (no leak of which selectors/keys exist) — then, per the
 * declared mode: `fire_and_forget` acks 200 immediately and relays
 * asynchronously over the integration WebSocket (disconnected integration
 * -> lost without error: a webhook is a trigger, the poll catches up);
 * `sync` waits for the integration's response under the standard command
 * ack and relays it to the caller (timeout or stopped -> empty 200).
 * @param {object} data - The relayed request { selector, webhook_key, method, query, body, content_type }.
 * @param {Function} cb - Gateway callback carrying the response to the third party.
 * @returns {Promise} Resolve when handled.
 * @example
 * await gladys.externalIntegration.handleGatewayWebhook({ selector: 'ext-netatmo', webhook_key: 'events' }, cb);
 */
async function handleGatewayWebhook(data, cb) {
  const respond = (payload) => {
    try {
      cb(payload);
    } catch (e) {
      logger.debug(e);
    }
  };
  const { selector, webhook_key: webhookKey, method, query, body, content_type: contentType } = data || {};
  let service = null;
  try {
    service = await this.getBySelector(selector);
  } catch (e) {
    service = null;
  }
  const declaredWebhook =
    service && ((service.manifest && service.manifest.webhooks) || []).find((webhook) => webhook.key === webhookKey);
  if (!declaredWebhook) {
    respond({ status: 200 });
    return;
  }
  // the gateway already bounds the relayed body to 256 KB: this mirror
  // check protects the instance from any other emitter of the event
  const bodySize = Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body === undefined ? '' : body));
  if (bodySize > MAX_WEBHOOK_BODY_BYTES) {
    logger.warn(`Webhook body of ${service.selector}/${webhookKey} is over ${MAX_WEBHOOK_BODY_BYTES} bytes, dropped`);
    respond({ status: 200 });
    return;
  }
  const payload = { webhook_key: webhookKey, method, query, body, content_type: contentType };
  if ((declaredWebhook.mode || WEBHOOK_DEFAULT_MODE) === 'sync') {
    try {
      const result = await this.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_REQUEST, {
        ...payload,
      });
      respond(buildSyncResponse((result && result.data) || {}));
    } catch (e) {
      // stopped integration or ack timeout: the third party still gets its
      // 200 — the durable fix of the "5 failures = webhook banned" lesson
      logger.debug(e);
      respond({ status: 200 });
    }
    return;
  }
  // fire_and_forget: immediate ack, async relay without message_id nor ack
  respond({ status: 200 });
  this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_RECEIVED, payload);
}

module.exports = {
  handleGatewayWebhook,
};
