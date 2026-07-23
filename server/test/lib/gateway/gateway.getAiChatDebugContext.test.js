const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const messageFindAll = sinon.stub().resolves([]);

const {
  getAiChatDebugContext,
  dbMessageToApiMessage,
  formatFileAsImageUrl,
  getDebugMessageRole,
  formatStoredMessageForDebug,
  buildConversationHistoryForDebug,
} = proxyquire('../../../lib/gateway/gateway.getAiChatDebugContext', {
  '../../models': {
    Message: {
      findAll: messageFindAll,
    },
  },
  './gateway.forwardMessageToAiChat': {
    buildSystemPromptWithCurrentTime: () => 'system prompt with time',
  },
});

describe('gateway.getAiChatDebugContext helpers', () => {
  it('should format stored file as data URL', () => {
    expect(formatFileAsImageUrl('image/jpeg;base64,abc')).to.equal('data:image/jpeg;base64,abc');
    expect(formatFileAsImageUrl('data:image/png;base64,abc')).to.equal('data:image/png;base64,abc');
  });

  it('should convert user text message to chat API format', () => {
    expect(dbMessageToApiMessage({ sender_id: 'user-1', text: 'Hello', file: null }, 'user-1')).to.deep.equal({
      role: 'user',
      content: 'Hello',
    });
  });

  it('should convert assistant text message to chat API format', () => {
    expect(dbMessageToApiMessage({ sender_id: null, text: 'Hi there', file: null }, 'user-1')).to.deep.equal({
      role: 'assistant',
      content: 'Hi there',
    });
  });

  it('should include image in user message content', () => {
    expect(
      dbMessageToApiMessage({ sender_id: 'user-1', text: 'Look', file: 'image/jpeg;base64,abc' }, 'user-1'),
    ).to.deep.equal({
      role: 'user',
      content: [
        { type: 'text', text: 'Look' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,abc' } },
      ],
    });
  });

  it('should include image without text in user message content', () => {
    expect(
      dbMessageToApiMessage({ sender_id: 'user-1', text: '', file: 'image/jpeg;base64,abc' }, 'user-1'),
    ).to.deep.equal({
      role: 'user',
      content: [{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,abc' } }],
    });
  });

  it('should return empty string content when text is missing', () => {
    expect(dbMessageToApiMessage({ sender_id: null, text: '', file: null }, 'user-1')).to.deep.equal({
      role: 'assistant',
      content: '',
    });
  });

  it('should map stored messages to debug timeline roles', () => {
    expect(getDebugMessageRole({ sender_id: 'user-1', message_type: 'chat' }, 'user-1')).to.equal('user');
    expect(getDebugMessageRole({ sender_id: null, message_type: 'chat' }, 'user-1')).to.equal('assistant');
    expect(getDebugMessageRole({ sender_id: null, message_type: 'tool_call' }, 'user-1')).to.equal('tool_call');
    expect(getDebugMessageRole({ sender_id: null, message_type: 'notification' }, 'user-1')).to.equal('notification');
  });

  it('should format stored messages for debug history', () => {
    expect(
      formatStoredMessageForDebug(
        {
          created_at: '2026-07-06T08:00:00.000Z',
          sender_id: null,
          text: 'device_set_shutter({"action":"close"})',
          message_type: 'tool_call',
          tool_name: 'device_set_shutter',
          tool_status: 'success',
        },
        'user-1',
      ),
    ).to.deep.equal({
      created_at: '2026-07-06T08:00:00.000Z',
      role: 'tool_call',
      message_type: 'tool_call',
      text: 'device_set_shutter({"action":"close"})',
      tool_name: 'device_set_shutter',
      tool_status: 'success',
    });
  });

  it('should flag attached files in debug history without embedding them', () => {
    expect(
      formatStoredMessageForDebug(
        {
          created_at: '2026-07-06T08:00:00.000Z',
          sender_id: 'user-1',
          text: 'photo',
          message_type: 'chat',
          file: 'image/jpeg;base64,abc',
        },
        'user-1',
      ),
    ).to.deep.equal({
      created_at: '2026-07-06T08:00:00.000Z',
      role: 'user',
      message_type: 'chat',
      text: 'photo',
      has_file: true,
    });
  });

  it('should build conversation history with associated tool calls', () => {
    const history = buildConversationHistoryForDebug(
      [
        {
          created_at: '2026-07-06T08:00:00.000Z',
          sender_id: 'user-1',
          text: 'ferme tous les volets',
          message_type: 'chat',
        },
        {
          created_at: '2026-07-06T08:00:01.000Z',
          sender_id: null,
          text: 'device_set_shutter({"action":"close"})',
          message_type: 'tool_call',
          tool_name: 'device_set_shutter',
          tool_status: 'success',
        },
        {
          created_at: '2026-07-06T08:00:02.000Z',
          sender_id: null,
          text: 'Les volets sont en train de se fermer.',
          message_type: 'chat',
        },
      ],
      'user-1',
    );

    expect(history.messages).to.have.lengthOf(3);
    expect(history.toolCalls).to.have.lengthOf(1);
    expect(history.toolCalls[0].tool_name).to.equal('device_set_shutter');
  });
});

describe('gateway.getAiChatDebugContext', () => {
  beforeEach(() => {
    messageFindAll.resetHistory();
    messageFindAll.resolves([]);
  });

  it('should build debug payload with system prompt, exchanges and tools', async () => {
    messageFindAll.resolves([
      {
        get: () => ({ sender_id: null, text: 'Bonjour', file: null, message_type: 'chat' }),
      },
      {
        get: () => ({ sender_id: 'user-1', text: 'Salut', file: null, message_type: 'chat' }),
      },
    ]);

    const ctx = {
      serviceManager: {
        getService: fake.returns({
          mcpHandler: {
            getAllTools: fake.resolves([
              {
                intent: 'device.get-state',
                config: { description: 'Get state', inputSchema: {} },
              },
            ]),
          },
        }),
      },
      variable: {
        getValue: fake.resolves('Europe/Paris'),
      },
    };

    const payload = await getAiChatDebugContext.call(ctx, 'user-1');

    expect(payload.messages).to.deep.equal([
      { role: 'system', content: 'system prompt with time' },
      { role: 'user', content: 'Salut' },
      { role: 'assistant', content: 'Bonjour' },
    ]);
    expect(payload.tools).to.have.lengthOf(1);
    expect(payload.tools[0].function.name).to.equal('device_get_state');
    expect(payload.tool_choice).to.equal('auto');
    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.userId).to.equal('user-1');
    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.messageCount).to.equal(2);
    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.exchangeCount).to.equal(1);

    assert.calledOnce(messageFindAll);
    expect(messageFindAll.firstCall.args[0].limit).to.equal(200);
  });

  it('should default timezone when not configured', async () => {
    messageFindAll.resolves([
      {
        get: () => ({ sender_id: 'user-1', text: 'Salut', file: null, message_type: 'chat' }),
      },
    ]);

    const buildSystemPromptWithCurrentTime = (timezone) => `system prompt (${timezone})`;
    const { getAiChatDebugContext: getDebugContext } = proxyquire(
      '../../../lib/gateway/gateway.getAiChatDebugContext',
      {
        '../../models': {
          Message: {
            findAll: messageFindAll,
          },
        },
        './gateway.forwardMessageToAiChat': {
          buildSystemPromptWithCurrentTime,
        },
      },
    );

    const ctx = {
      serviceManager: {
        getService: fake.returns({
          mcpHandler: {
            getAllTools: fake.resolves([]),
          },
        }),
      },
      variable: {
        getValue: fake.resolves(null),
      },
    };

    const payload = await getDebugContext.call(ctx, 'user-1');

    expect(payload.messages[0].content).to.equal('system prompt (Europe/Paris)');
  });

  it('should include full conversation history with tool calls in debug payload', async () => {
    messageFindAll.resolves([
      {
        get: () => ({
          sender_id: null,
          text: 'Les volets sont en train de se fermer.',
          file: null,
          message_type: 'chat',
          tool_name: null,
          tool_status: null,
          created_at: '2026-07-06T08:00:02.000Z',
        }),
      },
      {
        get: () => ({
          sender_id: null,
          text: 'device_set_shutter({"action":"close"})',
          file: null,
          message_type: 'tool_call',
          tool_name: 'device_set_shutter',
          tool_status: 'success',
          created_at: '2026-07-06T08:00:01.000Z',
        }),
      },
      {
        get: () => ({
          sender_id: 'user-1',
          text: 'ferme tous les volets',
          file: null,
          message_type: 'chat',
          tool_name: null,
          tool_status: null,
          created_at: '2026-07-06T08:00:00.000Z',
        }),
      },
    ]);

    const ctx = {
      serviceManager: {
        getService: fake.returns({
          mcpHandler: {
            getAllTools: fake.resolves([]),
          },
        }),
      },
      variable: {
        getValue: fake.resolves('Europe/Paris'),
      },
    };

    const payload = await getAiChatDebugContext.call(ctx, 'user-1');

    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.conversationHistory.messages).to.have.lengthOf(3);
    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.conversationHistory.toolCalls).to.have.lengthOf(1);
    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.conversationHistory.toolCalls[0]).to.include({
      role: 'tool_call',
      tool_name: 'device_set_shutter',
      tool_status: 'success',
    });
  });

  it('should include all exchanges rebuilt from recent messages', async () => {
    const messages = [];
    for (let i = 6; i >= 1; i -= 1) {
      messages.push({
        get: () => ({
          sender_id: null,
          text: `answer ${i}`,
          file: null,
          message_type: 'chat',
          tool_name: null,
          tool_status: null,
          created_at: `2026-07-06T08:00:0${i}.000Z`,
        }),
      });
      messages.push({
        get: () => ({
          sender_id: 'user-1',
          text: `question ${i}`,
          file: null,
          message_type: 'chat',
          tool_name: null,
          tool_status: null,
          created_at: `2026-07-06T07:59:5${i}.000Z`,
        }),
      });
    }
    messageFindAll.resolves(messages);

    const ctx = {
      serviceManager: {
        getService: fake.returns({
          mcpHandler: {
            getAllTools: fake.resolves([]),
          },
        }),
      },
      variable: {
        getValue: fake.resolves('Europe/Paris'),
      },
    };

    const payload = await getAiChatDebugContext.call(ctx, 'user-1');

    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.exchangeCount).to.equal(6);
    expect(payload.messages.slice(1)).to.have.lengthOf(12);
  });

  it('should throw when MCP service is not running', async () => {
    const ctx = {
      serviceManager: {
        getService: fake.returns(null),
      },
      variable: {
        getValue: fake.resolves(null),
      },
    };

    try {
      await getAiChatDebugContext.call(ctx, 'user-1');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.message).to.include('MCP service is not running');
    }
  });
});
