const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const messageFindAll = sinon.stub().resolves([]);

const { EXCHANGE_LIMIT } = require('../../../lib/message/message.getPreviousQuestionsForUser');

const { getAiChatDebugContext, dbMessageToApiMessage, formatFileAsImageUrl } = proxyquire(
  '../../../lib/gateway/gateway.getAiChatDebugContext',
  {
    '../../models': {
      Message: {
        findAll: messageFindAll,
      },
    },
    './gateway.forwardMessageToAiChat': {
      buildSystemPromptWithCurrentTime: () => 'system prompt with time',
    },
  },
);

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
    expect(messageFindAll.firstCall.args[0].limit).to.equal(30);
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

  it('should keep only the last four exchanges like live AI chat', async () => {
    const messages = [];
    for (let i = 6; i >= 1; i -= 1) {
      messages.push({
        get: () => ({ sender_id: null, text: `answer ${i}`, file: null, message_type: 'chat' }),
      });
      messages.push({
        get: () => ({ sender_id: 'user-1', text: `question ${i}`, file: null, message_type: 'chat' }),
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

    const conversationMessages = payload.messages.slice(1);
    expect(conversationMessages).to.have.lengthOf(EXCHANGE_LIMIT * 2);
    expect(conversationMessages.map((message) => message.content)).to.deep.equal([
      'question 3',
      'answer 3',
      'question 4',
      'answer 4',
      'question 5',
      'answer 5',
      'question 6',
      'answer 6',
    ]);
    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.exchangeCount).to.equal(EXCHANGE_LIMIT);
    // eslint-disable-next-line no-underscore-dangle
    expect(payload._debug.messageCount).to.equal(12);
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
