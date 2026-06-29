const { Op } = require('sequelize');

const db = require('../../models');

// Fetch more rows than we keep: tool_call traces are excluded from AI context.
const FETCH_MESSAGE_LIMIT = 30;
const EXCHANGE_LIMIT = 4;

/**
 * @description Whether a stored message should be included in AI chat history.
 * Tool-call traces are UI-only and must not be replayed as assistant text.
 * @param {object} message - Stored message row.
 * @returns {boolean} True when the message can be used for AI context.
 * @example
 * isChatHistoryMessage({ message_type: 'tool_call' });
 */
function isChatHistoryMessage(message) {
  return message.message_type !== 'tool_call';
}

/**
 * @description Build previous chat exchanges for AI context from stored messages.
 * @param {string} userId - Gladys user id.
 * @returns {Promise<Array<{question: string|null, answer: string|null}>>} Previous exchanges.
 * @example
 * getPreviousQuestionsForUser('user-uuid');
 */
async function getPreviousQuestionsForUser(userId) {
  const previousMessages = await db.Message.findAll({
    where: {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    },
    attributes: ['sender_id', 'text', 'message_type'],
    order: [['created_at', 'desc']],
    limit: FETCH_MESSAGE_LIMIT,
  });

  const chatMessages = previousMessages.reverse().filter(isChatHistoryMessage);

  const previousQuestions = [];
  let currentExchange = null;

  chatMessages.forEach((msg) => {
    if (msg.sender_id !== null) {
      currentExchange = {
        question: msg.text,
        answer: null,
      };
    } else if (currentExchange && currentExchange.question && !currentExchange.answer) {
      currentExchange.answer = msg.text;
      previousQuestions.push({ ...currentExchange });
      currentExchange = null;
    } else {
      previousQuestions.push({
        question: null,
        answer: msg.text,
      });
    }
  });

  if (previousQuestions.length <= EXCHANGE_LIMIT) {
    return previousQuestions;
  }

  return previousQuestions.slice(-EXCHANGE_LIMIT);
}

module.exports = {
  getPreviousQuestionsForUser,
  isChatHistoryMessage,
  FETCH_MESSAGE_LIMIT,
  EXCHANGE_LIMIT,
};
