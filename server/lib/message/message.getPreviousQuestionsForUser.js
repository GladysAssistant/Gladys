const { Op } = require('sequelize');

const db = require('../../models');

// Fetch more rows than we keep: tool_call traces and notifications are excluded from AI context.
const FETCH_MESSAGE_LIMIT = 30;
// Counts user turns only: messages Gladys sends on her own never push the conversation out.
const EXCHANGE_LIMIT = 4;
// Most recent messages sent by Gladys on her own (scenes) kept in the AI context.
const SCENE_MESSAGE_LIMIT = 6;
// A Gladys message sent within this delay after a user message belongs to the AI turn answering
// it (tool traces, camera image, text reply). A later one was sent by Gladys on her own.
const AI_TURN_MAX_DURATION_MS = 5 * 60 * 1000;
// Tells the model, and the tool router, that a message is not a reply of the assistant.
// The system prompt (config/prompts/aiChat.prompt.txt) explains it.
const SCENE_MESSAGE_PREFIX = '[Scene message]';

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
 * @description Whether a Gladys message was sent during the AI turn answering a user message.
 * When a date is missing or invalid, the message is kept with the user message, as it follows it.
 * @param {Date|string} questionCreatedAt - Creation date of the user message.
 * @param {Date|string} messageCreatedAt - Creation date of the Gladys message.
 * @returns {boolean} True when the Gladys message belongs to the AI turn of the user message.
 * @example
 * isPartOfAiTurn('2026-11-19T08:00:00.000Z', '2026-11-19T08:00:05.000Z');
 */
function isPartOfAiTurn(questionCreatedAt, messageCreatedAt) {
  const delay = new Date(messageCreatedAt).getTime() - new Date(questionCreatedAt).getTime();
  if (Number.isNaN(delay)) {
    return true;
  }
  return delay <= AI_TURN_MAX_DURATION_MS;
}

/**
 * @description Build user/assistant exchanges from stored messages in chronological order.
 * The Gladys messages sent during the AI turn following a user message form its answer. Assistant
 * answers that claim device actions without a tool call are omitted, while general conversation
 * answers are kept. The other Gladys chat messages were sent by Gladys on her own (scene "send a
 * message" or "ask the AI" actions): they are kept, in order, as `{ question: null, answer }`
 * exchanges prefixed with SCENE_MESSAGE_PREFIX, so a user replying to a scene is understood.
 * Notifications and tool_call traces are left out.
 * @param {Array<object>} messages - Stored messages, oldest first.
 * @returns {Array<{question: string|null, answer: string|null}>} Chat exchanges.
 * @example
 * buildExchangesFromMessages([{ sender_id: 'u1', text: 'Hi', message_type: 'chat' }]);
 */
function buildExchangesFromMessages(messages) {
  const exchanges = [];
  let currentTurn = null;

  const closeCurrentTurn = () => {
    // a user message without text (image only) is not replayed, nor its answer
    if (currentTurn && currentTurn.question) {
      const answers = currentTurn.answers
        .map((answer) => resolveAnswerForAiContext(answer, currentTurn.hadToolCall))
        .filter(Boolean);
      exchanges.push({
        question: currentTurn.question,
        answer: answers.length > 0 ? answers.join('\n\n') : null,
      });
    }
    currentTurn = null;
  };

  messages.forEach((message) => {
    if (message.sender_id !== null) {
      closeCurrentTurn();
      currentTurn = {
        question: message.text,
        createdAt: message.created_at,
        answers: [],
        hadToolCall: false,
      };
      return;
    }
    if (currentTurn && isPartOfAiTurn(currentTurn.createdAt, message.created_at)) {
      if (message.message_type === 'tool_call') {
        currentTurn.hadToolCall = true;
      } else if (isChatHistoryMessage(message) && message.text) {
        currentTurn.answers.push(message.text);
      }
      return;
    }
    // messages are in chronological order: the AI turn is over
    closeCurrentTurn();
    if (isChatHistoryMessage(message) && message.text) {
      exchanges.push({
        question: null,
        answer: `${SCENE_MESSAGE_PREFIX} ${message.text}`,
      });
    }
  });
  closeCurrentTurn();

  return exchanges;
}

/**
 * @description Keep the last EXCHANGE_LIMIT user exchanges and the SCENE_MESSAGE_LIMIT most recent
 * messages sent by Gladys on her own after the oldest of them (or after the start of the fetched
 * history, while it holds fewer user exchanges).
 * @param {Array<{question: string|null, answer: string|null}>} exchanges - Chat exchanges, oldest first.
 * @returns {Array<{question: string|null, answer: string|null}>} Exchanges kept for AI context.
 * @example
 * limitExchanges([{ question: 'Hi', answer: 'Hello' }, { question: null, answer: '[Scene message] Bye' }]);
 */
function limitExchanges(exchanges) {
  const kept = [];
  let userExchangeCount = 0;
  let sceneMessageCount = 0;

  for (let i = exchanges.length - 1; i >= 0; i -= 1) {
    const exchange = exchanges[i];
    if (exchange.question !== null) {
      userExchangeCount += 1;
      kept.unshift(exchange);
      if (userExchangeCount === EXCHANGE_LIMIT) {
        break;
      }
    } else if (sceneMessageCount < SCENE_MESSAGE_LIMIT) {
      sceneMessageCount += 1;
      kept.unshift(exchange);
    }
  }

  return kept;
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
    attributes: ['sender_id', 'text', 'message_type', 'created_at'],
    order: [['created_at', 'desc']],
    limit: FETCH_MESSAGE_LIMIT,
  });

  return limitExchanges(buildExchangesFromMessages(previousMessages.reverse()));
}

module.exports = {
  getPreviousQuestionsForUser,
  buildExchangesFromMessages,
  limitExchanges,
  exchangesToApiMessages,
  isChatHistoryMessage,
  isPartOfAiTurn,
  isUnverifiedActionConfirmation,
  resolveAnswerForAiContext,
  FETCH_MESSAGE_LIMIT,
  EXCHANGE_LIMIT,
  SCENE_MESSAGE_LIMIT,
  AI_TURN_MAX_DURATION_MS,
  SCENE_MESSAGE_PREFIX,
};
