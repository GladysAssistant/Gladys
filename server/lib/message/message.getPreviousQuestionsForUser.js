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
// Longest delay between two messages of the same AI turn: with an external provider, one model
// request takes up to 120 s, and can be followed by a retry and by the execution of a tool.
const AI_TURN_MAX_GAP_MS = 5 * 60 * 1000;
// Tells the model, and the tool router, that a message is not a reply of the assistant.
// The system prompt (config/prompts/aiChat.prompt.txt) explains it.
const SCENE_MESSAGE_PREFIX = '[Scene message]';
const SCENE_MESSAGE_PREFIX_PATTERN = /^(?:\s*\[Scene message\])+\s*/;
// Introduces, in the system message, the scene messages sent before the first user message of the
// history: some chat templates refuse an assistant message right after the system message.
const EARLIER_SCENE_MESSAGES_NOTE = 'Messages sent to the user by their scenes before the conversation below:';

const UNVERIFIED_ACTION_CLAIM_PATTERNS = [
  /^j['’]ai\s+(ouvert|ouverts|ferm|éteint|allum|enregistr|mis)/i,
  /\best en train de s['’](ouvrir|fermer)/i,
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
  const normalized = text.trim().replace(/’/g, "'");
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
 * @description Whether a message was sent soon enough after the previous message of an AI turn to
 * belong to it. When a date is missing or invalid, the message is kept in the turn, as it follows it.
 * @param {Date|string|null} previousCreatedAt - Creation date of the previous message of the turn.
 * @param {Date|string|null} createdAt - Creation date of the message.
 * @returns {boolean} True when the delay between both messages fits in an AI turn.
 * @example
 * isWithinAiTurnGap('2026-11-19T08:00:00.000Z', '2026-11-19T08:00:05.000Z');
 */
function isWithinAiTurnGap(previousCreatedAt, createdAt) {
  if (previousCreatedAt == null || createdAt == null) {
    return true;
  }
  const delay = new Date(createdAt).getTime() - new Date(previousCreatedAt).getTime();
  if (Number.isNaN(delay)) {
    return true;
  }
  return delay <= AI_TURN_MAX_GAP_MS;
}

/**
 * @description Whether a Gladys message belongs to the AI turn answering a user message.
 * Without a tool call, the AI sends a single message (its answer or an error): any later message of
 * Gladys comes from a scene. With tool calls, the AI can send several (camera image, then text):
 * the messages that follow each other within AI_TURN_MAX_GAP_MS belong to the turn.
 * @param {object} turn - Current AI turn.
 * @param {Date|string|null} turn.lastMessageAt - Creation date of the last message of the turn.
 * @param {Array<string>} turn.answers - Text replies of the turn so far.
 * @param {boolean} turn.hadToolCall - Whether a tool_call trace belongs to the turn.
 * @param {object} message - Stored Gladys message, after the last message of the turn.
 * @returns {boolean} True when the message belongs to the turn.
 * @example
 * isPartOfAiTurn({ lastMessageAt: new Date(), answers: [], hadToolCall: false }, message);
 */
function isPartOfAiTurn(turn, message) {
  if (!turn.hadToolCall && turn.answers.length > 0) {
    return false;
  }
  return isWithinAiTurnGap(turn.lastMessageAt, message.created_at);
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
    currentTurn = null;
  };

  messages.forEach((message) => {
    if (message.sender_id !== null) {
      closeCurrentTurn();
      currentTurn = {
        question: message.text,
        lastMessageAt: message.created_at,
        answers: [],
        hadToolCall: false,
      };
      return;
    }
    if (currentTurn && isPartOfAiTurn(currentTurn, message)) {
      currentTurn.lastMessageAt = message.created_at;
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
 * @param {string} userId - Gladys user id.
 * @returns {Promise<Array<object>>} Stored messages, newest first.
 * @example
 * fetchRecentMessages('user-uuid');
 */
async function fetchRecentMessages(userId) {
  const messages = [];
  for (let batch = 0; batch < MAX_FETCH_BATCHES; batch += 1) {
    // eslint-disable-next-line no-await-in-loop
    const batchMessages = await db.Message.findAll({
      where: {
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      attributes: ['sender_id', 'text', 'message_type', 'created_at'],
      order: [['created_at', 'desc']],
      limit: FETCH_MESSAGE_LIMIT,
      offset: batch * FETCH_MESSAGE_LIMIT,
    });
    messages.push(...batchMessages);
    const userMessageCount = messages.filter((message) => message.sender_id !== null).length;
    if (batchMessages.length < FETCH_MESSAGE_LIMIT || userMessageCount >= EXCHANGE_LIMIT) {
      break;
    }
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
  isWithinAiTurnGap,
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
  SCENE_MESSAGE_PREFIX,
};
