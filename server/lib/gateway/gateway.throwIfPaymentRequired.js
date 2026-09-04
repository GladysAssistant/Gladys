const get = require('get-value');
const { Error402 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

/**
 * @description Return true when an error is a "payment required" answer of Gladys Plus.
 * @param {Error} e - The error thrown by the gateway client.
 * @returns {boolean} True when Gladys Plus refused the call because the subscription is not paid.
 * @example
 * isPaymentRequiredError(e);
 */
function isPaymentRequiredError(e) {
  return get(e, 'response.status') === 402;
}

/**
 * @description When Gladys Plus refused a call because the subscription is not paid,
 * lock the plan-gated features locally and throw a 402. Any other error is ignored:
 * the caller keeps its own error handling.
 * @param {Error} e - The error thrown by the gateway client.
 * @returns {Promise} Resolve when the error is not a payment error.
 * @example
 * try { await this.gladysGatewayClient.getBackups(); } catch (e) { await this.throwIfPaymentRequired(e); }
 */
async function throwIfPaymentRequired(e) {
  if (!isPaymentRequiredError(e)) {
    return;
  }
  await this.setSubscriptionActive(false);
  throw new Error402(ERROR_MESSAGES.GLADYS_PLUS_PAYMENT_REQUIRED);
}

module.exports = {
  throwIfPaymentRequired,
  isPaymentRequiredError,
};
