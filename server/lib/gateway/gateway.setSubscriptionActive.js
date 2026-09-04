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
 * @description One transition of the subscription state: persist it, tell the
 * front and the admins. Runs alone (see setSubscriptionActive).
 * @param {object} gateway - The gateway instance.
 * @param {boolean} active - The new state.
 * @returns {Promise} Resolve when the transition is done.
 * @example
 * await transition(this, false);
 */
async function transition(gateway, active) {
  if (gateway.subscriptionActive === active) {
    return;
  }
  const paymentRequiredSince = active ? null : new Date().toISOString();
  if (active) {
    logger.info('Gateway: Gladys Plus subscription is active again, Gladys Plus features are back on.');
    await gateway.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
  } else {
    logger.warn(
      'Gateway: Gladys Plus answered "payment required". Backups, Enedis sync and AI features are paused until the subscription is paid.',
    );
    await gateway.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE, paymentRequiredSince);
  }
  // in-memory state changes only once the new state is persisted, so that
  // what the instance does and what it saved never disagree
  gateway.subscriptionActive = active;
  gateway.subscriptionPaymentRequiredSince = paymentRequiredSince;
  const payload = {
    subscription_active: active,
    payment_required_since: paymentRequiredSince,
  };
  gateway.event.emit(EVENTS.GATEWAY.SUBSCRIPTION_STATUS_CHANGED, payload);
  gateway.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.GATEWAY.SUBSCRIPTION_STATUS_CHANGED,
    payload,
  });
  await notifyAdmins(gateway, active ? 'gateway.subscription-active' : 'gateway.payment-required');
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
 *
 * Transitions run one at a time: a 402 and a success landing at the same
 * moment (Enedis and a backup, say) cannot interleave their persistence and
 * leave the saved lock and the announced state out of step.
 * @param {boolean} active - True when the subscription is active again, false when payment is required.
 * @returns {Promise} Resolve when the new state is saved.
 * @example
 * await gateway.setSubscriptionActive(false);
 */
async function setSubscriptionActive(active) {
  const previous = this.subscriptionTransition || Promise.resolve();
  const current = previous.catch(() => null).then(() => transition(this, active));
  this.subscriptionTransition = current;
  return current;
}

module.exports = {
  setSubscriptionActive,
};
