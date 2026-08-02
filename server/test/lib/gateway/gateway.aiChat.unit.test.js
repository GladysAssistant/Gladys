const { expect } = require('chai');
const { fake } = require('sinon');

const { Error400, Error403, Error429 } = require('../../../utils/httpErrors');
const { aiChat, normalizeAiChatRequestBody } = require('../../../lib/gateway/gateway.aiChat');
const { DEFAULT_TEXT_MODEL } = require('../../../utils/aiChatModels');

describe('gateway.aiChat unit', () => {
  it('should return gateway response on success', async () => {
    const ctx = {
      variable: { getValue: fake.resolves(null) },
      gladysGatewayClient: {
        openAIAsk: fake.resolves({ choices: [] }),
      },
    };
    const result = await aiChat.call(ctx, { messages: [] });
    expect(result).to.deep.equal({ choices: [] });
  });

  it('should omit model when auto is selected', async () => {
    const openAIAsk = fake.resolves({ choices: [] });
    const ctx = {
      variable: { getValue: fake.resolves(null) },
      gladysGatewayClient: {
        openAIAsk,
      },
    };
    await aiChat.call(ctx, { messages: [], model: 'auto' });
    expect(openAIAsk.calledOnceWith({ messages: [] })).to.equal(true);
  });

  it('should forward a valid model to the gateway', async () => {
    const openAIAsk = fake.resolves({ choices: [] });
    const ctx = {
      variable: { getValue: fake.resolves(null) },
      gladysGatewayClient: {
        openAIAsk,
      },
    };
    await aiChat.call(ctx, { messages: [], model: DEFAULT_TEXT_MODEL });
    expect(openAIAsk.calledOnceWith({ messages: [], model: DEFAULT_TEXT_MODEL })).to.equal(true);
  });

  it('should reject invalid models', () => {
    expect(() => normalizeAiChatRequestBody({ messages: [], model: 'unknown-model' })).to.throw(Error400);
  });

  it('should map 403 and 429 errors to typed http errors', async () => {
    const forbidden = new Error('forbidden');
    forbidden.response = { status: 403, data: { error_message: 'forbidden' } };
    const tooMany = new Error('too many');
    tooMany.response = { status: 429, data: { error_message: 'too many' } };

    const ctx403 = {
      variable: { getValue: fake.resolves(null) },
      gladysGatewayClient: {
        openAIAsk: fake.rejects(forbidden),
      },
    };
    const ctx429 = {
      variable: { getValue: fake.resolves(null) },
      gladysGatewayClient: {
        openAIAsk: fake.rejects(tooMany),
      },
    };

    let error403 = null;
    try {
      await aiChat.call(ctx403, { messages: [] });
    } catch (e) {
      error403 = e;
    }
    expect(error403).to.be.instanceOf(Error403);

    let error429 = null;
    try {
      await aiChat.call(ctx429, { messages: [] });
    } catch (e) {
      error429 = e;
    }
    expect(error429).to.be.instanceOf(Error429);
  });
});

describe('gateway.aiChat unit (external AI provider routing)', () => {
  it('should relay to the selected provider with the model stripped', async () => {
    const chat = fake.resolves({ choices: [{ message: { content: 'Hi' } }] });
    const openAIAsk = fake.resolves({ choices: [] });
    const ctx = {
      variable: { getValue: fake.resolves('ext-dev-claude-provider-demo') },
      serviceManager: { getService: fake.returns({ ai: { chat } }) },
      gladysGatewayClient: { openAIAsk },
    };
    const result = await aiChat.call(ctx, {
      messages: [],
      tools: [],
      tool_choice: 'auto',
      purpose: 'chat',
      categories: ['other'],
      model: DEFAULT_TEXT_MODEL,
    });
    expect(result).to.deep.equal({ choices: [{ message: { content: 'Hi' } }] });
    // the model is Gladys Plus vocabulary: stripped, hints pass through
    expect(
      chat.calledOnceWith({ messages: [], tools: [], tool_choice: 'auto', purpose: 'chat', categories: ['other'] }),
    ).to.equal(true);
    expect(ctx.serviceManager.getService.calledOnceWith('ext-dev-claude-provider-demo')).to.equal(true);
    // never rerouted to Gladys Plus
    expect(openAIAsk.called).to.equal(false);
  });

  it('should relay a request without a model field untouched', async () => {
    const chat = fake.resolves({ choices: [] });
    const ctx = {
      variable: { getValue: fake.resolves('ext-dev-claude-provider-demo') },
      serviceManager: { getService: fake.returns({ ai: { chat } }) },
      gladysGatewayClient: { openAIAsk: fake.resolves({ choices: [] }) },
    };
    await aiChat.call(ctx, { messages: [] });
    expect(chat.calledOnceWith({ messages: [] })).to.equal(true);
  });

  it('should throw when the selected provider is not registered', async () => {
    const ctx = {
      variable: { getValue: fake.resolves('ext-dev-claude-provider-demo') },
      serviceManager: { getService: fake.returns(null) },
      gladysGatewayClient: { openAIAsk: fake.resolves({ choices: [] }) },
    };
    let error = null;
    try {
      await aiChat.call(ctx, { messages: [] });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(Error400);
  });

  it('should throw when the selected provider has no ai capability', async () => {
    const ctx = {
      variable: { getValue: fake.resolves('ext-dev-open-meteo-demo') },
      serviceManager: { getService: fake.returns({ device: {} }) },
      gladysGatewayClient: { openAIAsk: fake.resolves({ choices: [] }) },
    };
    let error = null;
    try {
      await aiChat.call(ctx, { messages: [] });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(Error400);
  });
});
