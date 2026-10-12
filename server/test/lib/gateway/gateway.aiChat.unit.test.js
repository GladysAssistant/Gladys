const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { Error400, Error402, Error403, Error429 } = require('../../../utils/httpErrors');
const { aiChat, normalizeAiChatRequestBody, describeAiChatError } = require('../../../lib/gateway/gateway.aiChat');
const { DEFAULT_TEXT_MODEL } = require('../../../utils/aiChatModels');

describe('gateway.aiChat unit', () => {
  it('should return gateway response on success', async () => {
    const ctx = {
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
      callPlanGatedApi: (call) => call(),
      gladysGatewayClient: {
        openAIAsk: fake.rejects(forbidden),
      },
    };
    const ctx429 = {
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
    it('should keep only the message and the gateway response of a request error', () => {
      const error = new Error('Request failed with status code 502');
      error.config = { headers: { authorization: 'secret-instance-token' }, data: '{"messages":[]}' };
      error.response = {
        status: 502,
        data: { status: 502, error_code: 'BAD_GATEWAY', error_message: 'AI service returned an error' },
      };
      const description = describeAiChatError(error);
      expect(description).to.equal(
        'Request failed with status code 502 (status=502, response={"status":502,"error_code":"BAD_GATEWAY","error_message":"AI service returned an error"})',
      );
      expect(description).not.to.include('secret-instance-token');
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
