const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { Error400, Error402, Error403, Error429 } = require('../../../utils/httpErrors');
const { aiChat, normalizeAiChatRequestBody, describeAiChatError } = require('../../../lib/gateway/gateway.aiChat');
const { DEFAULT_TEXT_MODEL } = require('../../../utils/aiChatModels');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');

describe('gateway.aiChat unit', () => {
  it('should return gateway response on success', async () => {
    const ctx = {
      variable: { getValue: fake.resolves(null) },
      callPlanGatedApi: (call) => call(),
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
      callPlanGatedApi: (call) => call(),
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
      callPlanGatedApi: (call) => call(),
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

  it('should let the payment check lock the instance on a 402 error', async () => {
    const paymentRequired = new Error('payment required');
    paymentRequired.response = { status: 402, data: { error_code: 'PAYMENT_REQUIRED' } };
    const ctx = {
      variable: { getValue: fake.resolves(null) },
      callPlanGatedApi: fake.rejects(new Error402('GLADYS_PLUS_PAYMENT_REQUIRED')),
    };

    let error = null;
    try {
      await aiChat.call(ctx, { messages: [] });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(Error402);
    expect(ctx.callPlanGatedApi.calledOnce).to.equal(true);
  });

  it('should map 403 and 429 errors to typed http errors', async () => {
    const forbidden = new Error('forbidden');
    forbidden.response = { status: 403, data: { error_message: 'forbidden' } };
    const tooMany = new Error('too many');
    tooMany.response = { status: 429, data: { error_message: 'too many' } };

    const ctx403 = {
      variable: { getValue: fake.resolves(null) },
      callPlanGatedApi: (call) => call(),
      gladysGatewayClient: {
        openAIAsk: fake.rejects(forbidden),
      },
    };
    const ctx429 = {
      variable: { getValue: fake.resolves(null) },
      callPlanGatedApi: (call) => call(),
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

  describe('describeAiChatError', () => {
    it('should keep only the message, the status and the gateway error of a request error', () => {
      const error = new Error('Request failed with status code 502');
      error.config = { headers: { authorization: 'secret-instance-token' }, data: '{"messages":[]}' };
      error.response = {
        status: 502,
        data: {
          status: 502,
          error_code: 'BAD_GATEWAY',
          error_message: 'AI service returned an error',
          details: { prompt: 'user message' },
        },
      };
      const description = describeAiChatError(error);
      expect(description).to.equal(
        'Request failed with status code 502 (status=502, error_code=BAD_GATEWAY, error_message=AI service returned an error)',
      );
      expect(description).not.to.include('secret-instance-token');
      expect(description).not.to.include('user message');
    });

    it('should truncate a long gateway error message', () => {
      const error = new Error('Request failed with status code 502');
      error.response = { status: 502, data: { error_message: 'x'.repeat(1000) } };
      expect(describeAiChatError(error)).to.equal(
        `Request failed with status code 502 (status=502, error_message=${'x'.repeat(500)})`,
      );
    });

    it('should only keep the status of a response without gateway error', () => {
      const error = new Error('Request failed with status code 500');
      const data = {};
      data.self = data;
      error.response = { status: 500, data };
      expect(describeAiChatError(error)).to.equal('Request failed with status code 500 (status=500)');
    });

    it('should return the stack of an error without response', () => {
      const error = new Error('boom');
      expect(describeAiChatError(error)).to.equal(error.stack);
    });

    it('should return the message of an error without stack', () => {
      expect(describeAiChatError({ message: 'boom' })).to.equal('boom');
    });

    it('should describe a non-error value', () => {
      expect(describeAiChatError(undefined)).to.equal('undefined');
    });
  });
});

describe('gateway.aiChat unit (external AI provider routing)', () => {
  const buildContext = ({ selector = 'ext-dev-claude-provider-demo', proxyService, callPlanGatedApi } = {}) => ({
    variable: { getValue: fake(async (name) => (name === SYSTEM_VARIABLE_NAMES.AI_PROVIDER ? selector : null)) },
    serviceManager: { getService: fake.returns(proxyService === undefined ? null : proxyService) },
    callPlanGatedApi: callPlanGatedApi || fake((call) => call()),
    gladysGatewayClient: { openAIAsk: fake.resolves({ choices: [] }) },
  });

  it('should relay to the selected provider with the model stripped', async () => {
    const chat = fake.resolves({ choices: [{ message: { content: 'Hi' } }] });
    const ctx = buildContext({ proxyService: { ai: { chat } } });
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
    expect(ctx.gladysGatewayClient.openAIAsk.called).to.equal(false);
    expect(ctx.callPlanGatedApi.called).to.equal(false);
  });

  it('should relay a request without a model field untouched', async () => {
    const chat = fake.resolves({ choices: [] });
    const ctx = buildContext({ proxyService: { ai: { chat } } });
    await aiChat.call(ctx, { messages: [] });
    expect(chat.calledOnceWith({ messages: [] })).to.equal(true);
  });

  it('should reach the provider even when the Gladys Plus subscription is paused', async () => {
    // the external branch sits before the plan gate: a locked Plus
    // subscription must not answer 402 to an instance using its own provider
    const chat = fake.resolves({ choices: [{ message: { content: 'Hi' } }] });
    const ctx = buildContext({
      proxyService: { ai: { chat } },
      callPlanGatedApi: fake.rejects(new Error402('GLADYS_PLUS_PAYMENT_REQUIRED')),
    });
    const result = await aiChat.call(ctx, { messages: [] });
    expect(result).to.deep.equal({ choices: [{ message: { content: 'Hi' } }] });
    expect(chat.calledOnce).to.equal(true);
    expect(ctx.callPlanGatedApi.called).to.equal(false);
  });

  it('should throw when the selected provider is not registered', async () => {
    const ctx = buildContext({ proxyService: null });
    let error = null;
    try {
      await aiChat.call(ctx, { messages: [] });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(ExternalIntegrationUnavailableError);
    expect(error.message).to.equal('EXTERNAL_INTEGRATION_AI_PROVIDER_NOT_AVAILABLE');
    // and never silently rerouted to Gladys Plus
    expect(ctx.gladysGatewayClient.openAIAsk.called).to.equal(false);
  });

  it('should throw when the selected provider has no ai capability', async () => {
    const ctx = buildContext({ selector: 'ext-dev-open-meteo-demo', proxyService: { device: {} } });
    let error = null;
    try {
      await aiChat.call(ctx, { messages: [] });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(ExternalIntegrationUnavailableError);
  });
});
