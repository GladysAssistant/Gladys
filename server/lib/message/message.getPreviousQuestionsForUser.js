const { Op } = require('sequelize');

const db = require('../../models');

// Fetch more rows than we keep: tool_call traces and notifications are excluded from AI context.
const FETCH_MESSAGE_LIMIT = 30;
const EXCHANGE_LIMIT = 4;

const UNVERIFIED_ACTION_CLAIM_PATTERNS = [
  /^j['\u2019]ai\s+(ouvert|ouverts|ferm|éteint|allum|enregistr|mis)/i,
  /\best en train de s['\u2019](ouvrir|fermer)/i,
  /\bsont en train de se fermer/i,
  /\ba été (enregistr|éteint|allum|ferm|ouvert)/i,
  /^i('ve| have) (opened|closed|turned off|turned on|recorded|saved|set)/i,
  /\bhas been (turned off|turned on|recorded|saved|opened|closed)/i,
];

/**
 * @description Whether a stored message should be included in AI chat history.
 * Tool-call traces and proactive notifications are UI-only and must not be replayed to the model.
 * @param {object} message - Stored message row.
 * @returns {boolean} True when the message can be used for AI context.
 * @example
 * isChatHistoryMessage({ message_type: 'notification' });
 */
function isChatHistoryMessage(message) {
  return message.message_type !== 'tool_call' && message.message_type !== 'notification';
}

/**
 * @description Detect assistant text that claims a device action was performed.
 * @param {string} text - Assistant reply text.
 * @returns {boolean} True when the text looks like an unverified action confirmation.
 * @example
 * isUnverifiedActionConfirmation("J'ai fermé les volets roulants pour vous.");
 */
function isUnverifiedActionConfirmation(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const normalized = text.trim().replace(/\u2019/g, "'");
  return UNVERIFIED_ACTION_CLAIM_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * @description Decide whether an assistant answer should be replayed to the model.
 * @param {string|null} answer - Assistant reply text.
 * @param {boolean} hadToolCall - Whether a tool was called for this exchange.
 * @returns {string|null} Answer text for AI context, or null when it should be omitted.
 * @example
 * resolveAnswerForAiContext("Comptez 6 minutes.", false);
 */
function resolveAnswerForAiContext(answer, hadToolCall) {
  if (!answer) {
    return null;
  }
  if (hadToolCall) {
    return answer;
  }
  if (isUnverifiedActionConfirmation(answer)) {
    return null;
  }
  return answer;
}

/**
 * @description Build user/assistant exchanges from stored messages in chronological order.
 * Proactive messages are skipped. Assistant answers that claim device actions without a tool call
 * are omitted, while general conversation answers are kept.
 * @param {Array<object>} messages - Stored messages, oldest first.
 * @returns {Array<{question: string|null, answer: string|null}>} Chat exchanges.
 * @example
 * buildExchangesFromMessages([{ sender_id: 'u1', text: 'Hi', message_type: 'chat' }]);
 */
function buildExchangesFromMessages(messages) {
  const exchanges = [];

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    if (msg.sender_id !== null && msg.text) {
      let answer = null;
      let hadToolCall = false;

      for (let j = i + 1; j < messages.length; j += 1) {
        const next = messages[j];
        if (next.sender_id !== null) {
          break;
        }
        if (next.message_type === 'tool_call') {
          hadToolCall = true;
        } else if (isChatHistoryMessage(next) && answer === null) {
          answer = next.text;
        }
      }

      exchanges.push({
        question: msg.text,
        answer: resolveAnswerForAiContext(answer, hadToolCall),
      });
    }
  }

  return exchanges;
}

/**
 * @description Convert stored exchanges to OpenAI-compatible chat messages.
 * @param {Array<{question: string|null, answer: string|null}>} exchanges - Chat exchanges.
 * @returns {Array<object>} Chat API messages.
 * @example
 * exchangesToApiMessages([{ question: 'Hi', answer: 'Hello' }]);
 */
function exchangesToApiMessages(exchanges) {
  const messagesForApi = [];

  (exchanges ?? []).forEach((exchange) => {
    if (!exchange) {
      return;
    }
    if (exchange.question) {
      messagesForApi.push({
        role: 'user',
        content: exchange.question,
      });
    }
    if (exchange.answer) {
      messagesForApi.push({
        role: 'assistant',
        content: exchange.answer,
      });
    }
  });

  return messagesForApi;
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

  const exchanges = buildExchangesFromMessages(previousMessages.reverse());

  if (exchanges.length <= EXCHANGE_LIMIT) {
    return exchanges;
  }

  return exchanges.slice(-EXCHANGE_LIMIT);
}

module.exports = {
  getPreviousQuestionsForUser,
  buildExchangesFromMessages,
  exchangesToApiMessages,
  isChatHistoryMessage,
  isUnverifiedActionConfirmation,
  resolveAnswerForAiContext,
  FETCH_MESSAGE_LIMIT,
  EXCHANGE_LIMIT,
};
