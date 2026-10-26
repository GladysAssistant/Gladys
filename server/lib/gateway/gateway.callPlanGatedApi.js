const { Error402 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

/**
 * @description Run one call to a Gladys Plus route that is behind the "plus"
 * plan check, and keep the local subscription state in sync with its answer:
 * - while the instance is locked, the call is refused locally with a 402, so
 *   that a locked instance stops calling Gladys Plus (AI quota polling, scene
 *   TTS, voice, manual Enedis sync...). Only the probe (the daily backup check,
 *   the "check again" button) is allowed through, that is how the lock is lifted
 * - a success unlocks the instance: the route would have answered 402 otherwise
 * - a 402 locks it.
 * @param {Function} call - The call to Gladys Plus, returns a promise.
 * @param {object} [options] - Options.
 * @param {boolean} [options.probe=false] - Let the call through even when locked.
 * @returns {Promise} Resolve with the result of the call.
 * @example
 * const backups = await this.callPlanGatedApi(() => this.gladysGatewayClient.getBackups(), { probe: true });
 */
async function callPlanGatedApi(call, { probe = false } = {}) {
  if (!probe && !this.subscriptionActive) {
    throw new Error402(ERROR_MESSAGES.GLADYS_PLUS_PAYMENT_REQUIRED);
  }
  // the answer belongs to the account linked when the call was made
  const generation = this.subscriptionLinkGeneration;
  let result;
  try {
    result = await call();
  } catch (e) {
    await this.throwIfPaymentRequired(e, generation);
    throw e;
  }
  await this.setSubscriptionActive(true, generation);
  return result;
}

module.exports = {
  callPlanGatedApi,
};
