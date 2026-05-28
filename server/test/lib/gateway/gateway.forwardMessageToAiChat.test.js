const { fake, stub, assert } = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { Error429 } = require('../../../utils/httpErrors');
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
 * @param {Function} options.aiChat - aiChat mock.
 * @param {Function} options.reply - Message reply mock.
 * @param {Function} options.replyByIntent - Message replyByIntent mock.
 * @returns {object} Bound context object.
 * @example
 * const ctx = buildContext({ tools: [], aiChat: fake(), reply: fake(), replyByIntent: fake() });
 */
function buildContext({ tools, aiChat, reply, replyByIntent }) {
  return {
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

    const ctx = buildContext({ tools, aiChat, reply, replyByIntent });

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
});
