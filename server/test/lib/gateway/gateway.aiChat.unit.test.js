const { expect } = require('chai');
const { fake } = require('sinon');

const { Error403, Error429 } = require('../../../utils/httpErrors');
const { aiChat } = require('../../../lib/gateway/gateway.aiChat');

describe('gateway.aiChat unit', () => {
  it('should return gateway response on success', async () => {
    const ctx = {
      gladysGatewayClient: {
        openAIAsk: fake.resolves({ choices: [] }),
      },
    };
    const result = await aiChat.call(ctx, { messages: [] });
    expect(result).to.deep.equal({ choices: [] });
  });

  it('should map 403 and 429 errors to typed http errors', async () => {
    const forbidden = new Error('forbidden');
    forbidden.response = { status: 403, data: { error_message: 'forbidden' } };
    const tooMany = new Error('too many');
    tooMany.response = { status: 429, data: { error_message: 'too many' } };

    const ctx403 = {
      gladysGatewayClient: {
        openAIAsk: fake.rejects(forbidden),
      },
    };
    const ctx429 = {
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
