const { Op } = require('sequelize');

const db = require('../../models');

// Rows fetched per query: tool_call traces and notifications are excluded from AI context, so more
// rows are fetched than kept.
const FETCH_MESSAGE_LIMIT = 30;
// Queries made at most to find EXCHANGE_LIMIT user messages: messages sent by scenes cannot push the
// conversation out of the fetched rows, and a user who never wrote does not make every request read
// the whole table.
const MAX_FETCH_BATCHES = 5;
// Counts user turns only: messages Gladys sends on her own never push the conversation out.
const EXCHANGE_LIMIT = 4;
// Most recent messages sent by Gladys on her own (scenes) kept in the AI context.
const SCENE_MESSAGE_LIMIT = 6;
// Longest scene message replayed: an "ask the AI" answer, such as a daily summary, can be long.
const MAX_SCENE_MESSAGE_CHARS = 1000;
// Longest delay between two messages of an AI turn before its first reply (user message, tool_call
// traces): with an external provider, one model request takes up to 120 s, and can be followed by a
// retry and by the execution of a tool.
const AI_TURN_MAX_GAP_MS = 5 * 60 * 1000;
// The AI sends all its replies at the end of its turn, one after the other (camera images, then
// text): a message sent longer than this after the first reply is not part of the turn. Each reply
// is also sent to the messaging channels of the user before the next one, hence the margin.
const AI_REPLY_BURST_MS = 60 * 1000;
// A reply that the unverified-action guard rejects is dropped when it was sent this soon after the
// user message, as an AI reply is. Later, it more likely comes from a scene, after a turn that sent
// no reply (NO_RESPONSE, a failed reply): it is then kept as a scene message.
const AI_QUICK_REPLY_MS = 60 * 1000;
// Tells the model, and the tool router, that a message is not a reply of the assistant.
// The system prompt (config/prompts/aiChat.prompt.txt) explains it.
const SCENE_MESSAGE_PREFIX = '[Scene message]';
const SCENE_MESSAGE_PREFIX_PATTERN = /^(?:\s*\[Scene message\])+\s*/;
// Introduces, in the system message, the scene messages sent before the first user message of the
// history: some chat templates refuse an assistant message right after the system message.
const EARLIER_SCENE_MESSAGES_NOTE = 'Messages sent to the user by their scenes before the conversation below:';

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
 * @description Whether a message was sent at most a given delay after an earlier one. When a date is
 * missing or invalid, the answer is yes: both messages are taken as part of the same AI turn.
 * @param {Date|string|null} earlierCreatedAt - Creation date of the earlier message.
 * @param {Date|string|null} createdAt - Creation date of the message.
 * @param {number} maxDelayMs - Longest delay accepted.
 * @returns {boolean} True when the message was sent within the delay.
 * @example
 * isWithinDelay('2026-11-19T08:00:00.000Z', '2026-11-19T08:00:05.000Z', 60000);
 */
function isWithinDelay(earlierCreatedAt, createdAt, maxDelayMs) {
  if (earlierCreatedAt == null || createdAt == null) {
    return true;
  }
  const delay = new Date(createdAt).getTime() - new Date(earlierCreatedAt).getTime();
  if (Number.isNaN(delay)) {
    return true;
  }
  return delay <= maxDelayMs;
}

/**
 * @description Whether a Gladys message (not a notification) belongs to the AI turn answering a user
 * message. Before its first reply, the turn lasts as long as its messages (tool_call traces) follow
 * each other within AI_TURN_MAX_GAP_MS. The AI then sends all its replies in a row: without a tool
 * call, a single one (its answer or an error), so any later message comes from a scene; with tool
 * calls, maybe several (camera images, then text), sent within AI_REPLY_BURST_MS of the first one.
 * @param {object} turn - Current AI turn.
 * @param {Date|string|null} turn.lastMessageAt - Creation date of the last message of the turn.
 * @param {Date|string|null} [turn.firstReplyAt] - Creation date of the first reply of the turn.
 * @param {boolean} turn.hasReply - Whether the turn already has a reply.
 * @param {boolean} turn.hadToolCall - Whether a tool_call trace belongs to the turn.
 * @param {object} message - Stored Gladys message, after the last message of the turn.
 * @returns {boolean} True when the message belongs to the turn.
 * @example
 * isPartOfAiTurn({ lastMessageAt: new Date(), hasReply: false, hadToolCall: false }, message);
 */
function isPartOfAiTurn(turn, message) {
  if (!turn.hasReply) {
    return isWithinDelay(turn.lastMessageAt, message.created_at, AI_TURN_MAX_GAP_MS);
  }
  if (!turn.hadToolCall) {
    return false;
  }
  return isWithinDelay(turn.firstReplyAt, message.created_at, AI_REPLY_BURST_MS);
}

/**
 * @description Format a message sent by a scene for the AI context: truncated and prefixed.
 * @param {string} text - Message text.
 * @returns {string} Text replayed to the model.
 * @example
 * formatSceneMessage('Faut-il éteindre le sèche-linge ?');
 */
function formatSceneMessage(text) {
  const truncated = text.length > MAX_SCENE_MESSAGE_CHARS ? `${text.slice(0, MAX_SCENE_MESSAGE_CHARS)}…` : text;
  return `${SCENE_MESSAGE_PREFIX} ${truncated}`;
}

/**
 * @description Remove the scene message prefix that a model copied at the start of its reply.
 * @param {string} answer - Assistant reply text.
 * @returns {string} Reply without the prefix.
 * @example
 * stripSceneMessagePrefix('[Scene message] Le sèche-linge est éteint.');
 */
function stripSceneMessagePrefix(answer) {
  return answer.replace(SCENE_MESSAGE_PREFIX_PATTERN, '');
}

/**
 * @description Build user/assistant exchanges from stored messages in chronological order.
 * The Gladys messages of the AI turn following a user message (see isPartOfAiTurn) form its answer.
 * Assistant answers that claim device actions without a tool call are omitted, while general
 * conversation answers are kept. The other Gladys chat messages were sent by Gladys on her own
 * (scene "send a message" or "ask the AI" actions): they are kept, in order, as
 * `{ question: null, answer }` exchanges formatted by formatSceneMessage, so a user replying to a
 * scene is understood. They do not go through the unverified-action guard: most are notifications
 * written by the user in a scene ("La porte du garage a été ouverte, faut-il la fermer ?"), which
 * the guard would drop; the prefix and the system prompt already tell the model not to take any
 * previous message as a source of truth for device states. Notifications and tool_call traces are
 * left out.
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
    // a late reply rejected by the guard, after a turn without tool call: see AI_QUICK_REPLY_MS
    if (currentTurn && currentTurn.lateRejectedReply) {
      exchanges.push({ question: null, answer: formatSceneMessage(currentTurn.lateRejectedReply) });
    }
    currentTurn = null;
  };

  messages.forEach((message) => {
    // notifications are left out, and take no part in telling an AI turn from scene messages
    if (message.message_type === 'notification') {
      return;
    }
    if (message.sender_id !== null) {
      closeCurrentTurn();
      currentTurn = {
        question: message.text,
        questionCreatedAt: message.created_at,
        lastMessageAt: message.created_at,
        firstReplyAt: null,
        hasReply: false,
        answers: [],
        lateRejectedReply: null,
        hadToolCall: false,
      };
      return;
    }
    if (currentTurn && isPartOfAiTurn(currentTurn, message)) {
      currentTurn.lastMessageAt = message.created_at;
      if (message.message_type === 'tool_call') {
        currentTurn.hadToolCall = true;
        return;
      }
      if (!currentTurn.hasReply) {
        currentTurn.hasReply = true;
        currentTurn.firstReplyAt = message.created_at;
      }
      if (!message.text) {
        return;
      }
      const isLateRejectedReply =
        !currentTurn.hadToolCall &&
        resolveAnswerForAiContext(message.text, false) === null &&
        !isWithinDelay(currentTurn.questionCreatedAt, message.created_at, AI_QUICK_REPLY_MS);
      if (isLateRejectedReply) {
        currentTurn.lateRejectedReply = message.text;
      } else {
        currentTurn.answers.push(message.text);
      }
      return;
    }
    // messages are in chronological order: the AI turn is over
    closeCurrentTurn();
    if (isChatHistoryMessage(message) && message.text) {
      exchanges.push({
        question: null,
        answer: formatSceneMessage(message.text),
      });
    }
  });
  closeCurrentTurn();

  return exchanges;
}

/**
 * @description Keep the last user exchanges and the most recent messages sent by Gladys on her own
 * after the oldest of them (or after the start of the history, while it holds fewer user exchanges).
 * @param {Array<{question: string|null, answer: string|null}>} exchanges - Chat exchanges, oldest first.
 * @param {object} [limits] - Limits to apply.
 * @param {number} [limits.exchangeLimit] - User exchanges kept.
 * @param {number} [limits.sceneMessageLimit] - Messages sent by Gladys on her own kept.
 * @returns {Array<{question: string|null, answer: string|null}>} Exchanges kept, oldest first.
 * @example
 * limitExchanges([{ question: 'Hi', answer: 'Hello' }, { question: null, answer: '[Scene message] Bye' }]);
 */
function limitExchanges(exchanges, { exchangeLimit = EXCHANGE_LIMIT, sceneMessageLimit = SCENE_MESSAGE_LIMIT } = {}) {
  const kept = [];
  let userExchangeCount = 0;
  let sceneMessageCount = 0;

  for (let i = exchanges.length - 1; i >= 0; i -= 1) {
    const exchange = exchanges[i];
    if (exchange.question !== null) {
      userExchangeCount += 1;
      kept.unshift(exchange);
      if (userExchangeCount === exchangeLimit) {
        break;
      }
    } else if (sceneMessageCount < sceneMessageLimit) {
      sceneMessageCount += 1;
      kept.unshift(exchange);
    }
  }

  return kept;
}

/**
 * @description Convert stored exchanges to OpenAI-compatible chat messages.
 * Assistant messages in a row (an answer, then scene messages) are merged into one: some chat
 * templates require the roles to alternate. User messages in a row (a question whose answer was
 * omitted, then the next one) are not: merged, the model would take the old request for a new one.
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
      const previousMessage = messagesForApi[messagesForApi.length - 1];
      if (previousMessage && previousMessage.role === 'assistant') {
        previousMessage.content = `${previousMessage.content}\n\n${exchange.answer}`;
      } else {
        messagesForApi.push({
          role: 'assistant',
          content: exchange.answer,
        });
      }
    }
  });

  return messagesForApi;
}

/**
 * @description Build the system message and the previous exchanges of a chat request.
 * Scene messages sent before the first user message of the history are moved to the end of the
 * system message, so the first message after it is never an assistant message.
 * @param {string} systemPrompt - System prompt.
 * @param {Array<{question: string|null, answer: string|null}>} exchanges - Chat exchanges.
 * @returns {Array<object>} Chat API messages, starting with the system message.
 * @example
 * buildChatApiMessages('You are Gladys AI', [{ question: 'Hi', answer: 'Hello' }]);
 */
function buildChatApiMessages(systemPrompt, exchanges) {
  const historyMessages = exchangesToApiMessages(exchanges);
  // assistant messages in a row are merged: at most one comes before the first user message
  if (historyMessages.length > 0 && historyMessages[0].role === 'assistant') {
    const [earlierSceneMessages, ...otherMessages] = historyMessages;
    return [
      {
        role: 'system',
        content: `${systemPrompt}\n\n${EARLIER_SCENE_MESSAGES_NOTE}\n${earlierSceneMessages.content}`,
      },
      ...otherMessages,
    ];
  }
  return [{ role: 'system', content: systemPrompt }, ...historyMessages];
}

/**
 * @description Fetch the recent messages of a user, newest first, by batches of FETCH_MESSAGE_LIMIT
 * rows until they hold EXCHANGE_LIMIT user messages, no row remains or MAX_FETCH_BATCHES is reached.
 * Each batch starts at the oldest date of the previous one (not at an offset, which a message
 * inserted meanwhile would shift), and the rows already read at that date are skipped.
 * @param {string} userId - Gladys user id.
 * @returns {Promise<Array<object>>} Stored messages, newest first.
 * @example
 * fetchRecentMessages('user-uuid');
 */
async function fetchRecentMessages(userId) {
  const messages = [];
  const readMessageIds = new Set();
  let oldestCreatedAt = null;
  for (let batch = 0; batch < MAX_FETCH_BATCHES; batch += 1) {
    const where = {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    };
    if (oldestCreatedAt !== null) {
      where.created_at = { [Op.lte]: oldestCreatedAt };
    }
    // eslint-disable-next-line no-await-in-loop
    const batchMessages = await db.Message.findAll({
      where,
      attributes: ['id', 'sender_id', 'text', 'message_type', 'created_at'],
      order: [['created_at', 'desc']],
      limit: FETCH_MESSAGE_LIMIT,
    });
    batchMessages
      .filter((message) => !readMessageIds.has(message.id))
      .forEach((message) => {
        readMessageIds.add(message.id);
        messages.push(message);
      });
    const userMessageCount = messages.filter((message) => message.sender_id !== null).length;
    if (batchMessages.length < FETCH_MESSAGE_LIMIT || userMessageCount >= EXCHANGE_LIMIT) {
      break;
    }
    oldestCreatedAt = batchMessages[batchMessages.length - 1].created_at;
  }
  return messages;
}

/**
 * @description Build previous chat exchanges for AI context from stored messages.
 * @param {string} userId - Gladys user id.
 * @returns {Promise<Array<{question: string|null, answer: string|null}>>} Previous exchanges.
 * @example
 * getPreviousQuestionsForUser('user-uuid');
 */
async function getPreviousQuestionsForUser(userId) {
  const previousMessages = await fetchRecentMessages(userId);
  return limitExchanges(buildExchangesFromMessages(previousMessages.reverse()));
}

module.exports = {
  getPreviousQuestionsForUser,
  fetchRecentMessages,
  buildExchangesFromMessages,
  limitExchanges,
  exchangesToApiMessages,
  buildChatApiMessages,
  isChatHistoryMessage,
  isWithinDelay,
  isPartOfAiTurn,
  isUnverifiedActionConfirmation,
  resolveAnswerForAiContext,
  formatSceneMessage,
  stripSceneMessagePrefix,
  FETCH_MESSAGE_LIMIT,
  MAX_FETCH_BATCHES,
  EXCHANGE_LIMIT,
  SCENE_MESSAGE_LIMIT,
  MAX_SCENE_MESSAGE_CHARS,
  AI_TURN_MAX_GAP_MS,
  AI_REPLY_BURST_MS,
  AI_QUICK_REPLY_MS,
  SCENE_MESSAGE_PREFIX,
};
