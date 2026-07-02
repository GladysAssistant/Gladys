const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const messageFindAll = sinon.stub().resolves([]);

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

  it('should build debug payload with system prompt, messages and tools', async () => {
    messageFindAll.resolves([
      { get: () => ({ sender_id: null, text: 'Bonjour', file: null }) },
      { get: () => ({ sender_id: 'user-1', text: 'Salut', file: null }) },
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

    assert.calledOnce(messageFindAll);
    expect(messageFindAll.firstCall.args[0].limit).to.equal(50);
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
