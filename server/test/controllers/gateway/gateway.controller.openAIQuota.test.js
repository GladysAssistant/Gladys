const { expect } = require('chai');
const { fake, assert: sinonAssert } = require('sinon');

const GatewayController = require('../../../api/controllers/gateway.controller');

describe('gateway.controller getOpenAIQuota endpoint', () => {
  let res;
  let gladys;

  beforeEach(() => {
    res = {
      json: fake(),
    };
    gladys = {
      gateway: {
        getOpenAIQuota: fake.resolves({
          text: {
            remaining: 80,
            max: 100,
            reset_in_seconds: 3600,
          },
          image: {
            remaining: 50,
            max: 100,
            reset_in_seconds: 0,
          },
        }),
      },
    };
  });

  it('should return OpenAI quota from gateway', async () => {
    const controller = GatewayController(gladys);

    await controller.getOpenAIQuota({}, res);

    sinonAssert.calledOnce(gladys.gateway.getOpenAIQuota);
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({
      text: {
        remaining: 80,
        max: 100,
        reset_in_seconds: 3600,
      },
      image: {
        remaining: 50,
        max: 100,
        reset_in_seconds: 0,
      },
    });
  });
});
