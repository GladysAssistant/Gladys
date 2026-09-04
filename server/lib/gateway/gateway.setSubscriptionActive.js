const logger = require('../../utils/logger');
const { EVENTS, SYSTEM_VARIABLE_NAMES, USER_ROLE, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Tell the admins of this instance that the subscription state changed.
 * Best effort: a missing user/message/brain module (or a failure there) must not
 * prevent the lock itself.
 * @param {object} gateway - The gateway instance.
 * @param {string} intent - The brain intent to send.
 * @example
 * notifyAdmins(this, 'gateway.payment-required');
 */
async function notifyAdmins(gateway, intent) {
  try {
    const admins = await gateway.user.getByRole(USER_ROLE.ADMIN);
    await Promise.all(
      admins.map(async (admin) => {
        const text = gateway.brain.getReply(admin.language, intent);
        await gateway.message.sendToUser(admin.selector, text, null, { messageType: 'notification' });
      }),
    );
  } catch (e) {
    logger.warn(`Gateway: unable to notify admins of the subscription status change (${intent})`);
    logger.warn(e);
  }
}

/**
 * @description Switch the local Gladys Plus subscription state.
 *
 * When Gladys Plus answers "payment required", every plan-gated feature (backups,
 * Enedis sync, AI, voice) is switched off locally, so that the instance stops
 * calling the server for nothing, and the admins are told right away that their
 * subscription needs attention. Nothing else is touched: the instance stays
 * linked, its keys and backup key are kept, and the first successful plan-gated
 * call (daily backup check, manual re-check from the settings) turns everything
 * back on without any action on the instance.
 * @param {boolean} active - True when the subscription is active again, false when payment is required.
 * @returns {Promise} Resolve when the new state is saved.
 * @example
 * await gateway.setSubscriptionActive(false);
 */
async function setSubscriptionActive(active) {
  if (this.subscriptionActive === active) {
    return;
  }
  // set synchronously first: concurrent 402s (Enedis + backup at the same time)
  // must not save and notify twice
  this.subscriptionActive = active;
  if (active) {
    this.subscriptionPaymentRequiredSince = null;
    logger.info('Gateway: Gladys Plus subscription is active again, Gladys Plus features are back on.');
    await this.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
  } else {
    this.subscriptionPaymentRequiredSince = new Date().toISOString();
    logger.warn(
      'Gateway: Gladys Plus answered "payment required". Backups, Enedis sync and AI features are paused until the subscription is paid.',
    );
    await this.variable.setValue(
      SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE,
      this.subscriptionPaymentRequiredSince,
    );
  }
  const payload = {
    subscription_active: active,
    payment_required_since: this.subscriptionPaymentRequiredSince,
  };
  this.event.emit(EVENTS.GATEWAY.SUBSCRIPTION_STATUS_CHANGED, payload);
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.GATEWAY.SUBSCRIPTION_STATUS_CHANGED,
    payload,
  });
  await notifyAdmins(this, active ? 'gateway.subscription-active' : 'gateway.payment-required');
}

module.exports = {
  setSubscriptionActive,
};
