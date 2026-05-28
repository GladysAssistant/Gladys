const fs = require('fs');
const path = require('path');

const logger = require('../../utils/logger');
const { Error429 } = require('../../utils/httpErrors');
const { resizeImage } = require('../../utils/resizeImage');
const {
  mcpToolsToChatApiFormat,
  toolNameFromIntent,
} = require('../../services/mcp/lib/mcpToolsToChatApiFormat');

const MAX_TOOL_CALL_ITERATIONS = 5;
const DEFAULT_MAX_TOKENS_PER_TURN = 512;
const MAX_TOOL_RESULT_CHARS = 4000;
const MAX_FALLBACK_ANSWER_CHARS = 2000;
const MAX_NESTED_VALUE_CHARS = 2000;

const promptPath = path.join(__dirname, '../../config/prompts/aiChat.prompt.txt');
let cachedPrompt = null;

function loadPrompt() {
  if (cachedPrompt) return cachedPrompt;
  cachedPrompt = fs.readFileSync(promptPath, 'utf8');
  return cachedPrompt;
}

function getMcpHandler(serviceManager) {
  const mcpService = serviceManager.getService('mcp');
  if (!mcpService?.mcpHandler) {
    throw new Error('MCP service is not running. Start the MCP integration before using AI chat.');
  }
  return mcpService.mcpHandler;
}

function extractAssistantMessage(apiResponse) {
  // Expected shape: OpenAI compatible chat completion response.
  const choiceMessage = apiResponse?.choices?.[0]?.message;
  if (choiceMessage) return choiceMessage;
  return apiResponse?.message ?? apiResponse?.assistant ?? null;
}

function truncate(str, limitChars) {
  if (!str) return '';
  if (str.length <= limitChars) return str;
  return `${str.slice(0, limitChars)}... (truncated)`;
}

function safeStringify(value, limitChars = MAX_TOOL_RESULT_CHARS) {
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return truncate(str, limitChars);
  } catch (e) {
    return '[unserializable tool result]';
  }
}

const CAMERA_IMAGE_SENT_TO_USER_HINT =
  'Camera image(s) were sent to the user in the chat. Reply briefly without image URLs or markdown images.';

function imageContentToMessageFile(imageContent) {
  const { data, mimeType } = imageContent ?? {};
  if (!data) return null;
  if (typeof data === 'string' && data.includes(';base64,')) {
    return data.replace(/^data:/, '');
  }
  return `${mimeType || 'image/jpeg'};base64,${data}`;
}

function extractMessageFilesFromToolResult(toolResult) {
  if (!Array.isArray(toolResult?.content)) return [];
  return toolResult.content
    .filter((c) => c?.type === 'image')
    .map(imageContentToMessageFile)
    .filter(Boolean);
}

function formatToolResultForChat(toolResult) {
  if (!toolResult) return '';
  if (typeof toolResult === 'string') return toolResult;

  if (Array.isArray(toolResult?.content)) {
    const textParts = toolResult.content
      .map((c) => {
        if (c?.type === 'text') return truncate(c.text, MAX_TOOL_RESULT_CHARS);
        if (c?.type === 'image') return CAMERA_IMAGE_SENT_TO_USER_HINT;
        return safeStringify(c, MAX_NESTED_VALUE_CHARS);
      })
      .filter(Boolean);
    return textParts.join('\n');
  }

  return safeStringify(toolResult);
}

function shouldSendAssistantTextReply(text, sentImagesToUser) {
  if (!text?.trim()) return false;
  if (!sentImagesToUser) return true;
  if (/!\[[^\]]*\]\([^)]+\)/.test(text)) return false;
  if (/https?:\/\//i.test(text)) return false;
  return true;
}

function isNoResponseSentinel(text) {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.trim().replace(/[\s_-]+/g, '_').toUpperCase();
  return normalized === 'NO_RESPONSE';
}

function isToolExecutionErrorText(text) {
  return typeof text === 'string' && text.startsWith('Error while running tool');
}

function formatToolCallTraceText(functionName, toolArgs) {
  if (!functionName) return 'tool_call';
  if (!toolArgs || Object.keys(toolArgs).length === 0) return `${functionName}()`;
  return `${functionName}(${safeStringify(toolArgs, 300)})`;
}

/**
 * @public
 * @description Handle a new chat message sent by a user to Gladys Plus.
 * Tool calling loop is executed on the Gladys instance using MCP callbacks.
 * @param {object} request
 * @param {object} request.message
 * @param {string} request.image
 * @param {Array<{question:string|null,answer:string|null}>} request.previousQuestions
 * @param {object} request.context
 */
async function forwardMessageToAiChat({ message, image, previousQuestions, context }) {
  try {
    // Resize image to reduce API costs (security cameras).
    const resizedImage = image ? await resizeImage(image) : undefined;

    const mcpHandler = getMcpHandler(this.serviceManager);

    const mcpTools = await mcpHandler.getAllTools();
    const toolsForApi = mcpToolsToChatApiFormat(mcpTools);
    const toolCallbacksByName = new Map(
      mcpTools.map((t) => [toolNameFromIntent(t.intent), t.cb]),
    );

    const systemPrompt = loadPrompt();

    // Build a compact conversation for the model.
    const messagesForApi = [{ role: 'system', content: systemPrompt }];

    (previousQuestions ?? []).forEach((exchange) => {
      if (!exchange) return;
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
    let sceneCreateToolCallCount = 0;

    for (let iteration = 0; iteration < MAX_TOOL_CALL_ITERATIONS; iteration += 1) {
      const apiResponse = await this.aiChat({
        messages: messagesForApi,
        tools: toolsForApi,
        tool_choice: 'auto',
        max_tokens: DEFAULT_MAX_TOKENS_PER_TURN,
      });

      assistantMessage = extractAssistantMessage(apiResponse);
      const toolCalls = assistantMessage?.tool_calls ?? [];

      logger.debug(
        `AI assistant turn: content=${assistantMessage?.content === null ? 'null' : 'set'}, tool_calls=${toolCalls.length}`,
      );

      if (!toolCalls || toolCalls.length === 0) {
        break;
      }

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
        try {
          if (functionName === 'scene_create') {
            sceneCreateToolCallCount += 1;
          }
          const toolResult = await cb(toolArgs);
          if (functionName === 'scene_create') {
            sceneCreateSuccessCount += 1;
            lastSceneCreateErrorText = null;
          }
          imagesSentToUser.push(...extractMessageFilesFromToolResult(toolResult));
          toolResultText = formatToolResultForChat(toolResult);
        } catch (toolError) {
          // We surface tool errors back to the model instead of aborting the whole
          // conversation. The model can then report the error to the user or retry.
          logger.warn(`Tool "${functionName}" failed:`, toolError);
          toolResultText = `Error while running tool "${functionName}": ${toolError?.message ?? 'unknown error'}`;
          if (functionName === 'scene_create') {
            lastSceneCreateErrorText = toolResultText;
          }
          toolStatus = 'error';
        }

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
    if (isNoResponseSentinel(finalAnswer)) {
      finalAnswer = '';
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
      }
    }
    if (sceneCreateSuccessCount === 0 && isToolExecutionErrorText(lastSceneCreateErrorText)) {
      finalAnswer = lastSceneCreateErrorText;
    }

    if (imagesSentToUser.length > 0) {
      for (let i = 0; i < imagesSentToUser.length; i += 1) {
        if (i === 0) {
          await this.message.replyByIntent(message, 'camera.get-image.success', context, imagesSentToUser[i]);
        } else {
          await this.message.reply(message, '', context, imagesSentToUser[i]);
        }
      }
    }

    if (finalAnswer && shouldSendAssistantTextReply(finalAnswer, imagesSentToUser.length > 0)) {
      await this.message.reply(message, finalAnswer);
    }

    return { answer: finalAnswer || '', imagesSent: imagesSentToUser.length };
  } catch (e) {
    logger.warn(e);
    if (e instanceof Error429) {
      await this.message.replyByIntent(message, 'openai.request.tooManyRequests', context);
    } else {
      await this.message.replyByIntent(message, 'openai.request.fail', context);
    }
    return null;
  }
}

module.exports = {
  forwardMessageToAiChat,
  extractMessageFilesFromToolResult,
  imageContentToMessageFile,
  shouldSendAssistantTextReply,
  isNoResponseSentinel,
  isToolExecutionErrorText,
};

