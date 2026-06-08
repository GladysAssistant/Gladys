const db = require('../../models');
const { EVENTS } = require('../../utils/constants');
const { getPreviousQuestionsForUser } = require('./message.getPreviousQuestionsForUser');

/**
 * @description Check if Gladys Plus gateway is configured on this instance.
 * @returns {Promise<boolean>} True when gateway credentials are present.
 * @example
 * const configured = await isGladysPlusConfigured.call(messageHandler);
 */
async function isGladysPlusConfigured() {
  const gladysGatewayRefreshToken = await this.variable.getValue('GLADYS_GATEWAY_REFRESH_TOKEN');
  const gladysGatewayRsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_RSA_PRIVATE_KEY');
  const gladysGatewayEcdsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY');

  return (
    gladysGatewayRefreshToken !== null && gladysGatewayRsaPrivateKey !== null && gladysGatewayEcdsaPrivateKey !== null
  );
}

/**
 * @public
 * @description Handle a new message sent by a user to Gladys.
 * @param {object} message - A message sent by a user.
 * @returns {Promise<object>} Resolve with created message.
 * @example
 * message.create(message);
 */
async function create(message) {
  const context = {
    user: message.user,
  };
  const gladysPlusConfigured = await isGladysPlusConfigured.call(this);

  const messageToInsert = {
    text: message.text,
    sender_id: message.user.id,
    receiver_id: null,
    is_read: true,
    id: message.id,
  };

  if (gladysPlusConfigured) {
    const previousQuestions = await getPreviousQuestionsForUser(message.user.id);
    this.event.emit(EVENTS.MESSAGE.NEW_FOR_OPEN_AI, { message, previousQuestions, context });
  }

  await db.Message.create(messageToInsert);

  if (!gladysPlusConfigured) {
    await this.replyByIntent(message, 'openai.plus-required', context);
  }

  return {
    message,
  };
}

module.exports = {
  create,
};
