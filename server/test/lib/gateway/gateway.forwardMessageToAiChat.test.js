const { fake, stub, assert, match } = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { Error429 } = require('../../../utils/httpErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const z = require('../../../services/mcp/node_modules/zod/v4');

const resizeImageMock = fake.resolves('data:image/jpeg;base64,resized-image-data');
const promptMock = 'You are Gladys AI.';

/**
 * @description Load module under test with mocked dependencies.
 * @param {object} options - Options.
 * @param {Array<object>} options.tools - MCP tools.
 * @param {string} options.prompt - Prompt override.
 * @returns {object} Proxied module.
 * @example
 * const mod = getModule({ tools: [] });
 */
function getModule({ tools = [], prompt = promptMock } = {}) {
  return proxyquire('../../../lib/gateway/gateway.forwardMessageToAiChat', {
    '../../utils/resizeImage': { resizeImage: resizeImageMock },
    fs: {
      readFileSync: fake.returns(prompt),
    },
  });
}

/**
 * @description Build execution context for gateway.forwardMessageToAiChat.
 * @param {object} options - Context dependencies.
 * @param {Array<object>} options.tools - MCP tools.
 * @param {Function} options.aiChat - AiChat mock.
 * @param {Function} options.reply - Message reply mock.
 * @param {Function} options.replyByIntent - Message replyByIntent mock.
 * @param {Function} [options.eventEmit] - Event emitter mock.
 * @param {string} [options.timezone] - Timezone returned by variable.getValue.
 * @returns {object} Bound context object.
 * @example
 * const ctx = buildContext({ tools: [], aiChat: fake(), reply: fake(), replyByIntent: fake() });
 */
function buildContext({
  tools,
  aiChat,
  reply,
  replyByIntent,
  eventEmit = fake.returns(null),
  timezone = 'Europe/Paris',
}) {
  return {
    event: {
      emit: eventEmit,
    },
    variable: {
      getValue: stub().callsFake((name) => {
        if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
          return Promise.resolve(timezone);
        }
        return Promise.resolve(null);
      }),
    },
    serviceManager: {
      getService: fake.returns({
        mcpHandler: {
          getAllTools: fake.resolves(tools),
        },
      }),
    },
    aiChat,
    message: {
      reply,
      replyByIntent,
    },
  };
}

describe('gateway.forwardMessageToAiChat', () => {
  beforeEach(() => {
    resizeImageMock.resetHistory();
  });

  it('should build system prompt with current date and time in the configured timezone', () => {
    const { buildSystemPromptWithCurrentTime } = getModule();
    const prompt = buildSystemPromptWithCurrentTime('Europe/Paris', new Date('2026-06-15T10:30:00Z'));

    expect(prompt).to.include('You are Gladys AI.');
    expect(prompt).to.include('Current date and time (Europe/Paris): Monday 2026-06-15 12:30');
  });

  it('should include current date and time in the system message sent to the model', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.resolves({
      choices: [{ message: { content: 'OK' } }],
    });
    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);

    await forwardMessageToAiChat.call(
      buildContext({ tools: [], aiChat, reply, replyByIntent, timezone: 'America/Toronto' }),
      {
        message: { text: 'Is the pool open now?' },
        previousQuestions: [],
        context: {},
      },
    );

    const systemMessage = aiChat.getCall(0).args[0].messages[0];
    expect(systemMessage.role).to.equal('system');
    expect(systemMessage.content).to.include('Current date and time (America/Toronto):');
  });

  it('should execute tool calls locally and return final assistant answer', async () => {
    const toolCb = fake.resolves({
      content: [{ type: 'text', text: 'tool-result: done' }],
    });
    const tools = [
      {
        intent: 'device.turn-on-off',
        config: {
          title: 'Turn devices on/off',
          description: 'Turn on or off devices',
          inputSchema: {
            action: z.enum(['on', 'off']),
            room: z.enum(['living room', 'salon']).optional(),
          },
        },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call_1',
                function: {
                  name: 'device_turn_on_off',
                  arguments: '{"action":"on","room":"living room"}',
                },
              },
            ],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [
        {
          message: {
            content: 'Done, lights are now on.',
          },
        },
      ],
    });

    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const eventEmit = fake.returns(null);

    const ctx = buildContext({ tools, aiChat, reply, replyByIntent, eventEmit });

    const message = {
      text: 'Turn on the living room light',
      user: { id: 'user-id' },
    };
    const result = await forwardMessageToAiChat.call(ctx, {
      message,
      previousQuestions: [{ question: 'Hi', answer: 'Hello' }],
      context: {},
    });

    expect(result).to.deep.equal({ answer: 'Done, lights are now on.', imagesSent: 0 });
    assert.calledTwice(aiChat);
    assert.calledOnce(toolCb);
    assert.calledWith(toolCb, { action: 'on', room: 'living room' });
    assert.calledTwice(reply);
    assert.calledWith(reply, message, 'Done, lights are now on.');
    assert.calledWith(reply, message, 'device_turn_on_off({"action":"on","room":"living room"})', {}, null, {
      messageType: 'tool_call',
      toolName: 'device_turn_on_off',
      toolStatus: 'success',
    });
    assert.notCalled(replyByIntent);

    const firstCallBody = aiChat.getCall(0).args[0];
    const turnOnTool = firstCallBody.tools.find((t) => t.function.name === 'device_turn_on_off');
    expect(turnOnTool.function.parameters.properties.action.enum).to.deep.equal(['on', 'off']);
    expect(turnOnTool.function.parameters.properties.room.enum).to.include('salon');

    const secondCallBody = aiChat.getCall(1).args[0];
    const toolMessage = secondCallBody.messages.find((m) => m.role === 'tool' && m.tool_call_id === 'call_1');
    expect(toolMessage).to.not.equal(undefined);
    expect(toolMessage.content).to.equal('tool-result: done');
    assert.calledWith(eventEmit, EVENTS.WEBSOCKET.SEND, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.AI_THINKING,
      userId: 'user-id',
      payload: { thinking: true },
    });
    assert.calledWith(eventEmit, EVENTS.WEBSOCKET.SEND, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.AI_THINKING,
      userId: 'user-id',
      payload: { thinking: false },
    });
  });

  it('should resize image and send multimodal user content', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.resolves({
      choices: [{ message: { content: 'Image processed.' } }],
    });
    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = {
      text: 'What do you see?',
      user: { id: 'user-id' },
    };

    const result = await forwardMessageToAiChat.call(buildContext({ tools: [], aiChat, reply, replyByIntent }), {
      message,
      image: 'data:image/png;base64,abc',
      previousQuestions: [],
      context: {},
    });

    expect(result).to.deep.equal({ answer: 'Image processed.', imagesSent: 0 });
    assert.calledOnce(resizeImageMock);
    const firstBody = aiChat.getCall(0).args[0];
    const userMessage = firstBody.messages[firstBody.messages.length - 1];
    expect(userMessage.content).to.deep.equal([
      { type: 'text', text: 'What do you see?' },
      { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,resized-image-data' } },
    ]);
  });

  it('should send an error message back to the model when a tool throws', async () => {
    const toolCb = fake.rejects(new Error('Device unreachable'));
    const tools = [
      {
        intent: 'device.turn-on-off',
        config: {
          title: 'Turn devices on/off',
          inputSchema: { action: z.enum(['on', 'off']) },
        },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call_err',
                function: { name: 'device_turn_on_off', arguments: '{"action":"on"}' },
              },
            ],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [{ message: { content: 'Sorry, the device is unreachable.' } }],
    });

    const reply = fake.resolves(null);
    const message = { text: 'Turn on the light', user: { id: 'user-id' } };
    const result = await forwardMessageToAiChat.call(
      buildContext({ tools, aiChat, reply, replyByIntent: fake.resolves(null) }),
      {
        message,
        previousQuestions: [],
        context: {},
      },
    );

    expect(result).to.deep.equal({ answer: 'Sorry, the device is unreachable.', imagesSent: 0 });
    const secondCallBody = aiChat.getCall(1).args[0];
    const toolMessage = secondCallBody.messages.find((m) => m.role === 'tool' && m.tool_call_id === 'call_err');
    expect(toolMessage.content).to.contain('Device unreachable');
  });

  it('should send an unknown-tool message back to the model when the tool name is invalid', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call_unknown',
                function: { name: 'nonexistent_tool', arguments: '{}' },
              },
            ],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [{ message: { content: 'I could not run that command.' } }],
    });

    const reply = fake.resolves(null);
    const message = { text: 'do something', user: { id: 'user-id' } };
    const result = await forwardMessageToAiChat.call(
      buildContext({ tools: [], aiChat, reply, replyByIntent: fake.resolves(null) }),
      {
        message,
        previousQuestions: [],
        context: {},
      },
    );

    expect(result).to.deep.equal({ answer: 'I could not run that command.', imagesSent: 0 });
    const secondCallBody = aiChat.getCall(1).args[0];
    const toolMessage = secondCallBody.messages.find((m) => m.role === 'tool' && m.tool_call_id === 'call_unknown');
    expect(toolMessage.content).to.contain('Unknown tool');
  });

  it('should fallback to last tool result when the iteration cap is reached', async () => {
    const toolCb = fake.resolves({ content: [{ type: 'text', text: 'fallback content' }] });
    const tools = [
      {
        intent: 'device.get-state',
        config: {
          title: 'Get device states',
          inputSchema: { room: z.enum(['salon']).optional() },
        },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    // The model keeps requesting tool calls indefinitely.
    const aiChat = fake.resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call_loop',
                function: { name: 'device_get_state', arguments: '{}' },
              },
            ],
          },
        },
      ],
    });

    const reply = fake.resolves(null);
    const message = { text: 'state?', user: { id: 'user-id' } };
    const result = await forwardMessageToAiChat.call(
      buildContext({ tools, aiChat, reply, replyByIntent: fake.resolves(null) }),
      {
        message,
        previousQuestions: [],
        context: {},
      },
    );

    expect(result).to.deep.equal({ answer: 'fallback content', imagesSent: 0 });
    assert.callCount(reply, 6);
    assert.calledWith(reply, message, 'fallback content');
  });

  it('should send camera images to the chat and ignore hallucinated image URLs in the final answer', async () => {
    const cameraImageFile = 'image/jpeg;base64,camera-data';
    const toolCb = fake.resolves({
      content: [{ type: 'image', data: 'camera-data', mimeType: 'image/jpeg' }],
    });
    const tools = [
      {
        intent: 'camera.get-image',
        config: {
          title: 'Get camera image',
          description: 'Get camera image',
          inputSchema: { room: z.enum(['salon']) },
        },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call_cam',
                function: {
                  name: 'camera_get_image',
                  arguments: '{"room":"salon"}',
                },
              },
            ],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [
        {
          message: {
            content: 'Voici une photo du salon : ![salon](https://example.com/fake.jpg)',
          },
        },
      ],
    });

    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const context = { room: 'salon' };
    const message = { text: 'montre moi la caméra du salon', user: { id: 'user-id' } };

    const result = await forwardMessageToAiChat.call(buildContext({ tools, aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context,
    });

    expect(result).to.deep.equal({
      answer: 'Voici une photo du salon : ![salon](https://example.com/fake.jpg)',
      imagesSent: 1,
    });
    assert.calledOnce(toolCb);
    assert.calledWith(replyByIntent, message, 'camera.get-image.success', context, cameraImageFile);
    assert.calledOnce(reply);
    assert.calledWith(reply, message, 'camera_get_image({"room":"salon"})', context, null, {
      messageType: 'tool_call',
      toolName: 'camera_get_image',
      toolStatus: 'success',
    });

    const secondCallBody = aiChat.getCall(1).args[0];
    const toolMessage = secondCallBody.messages.find((m) => m.role === 'tool' && m.tool_call_id === 'call_cam');
    expect(toolMessage.content).to.contain('sent to the user in the chat');
  });

  it('should treat NO_RESPONSE as silence and not send a reply', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.resolves({
      choices: [{ message: { content: 'NO_RESPONSE' } }],
    });
    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = { text: 'Do nothing', user: { id: 'user-id' } };

    const result = await forwardMessageToAiChat.call(buildContext({ tools: [], aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context: {},
    });

    expect(result).to.deep.equal({ answer: '', imagesSent: 0 });
    assert.notCalled(reply);
    assert.notCalled(replyByIntent);
  });

  it('should reply with failure when assistant returns no content and no tool calls', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.resolves({
      choices: [{ message: { content: null, tool_calls: [] } }],
    });
    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = { text: 'Crée une scène', user: { id: 'user-id' } };
    const context = { user: { id: 'user-id' } };

    const result = await forwardMessageToAiChat.call(buildContext({ tools: [], aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context,
    });

    expect(result).to.equal(null);
    assert.notCalled(reply);
    assert.calledWith(replyByIntent, message, 'openai.request.fail', context);
  });

  it('should reply with failure when assistant ends with no content after tool calls', async () => {
    const toolCb = fake.resolves({ content: [{ type: 'text', text: 'device state ok' }] });
    const tools = [
      {
        intent: 'device.get-state',
        config: { title: 'Get state', inputSchema: {} },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [{ id: 'call_1', function: { name: 'device_get_state', arguments: '{}' } }],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [{ message: { content: null, tool_calls: [] } }],
    });

    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = { text: 'Crée une scène', user: { id: 'user-id' } };
    const context = { user: { id: 'user-id' } };

    const result = await forwardMessageToAiChat.call(buildContext({ tools, aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context,
    });

    expect(result).to.equal(null);
    assert.calledOnce(reply);
    assert.calledWith(replyByIntent, message, 'openai.request.fail', context);
  });

  it('should not confirm scene creation when scene_create tool keeps failing', async () => {
    const toolCb = fake.rejects(new Error('scene.create validation failed (422): actions: Invalid input'));
    const tools = [
      {
        intent: 'scene.create',
        config: {
          title: 'Create scene',
          inputSchema: { name: z.string() },
        },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [{ id: 'call_scene_1', function: { name: 'scene_create', arguments: '{"name":"bad"}' } }],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [
        {
          message: {
            content: 'La scène a été créée avec succès.',
          },
        },
      ],
    });

    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = { text: 'create scene', user: { id: 'user-id' } };

    const result = await forwardMessageToAiChat.call(buildContext({ tools, aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context: {},
    });

    expect(result).to.deep.equal({
      answer: 'Error while running tool "scene_create": scene.create validation failed (422): actions: Invalid input',
      imagesSent: 0,
    });
    assert.calledTwice(reply);
    assert.calledWith(
      reply,
      message,
      'Error while running tool "scene_create": scene.create validation failed (422): actions: Invalid input',
    );
  });

  it('should reply with too many requests message on Error429', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.rejects(new Error429('rate limit'));
    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = { text: 'hello', user: { id: 'user-id' } };
    const context = { user: { id: 'user-id' } };

    const result = await forwardMessageToAiChat.call(buildContext({ tools: [], aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context,
    });

    expect(result).to.equal(null);
    assert.notCalled(reply);
    assert.calledWith(replyByIntent, message, 'openai.request.tooManyRequests', context);
  });

  it('should reply with generic failure on non-429 errors', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.rejects(new Error('gateway down'));
    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = { text: 'hello', user: { id: 'user-id' } };
    const context = { user: { id: 'user-id' } };

    const result = await forwardMessageToAiChat.call(buildContext({ tools: [], aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context,
    });

    expect(result).to.equal(null);
    assert.notCalled(reply);
    assert.calledWith(replyByIntent, message, 'openai.request.fail', context);
  });

  it('should ignore invalid json tool arguments', async () => {
    const toolCb = fake.resolves({ content: [{ type: 'text', text: 'ok' }] });
    const tools = [
      {
        intent: 'device.get-state',
        config: { title: 'Get state', inputSchema: {} },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [{ id: 'bad_json', function: { name: 'device_get_state', arguments: '{"a":' } }],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [{ message: { content: 'done' } }],
    });

    const reply = fake.resolves(null);
    const result = await forwardMessageToAiChat.call(
      buildContext({ tools, aiChat, reply, replyByIntent: fake.resolves(null) }),
      {
        message: { text: 'state?', user: { id: 'user-id' } },
        previousQuestions: [],
        context: {},
      },
    );

    expect(result).to.deep.equal({ answer: 'done', imagesSent: 0 });
    assert.calledWith(toolCb, {});
  });

  it('should execute scene_create success branch', async () => {
    const toolCb = fake.resolves({ content: [{ type: 'text', text: 'created' }] });
    const tools = [
      {
        intent: 'scene.create',
        config: { title: 'Create scene', inputSchema: { name: z.string() } },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });
    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [{ id: 'call_scene_ok', function: { name: 'scene_create', arguments: '{"name":"x"}' } }],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [{ message: { content: 'ok' } }],
    });

    const reply = fake.resolves(null);
    const result = await forwardMessageToAiChat.call(
      buildContext({ tools, aiChat, reply, replyByIntent: fake.resolves(null) }),
      {
        message: { text: 'create', user: { id: 'user-id' } },
        previousQuestions: [],
        context: {},
      },
    );

    expect(result).to.deep.equal({ answer: 'ok', imagesSent: 0 });
    assert.calledWith(toolCb, { name: 'x' });
  });

  it('should send second camera image with empty text reply path', async () => {
    const toolCb = fake.resolves({
      content: [
        { type: 'image', data: 'img1', mimeType: 'image/jpeg' },
        { type: 'image', data: 'img2', mimeType: 'image/jpeg' },
      ],
    });
    const tools = [
      {
        intent: 'camera.get-image',
        config: { title: 'Get camera image', inputSchema: {} },
        cb: toolCb,
      },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });

    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [{ id: 'call_cam_2', function: { name: 'camera_get_image', arguments: '{}' } }],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [{ message: { content: 'NO_RESPONSE' } }],
    });

    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);
    const message = { text: 'camera', user: { id: 'user-id' } };
    const context = {};
    await forwardMessageToAiChat.call(buildContext({ tools, aiChat, reply, replyByIntent }), {
      message,
      previousQuestions: [],
      context,
    });

    assert.calledWith(replyByIntent, message, 'camera.get-image.success', context, 'image/jpeg;base64,img1');
    assert.calledWith(reply, message, '', context, 'image/jpeg;base64,img2');
  });

  it('should use fallback assistant extraction for apiResponse.message', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.resolves({ message: { content: 'fallback message shape' } });
    const reply = fake.resolves(null);
    const result = await forwardMessageToAiChat.call(
      buildContext({ tools: [], aiChat, reply, replyByIntent: fake.resolves(null) }),
      {
        message: { text: 'hi', user: { id: 'user-id' } },
        previousQuestions: [null],
        context: {},
      },
    );
    expect(result).to.deep.equal({ answer: 'fallback message shape', imagesSent: 0 });
  });

  it('should fail gracefully when MCP service is not available', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const replyByIntent = fake.resolves(null);
    const result = await forwardMessageToAiChat.call(
      {
        serviceManager: { getService: fake.returns(null) },
        aiChat: fake(),
        message: { reply: fake.resolves(null), replyByIntent },
      },
      {
        message: { text: 'hello', user: { id: 'user-id' } },
        previousQuestions: [],
        context: {},
      },
    );

    expect(result).to.equal(null);
    assert.calledWith(replyByIntent, match.any, 'openai.request.fail', {});
  });

  it('should cover tool result formatter edge branches through tool outputs', async () => {
    const nullTool = fake.resolves(null);
    const stringTool = fake.resolves('plain-string-result');
    const objectTool = fake.resolves({ hello: 'world' });
    const unknownContentTool = fake.resolves({ content: [{ type: 'unknown-type', nested: true }] });
    const undefinedContentTool = fake.resolves({ content: [undefined] });
    const circular = {};
    circular.self = circular;
    const circularTool = fake.resolves({ content: [circular] });
    const longTextTool = fake.resolves({ content: [{ type: 'text', text: 'x'.repeat(5001) }] });
    const tools = [
      { intent: 'a.null', config: { title: 'a', inputSchema: {} }, cb: nullTool },
      { intent: 'b.string', config: { title: 'b', inputSchema: {} }, cb: stringTool },
      { intent: 'c.object', config: { title: 'c', inputSchema: {} }, cb: objectTool },
      { intent: 'd.unknown', config: { title: 'd', inputSchema: {} }, cb: unknownContentTool },
      { intent: 'e.undefined', config: { title: 'e', inputSchema: {} }, cb: undefinedContentTool },
      { intent: 'f.circular', config: { title: 'f', inputSchema: {} }, cb: circularTool },
      { intent: 'g.long', config: { title: 'g', inputSchema: {} }, cb: longTextTool },
    ];
    const { forwardMessageToAiChat } = getModule({ tools });
    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              { id: 'a', function: { name: 'a_null', arguments: '{}' } },
              { id: 'b', function: { name: 'b_string', arguments: '{}' } },
              { id: 'c', function: { name: 'c_object', arguments: '{}' } },
              { id: 'd', function: { name: 'd_unknown', arguments: '{}' } },
              { id: 'e', function: { name: 'e_undefined', arguments: '{}' } },
              { id: 'f', function: { name: 'f_circular', arguments: '{}' } },
              { id: 'g', function: { name: 'g_long', arguments: '{}' } },
            ],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [{ message: { content: ''.padStart(3001, 'y') } }],
    });
    const reply = fake.resolves(null);
    const message = {
      id: 'message-id',
      text: 'run many tools',
      created_at: new Date(),
      source: 'api',
      user_id: 'user-id',
    };
    await forwardMessageToAiChat.call(buildContext({ tools, aiChat, reply, replyByIntent: fake.resolves(null) }), {
      message,
      previousQuestions: [],
      context: {},
    });

    assert.calledOnce(nullTool);
    assert.calledOnce(stringTool);
    assert.calledOnce(objectTool);
    assert.calledOnce(unknownContentTool);
    assert.calledOnce(undefinedContentTool);
    assert.calledOnce(circularTool);
    assert.calledOnce(longTextTool);

    const secondCallBody = aiChat.getCall(1).args[0];
    const toolMessages = secondCallBody.messages.filter((m) => m.role === 'tool');
    expect(toolMessages).to.have.length(7);
    expect(toolMessages.find((m) => m.tool_call_id === 'a').content).to.equal('');
    expect(toolMessages.find((m) => m.tool_call_id === 'b').content).to.equal('plain-string-result');
    expect(toolMessages.find((m) => m.tool_call_id === 'c').content).to.equal('{"hello":"world"}');
    expect(toolMessages.find((m) => m.tool_call_id === 'd').content).to.equal('{"type":"unknown-type","nested":true}');
    expect(toolMessages.find((m) => m.tool_call_id === 'e').content).to.equal('');
    expect(toolMessages.find((m) => m.tool_call_id === 'f').content).to.equal('[unserializable tool result]');
    expect(toolMessages.find((m) => m.tool_call_id === 'g').content).to.contain('... (truncated)');

    assert.calledWith(reply, message, match.string);
  });
});

describe('gateway.forwardMessageToAiChat helpers', () => {
  it('should cover image and reply helper branches', () => {
    const {
      imageContentToMessageFile,
      extractMessageFilesFromToolResult,
      shouldSendAssistantTextReply,
      isNoResponseSentinel,
      isToolExecutionErrorText,
      isEmptyAssistantTurn,
      hadToolResultsInConversation,
    } = getModule();

    expect(imageContentToMessageFile(null)).to.equal(null);
    expect(imageContentToMessageFile({ data: 'data:image/png;base64,abc', mimeType: 'image/png' })).to.equal(
      'image/png;base64,abc',
    );
    expect(extractMessageFilesFromToolResult({})).to.deep.equal([]);

    expect(shouldSendAssistantTextReply('', false)).to.equal(false);
    expect(shouldSendAssistantTextReply('https://example.com', true)).to.equal(false);
    expect(shouldSendAssistantTextReply('plain text', true)).to.equal(true);

    expect(isNoResponseSentinel('NO_RESPONSE')).to.equal(true);
    expect(isToolExecutionErrorText('Error while running tool "x": boom')).to.equal(true);
    expect(isEmptyAssistantTurn(null)).to.equal(true);
    expect(isEmptyAssistantTurn({ content: null, tool_calls: [] })).to.equal(true);
    expect(isEmptyAssistantTurn({ content: '   ', tool_calls: [] })).to.equal(true);
    expect(isEmptyAssistantTurn({ content: 'NO_RESPONSE', tool_calls: [] })).to.equal(false);
    expect(isEmptyAssistantTurn({ content: null, tool_calls: [{ id: '1' }] })).to.equal(false);
    expect(isEmptyAssistantTurn({ content: [{ type: 'text', text: 'hi' }], tool_calls: [] })).to.equal(false);
    expect(hadToolResultsInConversation([{ role: 'tool', content: 'ok' }])).to.equal(true);
    expect(hadToolResultsInConversation([{ role: 'user', content: 'hi' }])).to.equal(false);
  });

  it('should format tool call trace text fallback name', () => {
    const {
      formatToolCallTraceText,
      isToolInvocationTraceLine,
      stripToolTraceEchoFromAnswer,
      debugPreview,
    } = getModule();
    expect(formatToolCallTraceText('', {})).to.equal('tool_call');
    expect(isToolInvocationTraceLine('device_turn_on_off({"action":"off","device":"Lumière"})')).to.equal(true);
    expect(isToolInvocationTraceLine('device_get_state()')).to.equal(true);
    expect(isToolInvocationTraceLine('La lumière est éteinte.')).to.equal(false);
    expect(isToolInvocationTraceLine(null)).to.equal(false);
    expect(isToolInvocationTraceLine({})).to.equal(false);
    expect(stripToolTraceEchoFromAnswer(null)).to.equal('');
    expect(stripToolTraceEchoFromAnswer(undefined)).to.equal('');
    expect(debugPreview(null)).to.equal('null');
    expect(debugPreview(undefined)).to.equal('undefined');
    expect(debugPreview('   ')).to.equal('(empty string)');
    expect(debugPreview({ ok: true })).to.equal('{"ok":true}');
    expect(
      stripToolTraceEchoFromAnswer(
        'device_turn_on_off({"action":"off","device":"Lumière"})\n\nLa lumière est éteinte.',
      ),
    ).to.equal('La lumière est éteinte.');
  });

  it('should strip echoed tool traces from the final user-facing answer', async () => {
    const toolCb = fake.resolves('done');
    const tools = [
      {
        intent: 'device.turn-on-off',
        cb: toolCb,
        config: { inputSchema: {} },
      },
    ];
    const aiChat = stub();
    aiChat.onCall(0).resolves({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call_1',
                function: {
                  name: 'device_turn_on_off',
                  arguments: '{"action":"off","device":"Lumière"}',
                },
              },
            ],
          },
        },
      ],
    });
    aiChat.onCall(1).resolves({
      choices: [
        {
          message: {
            content: 'device_turn_on_off({"action":"off","device":"Lumière"})\n\nLa lumière est éteinte.',
          },
        },
      ],
    });

    const reply = fake.resolves(null);
    const { forwardMessageToAiChat } = getModule({ tools });
    const message = { text: 'Éteins la lumière', user: { id: 'user-id' } };
    const result = await forwardMessageToAiChat.call(buildContext({ tools, aiChat, reply }), {
      message,
      previousQuestions: [],
      context: {},
    });

    expect(result).to.deep.equal({ answer: 'La lumière est éteinte.', imagesSent: 0 });
    assert.calledWith(reply, message, 'La lumière est éteinte.');
    assert.calledWith(reply, message, 'device_turn_on_off({"action":"off","device":"Lumière"})', {}, null, {
      messageType: 'tool_call',
      toolName: 'device_turn_on_off',
      toolStatus: 'success',
    });
  });

  it('should not send a text reply when the final answer is only a tool trace echo', async () => {
    const { forwardMessageToAiChat } = getModule({ tools: [] });
    const aiChat = fake.resolves({
      choices: [
        {
          message: {
            content: 'web_fetch()',
          },
        },
      ],
    });
    const reply = fake.resolves(null);
    const replyByIntent = fake.resolves(null);

    const result = await forwardMessageToAiChat.call(buildContext({ tools: [], aiChat, reply, replyByIntent }), {
      message: { text: 'La piscine est-elle ouverte ?', user: { id: 'user-id' } },
      previousQuestions: [],
      context: {},
    });

    expect(result).to.deep.equal({ answer: '', imagesSent: 0 });
    assert.notCalled(reply);
    assert.notCalled(replyByIntent);
  });
});
