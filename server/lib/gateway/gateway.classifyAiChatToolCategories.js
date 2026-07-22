const logger = require('../../utils/logger');
const { AI_CHAT_TOOL_CATEGORIES, AI_CHAT_TOOL_CATEGORIES_LIST, AI_CHAT_PURPOSES } = require('../../utils/constants');
const { DEFAULT_TEXT_MODEL } = require('../../utils/aiChatModels');

const MAX_ROUTER_HISTORY_EXCHANGES = 3;
const MAX_ROUTER_HISTORY_CHARS = 200;

const ROUTER_SYSTEM_PROMPT = `You are an intent router for a smart home assistant. Classify the user's last message into one or more of these categories:
- "scenes": create, modify or configure a home automation scene/routine/automation, anything that should happen automatically later, on a schedule or on an event (for example "every day at 8am...", "when the door opens...", "create a scene...").
- "device_control": act on the home right now: turn devices on or off, change light brightness/color/temperature, open or close shutters, start an existing scene, write a value to a sensor.
- "device_query": read information from the home: current device states, temperatures, sensor values, device history, camera images.
- "web_and_time": fetch a public web page, or compare times, schedules or opening hours.
- "other": greetings, general questions or anything that does not fit the categories above.

Reply with ONLY a JSON object, without any other text: {"categories": ["..."]}
Include every category that could be needed to fully answer the request. When unsure between two categories, include both.`;

/**
 * @description Truncate a string for the router conversation context.
 * @param {string} str - Input string.
 * @param {number} limitChars - Maximum number of characters.
 * @returns {string} Truncated string.
 * @example
 * truncateForRouter('abcdef', 3);
 */
function truncateForRouter(str, limitChars) {
  if (str.length <= limitChars) {
    return str;
  }
  return `${str.slice(0, limitChars)}...`;
}

/**
 * @description Build the router user message with a compact conversation context.
 * @param {string} messageText - Current user message.
 * @param {Array<{question:string|null,answer:string|null}>} [previousQuestions] - Previous chat exchanges.
 * @returns {string} Router user message content.
 * @example
 * buildRouterUserContent('Turn on the light', []);
 */
function buildRouterUserContent(messageText, previousQuestions = []) {
  const parts = [];
  const recentExchanges = (previousQuestions ?? []).slice(-MAX_ROUTER_HISTORY_EXCHANGES);
  recentExchanges.forEach(({ question, answer }) => {
    if (question) {
      parts.push(`Previous user message: ${truncateForRouter(question, MAX_ROUTER_HISTORY_CHARS)}`);
    }
    if (answer) {
      parts.push(`Previous assistant reply: ${truncateForRouter(answer, MAX_ROUTER_HISTORY_CHARS)}`);
    }
  });
  parts.push(`User message: ${messageText}`);
  return parts.join('\n');
}

/**
 * @description Parse the router response into a list of valid categories.
 * @param {string} responseText - Raw assistant text from the router call.
 * @returns {Array<string>|null} Valid categories or null when unparseable.
 * @example
 * parseToolCategoriesResponse('{"categories": ["scenes"]}');
 */
function parseToolCategoriesResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return null;
  }
  const withoutFences = responseText.replace(/```[a-z]*\n?/gi, '');
  const jsonMatch = withoutFences.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    return null;
  }
  const rawCategories = Array.isArray(parsed) ? parsed : parsed?.categories;
  if (!Array.isArray(rawCategories)) {
    return null;
  }
  const categories = [
    ...new Set(
      rawCategories
        .filter((category) => typeof category === 'string')
        .map((category) => category.trim().toLowerCase())
        .filter((category) => AI_CHAT_TOOL_CATEGORIES_LIST.includes(category)),
    ),
  ];
  if (categories.length === 0) {
    return null;
  }
  return categories;
}

/**
 * @description Filter MCP tools with the categories selected by the router.
 * Tools without categories are always kept. When filtering would remove
 * every tool, the full list is returned as a safety net.
 * @param {Array<object>} mcpTools - MCP tools with intent/config.
 * @param {Array<string>|null} categories - Selected categories or null.
 * @returns {Array<object>} Filtered MCP tools.
 * @example
 * filterMcpToolsByCategories(mcpTools, ['device_control']);
 */
function filterMcpToolsByCategories(mcpTools, categories) {
  if (!categories || categories.length === 0) {
    return mcpTools;
  }
  const selected = new Set(categories);
  const filteredTools = mcpTools.filter((tool) => {
    const toolCategories = tool?.config?.categories;
    if (!Array.isArray(toolCategories) || toolCategories.length === 0) {
      return true;
    }
    return toolCategories.some((category) => selected.has(category));
  });
  if (filteredTools.length === 0) {
    return mcpTools;
  }
  return filteredTools;
}

/**
 * @public
 * @description Classify a user message into AI chat tool categories, using a
 * single fast model call without tools. This lets the main tool-calling
 * request carry only the tools relevant to the request (two-stage routing),
 * which keeps the context focused, especially for scene creation.
 * Returns null when the message cannot be classified: callers must then
 * fall back to the full tool list.
 * @param {object} request - Request payload.
 * @param {string} request.messageText - Current user message text.
 * @param {Array<{question:string|null,answer:string|null}>} [request.previousQuestions] - Previous chat exchanges.
 * @returns {Promise<Array<string>|null>} Selected categories or null.
 * @example
 * classifyAiChatToolCategories({ messageText: 'Turn on the light', previousQuestions: [] });
 */
async function classifyAiChatToolCategories({ messageText, previousQuestions }) {
  if (!messageText || !messageText.trim()) {
    return null;
  }
  try {
    // The router always uses a fast model, never the (potentially large and
    // slow) model selected for the main request: classification is a simple
    // task and must stay low-latency. The purpose field lets the gateway pick
    // the best fast model itself; the explicit model is a fallback for
    // gateways that do not handle purpose yet.
    const apiResponse = await this.aiChat({
      messages: [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        { role: 'user', content: buildRouterUserContent(messageText, previousQuestions) },
      ],
      model: DEFAULT_TEXT_MODEL,
      purpose: AI_CHAT_PURPOSES.INTENT_CLASSIFICATION,
    });
    const responseText = apiResponse?.choices?.[0]?.message?.content ?? apiResponse?.message?.content ?? null;
    const categories = parseToolCategoriesResponse(responseText);
    if (!categories) {
      logger.info(`[AI_CHAT] Router could not classify message, falling back to all tools`);
      return null;
    }
    logger.info(`[AI_CHAT] Router categories=${categories.join(',')}`);
    return categories;
  } catch (e) {
    logger.warn(`[AI_CHAT] Router classification failed, falling back to all tools: ${e.message}`);
    return null;
  }
}

module.exports = {
  classifyAiChatToolCategories,
  parseToolCategoriesResponse,
  filterMcpToolsByCategories,
  buildRouterUserContent,
  AI_CHAT_TOOL_CATEGORIES,
};
