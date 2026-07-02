const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { Error429 } = require('../../utils/httpErrors');
const { resizeImage } = require('../../utils/resizeImage');
const { mcpToolsToChatApiFormat, toolNameFromIntent } = require('../../services/mcp/lib/mcpToolsToChatApiFormat');

const MAX_TOOL_CALL_ITERATIONS = 5;
const MAX_TOOL_RESULT_CHARS = 4000;
const MAX_FALLBACK_ANSWER_CHARS = 2000;
const MAX_NESTED_VALUE_CHARS = 2000;

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Europe/Paris';
const promptPath = path.join(__dirname, '../../config/prompts/aiChat.prompt.txt');
const SYSTEM_PROMPT = fs.readFileSync(promptPath, 'utf8');

/**
 * @description Build the system prompt with the current date and time.
 * @param {string} timezoneName - IANA timezone used by the Gladys instance.
 * @param {Date} [now] - Reference date, mainly for tests.
 * @returns {string} System prompt with current datetime context.
 * @example
 * buildSystemPromptWithCurrentTime('Europe/Paris', new Date('2026-06-15T10:30:00Z'));
 */
function buildSystemPromptWithCurrentTime(timezoneName, now = new Date()) {
  const formattedNow = dayjs(now)
    .tz(timezoneName)
    .format('dddd YYYY-MM-DD HH:mm');
  return `${SYSTEM_PROMPT}\n\nCurrent date and time (${timezoneName}): ${formattedNow}`;
}

/**
 * @description Return MCP handler from service manager.
 * @param {object} serviceManager - Service manager instance.
 * @returns {object} MCP handler.
 * @example
 * const mcpHandler = getMcpHandler(this.serviceManager);
 */
function getMcpHandler(serviceManager) {
  const mcpService = serviceManager.getService('mcp');
  if (!mcpService?.mcpHandler) {
    throw new Error('MCP service is not running. Start the MCP integration before using AI chat.');
  }
  return mcpService.mcpHandler;
}

/**
 * @description Extract assistant message payload from gateway response.
 * @param {object} apiResponse - Chat API response.
 * @returns {object|null} Assistant message object.
 * @example
 * const assistant = extractAssistantMessage(response);
 */
function extractAssistantMessage(apiResponse) {
  // Expected shape: OpenAI compatible chat completion response.
  const choiceMessage = apiResponse?.choices?.[0]?.message;
  if (choiceMessage) {
    return choiceMessage;
  }
  return apiResponse?.message ?? apiResponse?.assistant ?? null;
}

/**
 * @description Truncate a string to a max length.
 * @param {string} str - Input string.
 * @param {number} limitChars - Maximum number of characters.
 * @returns {string} Truncated or original string.
 * @example
 * truncate('abcdef', 3);
 */
function truncate(str, limitChars) {
  if (!str) {
    return '';
  }
  if (str.length <= limitChars) {
    return str;
  }
  return `${str.slice(0, limitChars)}... (truncated)`;
}

/**
 * @description Safely stringify any value for model context.
 * @param {any} value - Value to stringify.
 * @param {number} limitChars - Output max length.
 * @returns {string} Safe serialized value.
 * @example
 * safeStringify({ ok: true }, 100);
 */
function safeStringify(value, limitChars = MAX_TOOL_RESULT_CHARS) {
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return truncate(str, limitChars);
  } catch (e) {
    return '[unserializable tool result]';
  }
}

/**
 * @description Format a value for concise debug logs.
 * @param {any} value - Value to preview.
 * @param {number} [limitChars=200] - Maximum preview length.
 * @returns {string} Safe one-line preview.
 * @example
 * debugPreview('hello world', 5);
 */
function debugPreview(value, limitChars = 200) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return truncate(value.replace(/\s+/g, ' ').trim(), limitChars) || '(empty string)';
  }
  return truncate(safeStringify(value, limitChars), limitChars);
}

const CAMERA_IMAGE_SENT_TO_USER_HINT =
  'Camera image(s) were sent to the user in the chat. Reply briefly without image URLs or markdown images.';

/**
 * @description Convert MCP image content object to message file format.
 * @param {object} imageContent - Image content from tool output.
 * @returns {string|null} Formatted file payload or null.
 * @example
 * imageContentToMessageFile({ mimeType: 'image/jpeg', data: 'abc' });
 */
function imageContentToMessageFile(imageContent) {
  const { data, mimeType } = imageContent ?? {};
  if (!data) {
    return null;
  }
  if (typeof data === 'string' && data.includes(';base64,')) {
    return data.replace(/^data:/, '');
  }
  return `${mimeType || 'image/jpeg'};base64,${data}`;
}

/**
 * @description Extract image files from tool result payload.
 * @param {object} toolResult - Tool result object.
 * @returns {Array<string>} List of message file payloads.
 * @example
 * extractMessageFilesFromToolResult({ content: [{ type: 'image', data: 'abc' }] });
 */
function extractMessageFilesFromToolResult(toolResult) {
  if (!Array.isArray(toolResult?.content)) {
    return [];
  }
  return toolResult.content
    .filter((c) => c?.type === 'image')
    .map(imageContentToMessageFile)
    .filter(Boolean);
}

/**
 * @description Format tool result into compact text for model context.
 * @param {object|string} toolResult - Tool output.
 * @returns {string} Formatted text.
 * @example
 * formatToolResultForChat({ content: [{ type: 'text', text: 'ok' }] });
 */
function formatToolResultForChat(toolResult) {
  if (!toolResult) {
    return '';
  }
  if (typeof toolResult === 'string') {
    return toolResult;
  }

  if (Array.isArray(toolResult?.content)) {
    const textParts = toolResult.content
      .map((c) => {
        if (c?.type === 'text') {
          return truncate(c.text, MAX_TOOL_RESULT_CHARS);
        }
        if (c?.type === 'image') {
          return CAMERA_IMAGE_SENT_TO_USER_HINT;
        }
        return safeStringify(c, MAX_NESTED_VALUE_CHARS);
      })
      .filter(Boolean);
    return textParts.join('\n');
  }

  return safeStringify(toolResult);
}

/**
 * @description Decide whether assistant text should be forwarded to user.
 * @param {string} text - Assistant text.
 * @param {boolean} sentImagesToUser - Whether camera images were sent.
 * @returns {boolean} True if text should be sent.
 * @example
 * shouldSendAssistantTextReply('hello', false);
 */
function shouldSendAssistantTextReply(text, sentImagesToUser) {
  if (!text?.trim()) {
    return false;
  }
  if (!sentImagesToUser) {
    return true;
  }
  if (/!\[[^\]]*\]\([^)]+\)/.test(text)) {
    return false;
  }
  if (/https?:\/\//i.test(text)) {
    return false;
  }
  return true;
}

/**
 * @description Detect explicit no-response sentinel from assistant.
 * @param {string} text - Assistant text.
 * @returns {boolean} True if sentinel was found.
 * @example
 * isNoResponseSentinel('NO_RESPONSE');
 */
function isNoResponseSentinel(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const normalized = text
    .trim()
    .replace(/[\s_-]+/g, '_')
    .toUpperCase();
  return normalized === 'NO_RESPONSE';
}

/**
 * @description Detect normalized tool execution error strings.
 * @param {string} text - Tool result text.
 * @returns {boolean} True when text is a tool execution error.
 * @example
 * isToolExecutionErrorText('Error while running tool "x": boom');
 */
function isToolExecutionErrorText(text) {
  return typeof text === 'string' && text.startsWith('Error while running tool');
}

/**
 * @description Detect assistant turns with no usable text and no tool calls.
 * @param {object|null} assistantMessage - Assistant message from chat API.
 * @returns {boolean} True when the turn is empty.
 * @example
 * isEmptyAssistantTurn({ content: null, tool_calls: [] });
 */
function isEmptyAssistantTurn(assistantMessage) {
  if (!assistantMessage) {
    return true;
  }
  const toolCalls = assistantMessage.tool_calls ?? [];
  if (toolCalls.length > 0) {
    return false;
  }
  const { content } = assistantMessage;
  if (content === null || content === undefined) {
    return true;
  }
  if (typeof content === 'string') {
    if (isNoResponseSentinel(content.trim())) {
      return false;
    }
    return content.trim() === '';
  }
  return false;
}

/**
 * @description Check whether tool results were already added to model context.
 * @param {Array<object>} messagesForApi - Messages sent to chat API.
 * @returns {boolean} True when at least one tool result exists.
 * @example
 * hadToolResultsInConversation([{ role: 'tool', content: 'ok' }]);
 */
function hadToolResultsInConversation(messagesForApi) {
  return messagesForApi.some((message) => message?.role === 'tool');
}

/**
 * @description Render a tool-call trace text for UI timeline.
 * @param {string} functionName - Tool function name.
 * @param {object} toolArgs - Parsed tool arguments.
 * @returns {string} Human-readable tool trace.
 * @example
 * formatToolCallTraceText('device_get_state', { room: 'salon' });
 */
function formatToolCallTraceText(functionName, toolArgs) {
  if (!functionName) {
    return 'tool_call';
  }
  if (!toolArgs || Object.keys(toolArgs).length === 0) {
    return `${functionName}()`;
  }
  return `${functionName}(${safeStringify(toolArgs, 300)})`;
}

/**
 * @description Detect a tool invocation trace line echoed by the model in plain text.
 * @param {string} line - Single line of assistant text.
 * @returns {boolean} True when the line looks like a tool trace.
 * @example
 * isToolInvocationTraceLine('device_turn_on_off({"action":"off"})');
 */
function isToolInvocationTraceLine(line) {
  if (!line || typeof line !== 'string') {
    return false;
  }
  return /^[a-z][a-z0-9_]*(\(\)|\([^)]*\))$/.test(line.trim());
}

/**
 * @description Remove tool invocation trace lines from the user-facing final answer.
 * Tool traces are already displayed separately in chat as tool_call messages.
 * @param {string} answer - Assistant final answer text.
 * @returns {string} Cleaned answer without duplicated tool traces.
 * @example
 * stripToolTraceEchoFromAnswer('device_get_state()\n\nTemperature is 21°C');
 */
function stripToolTraceEchoFromAnswer(answer) {
  if (!answer || typeof answer !== 'string') {
    return '';
  }
  return answer
    .split('\n')
    .filter((line) => !isToolInvocationTraceLine(line))
    .join('\n')
    .trim();
}

/**
 * @public
 * @description Handle a new chat message sent by a user to Gladys Plus.
 * Tool calling loop is executed on the Gladys instance using MCP callbacks.
 * @param {object} request - Request payload.
 * @param {object} request.message - Incoming user message.
 * @param {string} request.image - Optional base64 image.
 * @param {Array<{question:string|null,answer:string|null}>} request.previousQuestions - Previous chat exchanges.
 * @param {object} request.context - Message context.
 * @returns {Promise<{answer: string, imagesSent: number} | null>} Chat processing result or null on failure.
 * @example
 * forwardMessageToAiChat({ message, image, previousQuestions: [], context: {} });
 */
async function forwardMessageToAiChat({ message, image, previousQuestions, context }) {
  const userId = message?.user?.id ?? message?.user_id ?? message?.source_user_id;
  const messagePreview = debugPreview(message ? message.text : undefined, 150);
  logger.info(
    `[AI_CHAT] New request userId=${userId ?? 'unknown'} message=${messagePreview} image=${image ? 'yes' : 'no'}`,
  );
  logger.debug(`[AI_CHAT] Request context previousQuestions=${(previousQuestions ?? []).length}`);
  if (userId && this.event?.emit) {
    this.event.emit(EVENTS.WEBSOCKET.SEND, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.AI_THINKING,
      userId,
      payload: { thinking: true },
    });
  }
  try {
    // Resize image to reduce API costs (security cameras).
    const resizedImage = image ? await resizeImage(image) : undefined;

    const mcpHandler = getMcpHandler(this.serviceManager);

    const mcpTools = await mcpHandler.getAllTools(userId);
    const toolsForApi = mcpToolsToChatApiFormat(mcpTools);
    const toolCallbacksByName = new Map(mcpTools.map((t) => [toolNameFromIntent(t.intent), t.cb]));
    logger.debug(
      `[AI_CHAT] Tools available (${toolsForApi.length}): ${toolsForApi.map((tool) => tool.function.name).join(', ')}`,
    );

    const configuredTimezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    const timezoneName = configuredTimezone || DEFAULT_TIMEZONE;
    logger.debug(`[AI_CHAT] Using timezone=${timezoneName}`);

    // Build a compact conversation for the model.
    const messagesForApi = [{ role: 'system', content: buildSystemPromptWithCurrentTime(timezoneName) }];

    (previousQuestions ?? []).forEach((exchange) => {
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

    const userContent = [];
    if (message.text) {
      userContent.push({ type: 'text', text: message.text });
    }
    if (resizedImage) {
      userContent.push({ type: 'image_url', image_url: { url: resizedImage } });
    }

    messagesForApi.push({
      role: 'user',
      content: userContent.length > 0 ? userContent : message.text,
    });

    let assistantMessage = null;
    const imagesSentToUser = [];
    let lastSceneCreateErrorText = null;
    let sceneCreateSuccessCount = 0;
    let toolIterations = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (let iteration = 0; iteration < MAX_TOOL_CALL_ITERATIONS; iteration += 1) {
      logger.debug(`[AI_CHAT] API call iteration=${iteration + 1}/${MAX_TOOL_CALL_ITERATIONS}`);
      // eslint-disable-next-line no-await-in-loop
      const apiResponse = await this.aiChat({
        messages: messagesForApi,
        tools: toolsForApi,
        tool_choice: 'auto',
      });

      assistantMessage = extractAssistantMessage(apiResponse);
      const toolCalls = assistantMessage?.tool_calls ?? [];
      const assistantContentType = assistantMessage?.content === null ? 'null' : typeof assistantMessage?.content;
      const toolNamesSuffix =
        toolCalls.length > 0 ? ` tools=[${toolCalls.map((toolCall) => toolCall.function.name).join(', ')}]` : '';
      const assistantContentPreview = debugPreview(assistantMessage ? assistantMessage.content : undefined, 150);

      logger.info(
        `[AI_CHAT] Assistant turn iteration=${iteration + 1} tool_calls=${
          toolCalls.length
        }${toolNamesSuffix} content=${assistantContentPreview}`,
      );
      logger.debug(
        `[AI_CHAT] Assistant turn details iteration=${iteration +
          1} contentType=${assistantContentType} content=${debugPreview(assistantMessage?.content, 400)}`,
      );

      if (!toolCalls || toolCalls.length === 0) {
        break;
      }

      toolIterations += 1;

      // Add the assistant tool call message context.
      messagesForApi.push({
        role: 'assistant',
        content: assistantMessage?.content ?? null,
        tool_calls: toolCalls,
      });

      // Execute tools locally using MCP callbacks.
      // We support multiple tool calls in one model turn.
      // eslint-disable-next-line no-restricted-syntax
      for (const toolCall of toolCalls) {
        const toolCallId = toolCall?.id ?? undefined;
        const functionName = toolCall?.function?.name;
        const argumentsRaw = toolCall?.function?.arguments;

        const cb = functionName ? toolCallbacksByName.get(functionName) : undefined;
        if (!cb) {
          logger.warn(`Unknown tool "${functionName}" requested by model.`);
          messagesForApi.push({
            role: 'tool',
            tool_call_id: toolCallId ?? 'unknown',
            content: `Unknown tool: ${functionName}`,
          });
          // Continue execution: the model may provide follow-up instructions.
          // eslint-disable-next-line no-continue
          continue;
        }

        let toolArgs = {};
        if (argumentsRaw) {
          try {
            toolArgs = typeof argumentsRaw === 'string' ? JSON.parse(argumentsRaw) : argumentsRaw;
          } catch (e) {
            logger.warn(`Invalid JSON arguments for tool "${functionName}": ${e.message}`);
            toolArgs = {};
          }
        }

        let toolResultText;
        let toolStatus = 'success';
        logger.info(`[AI_CHAT] Running tool=${functionName}`);
        logger.debug(`[AI_CHAT] Tool args tool=${functionName} args=${debugPreview(toolArgs, 300)}`);
        try {
          // eslint-disable-next-line no-await-in-loop
          const toolResult = await cb(toolArgs);
          if (functionName === 'scene_create') {
            sceneCreateSuccessCount += 1;
            lastSceneCreateErrorText = null;
          }
          imagesSentToUser.push(...extractMessageFilesFromToolResult(toolResult));
          toolResultText = formatToolResultForChat(toolResult);
          const toolResultLength = toolResultText ? toolResultText.length : 0;
          logger.info(`[AI_CHAT] Tool finished tool=${functionName} status=success resultLength=${toolResultLength}`);
          logger.debug(`[AI_CHAT] Tool result tool=${functionName} result=${debugPreview(toolResultText, 400)}`);
        } catch (toolError) {
          // We surface tool errors back to the model instead of aborting the whole
          // conversation. The model can then report the error to the user or retry.
          logger.warn(`Tool "${functionName}" failed:`, toolError);
          const toolErrorMessage = toolError && toolError.message ? toolError.message : 'unknown error';
          toolResultText = `Error while running tool "${functionName}": ${toolErrorMessage}`;
          // Dedicated single-line log containing the exact payload sent back to the model.
          logger.warn(`[AI_TOOL_ERROR_FULL] ${toolResultText}`);
          if (functionName === 'scene_create') {
            lastSceneCreateErrorText = toolResultText;
          }
          toolStatus = 'error';
        }

        // eslint-disable-next-line no-await-in-loop
        await this.message.reply(message, formatToolCallTraceText(functionName, toolArgs), context, null, {
          messageType: 'tool_call',
          toolName: functionName,
          toolStatus,
        });

        messagesForApi.push({
          role: 'tool',
          tool_call_id: toolCallId ?? 'tool_call_unknown',
          content: toolResultText,
        });
      }
    }

    const assistantContent = assistantMessage?.content;
    let finalAnswer = typeof assistantContent === 'string' ? assistantContent.trim() : '';
    const rawFinalAnswer = finalAnswer;
    if (isNoResponseSentinel(finalAnswer)) {
      logger.info('[AI_CHAT] Assistant returned NO_RESPONSE sentinel');
      finalAnswer = '';
    }
    finalAnswer = stripToolTraceEchoFromAnswer(finalAnswer);
    if (rawFinalAnswer && !finalAnswer) {
      logger.info(
        `[AI_CHAT] Final answer emptied after stripping tool traces. raw=${debugPreview(rawFinalAnswer, 150)}`,
      );
    }

    // If we hit the iteration cap and the model never produced a final user-facing answer,
    // fall back to the last tool result to avoid total silence.
    const hadToolCallsInLastTurn = (assistantMessage?.tool_calls ?? []).length > 0;
    if (!finalAnswer && hadToolCallsInLastTurn) {
      const lastToolMessage = [...messagesForApi]
        .reverse()
        .find((m) => m?.role === 'tool' && typeof m?.content === 'string' && m.content.trim().length > 0);
      if (lastToolMessage) {
        finalAnswer = truncate(lastToolMessage.content.trim(), MAX_FALLBACK_ANSWER_CHARS);
        logger.info(`[AI_CHAT] Using fallback answer from last tool result`);
      }
    }
    if (sceneCreateSuccessCount === 0 && isToolExecutionErrorText(lastSceneCreateErrorText)) {
      finalAnswer = lastSceneCreateErrorText;
      logger.debug(`[AI_CHAT] Using scene_create error as final answer: ${debugPreview(finalAnswer, 400)}`);
    }

    const rawAssistantContent = assistantMessage?.content;
    const wasNoResponseSentinel =
      typeof rawAssistantContent === 'string' && isNoResponseSentinel(rawAssistantContent.trim());
    const shouldSendText = Boolean(
      finalAnswer && shouldSendAssistantTextReply(finalAnswer, imagesSentToUser.length > 0),
    );
    const isEmptyTurn = isEmptyAssistantTurn(assistantMessage);

    logger.info(
      `[AI_CHAT] Outcome toolIterations=${toolIterations} imagesSent=${imagesSentToUser.length} ` +
        `shouldSendText=${shouldSendText} answerLength=${finalAnswer.length} ` +
        `wasNoResponseSentinel=${wasNoResponseSentinel} isEmptyTurn=${isEmptyTurn}`,
    );
    logger.debug(`[AI_CHAT] Outcome details finalAnswer=${debugPreview(finalAnswer, 400)}`);

    if (
      !finalAnswer &&
      imagesSentToUser.length === 0 &&
      !wasNoResponseSentinel &&
      sceneCreateSuccessCount === 0 &&
      isEmptyTurn
    ) {
      logger.info('[AI_CHAT] No user-facing answer produced, sending openai.request.fail');
      await this.message.replyByIntent(message, 'openai.request.fail', context);
      return null;
    }

    if (!finalAnswer && imagesSentToUser.length === 0 && !wasNoResponseSentinel && !shouldSendText) {
      logger.info('[AI_CHAT] No reply sent to user: assistant had content but final answer is empty after processing');
    }

    if (imagesSentToUser.length > 0) {
      for (let i = 0; i < imagesSentToUser.length; i += 1) {
        if (i === 0) {
          // eslint-disable-next-line no-await-in-loop
          await this.message.replyByIntent(message, 'camera.get-image.success', context, imagesSentToUser[i]);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await this.message.reply(message, '', context, imagesSentToUser[i]);
        }
      }
    }

    if (shouldSendText) {
      logger.info(`[AI_CHAT] Sending text reply to user: ${debugPreview(finalAnswer, 150)}`);
      await this.message.reply(message, finalAnswer);
    } else if (finalAnswer) {
      logger.info(
        `[AI_CHAT] Final answer suppressed by shouldSendAssistantTextReply: ${debugPreview(finalAnswer, 150)}`,
      );
    }

    logger.info(`[AI_CHAT] Completed answerLength=${finalAnswer.length} imagesSent=${imagesSentToUser.length}`);

    return { answer: finalAnswer || '', imagesSent: imagesSentToUser.length };
  } catch (e) {
    const requestErrorMessage = e && e.message ? e.message : e;
    logger.warn(`[AI_CHAT] Request failed: ${requestErrorMessage}`);
    logger.warn(e);
    if (e instanceof Error429) {
      await this.message.replyByIntent(message, 'openai.request.tooManyRequests', context);
    } else {
      await this.message.replyByIntent(message, 'openai.request.fail', context);
    }
    return null;
  } finally {
    if (userId && this.event?.emit) {
      this.event.emit(EVENTS.WEBSOCKET.SEND, {
        type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.AI_THINKING,
        userId,
        payload: { thinking: false },
      });
    }
  }
}

module.exports = {
  forwardMessageToAiChat,
  buildSystemPromptWithCurrentTime,
  debugPreview,
  extractAssistantMessage,
  extractMessageFilesFromToolResult,
  imageContentToMessageFile,
  formatToolCallTraceText,
  isToolInvocationTraceLine,
  stripToolTraceEchoFromAnswer,
  shouldSendAssistantTextReply,
  isNoResponseSentinel,
  isToolExecutionErrorText,
  isEmptyAssistantTurn,
  hadToolResultsInConversation,
};
