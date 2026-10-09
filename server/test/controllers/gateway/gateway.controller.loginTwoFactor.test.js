const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;

const GatewayController = require('../../../api/controllers/gateway.controller');

describe('gateway.controller loginTwoFactor endpoint', () => {
  let res;
  let gladys;

  beforeEach(() => {
    res = {
      json: fake(),
    };
    gladys = {
      gateway: {
        loginTwoFactor: fake.resolves({ recovery_codes: null }),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should login with a two factor code', async () => {
    const controller = GatewayController(gladys);

    await controller.loginTwoFactor({ body: { two_factor_token: 'token', two_factor_code: '123456' } }, res);

    sinonAssert.calledWith(gladys.gateway.loginTwoFactor, 'token', '123456', undefined, undefined);
    expect(res.json.firstCall.args[0]).to.deep.equal({
      success: true,
      recovery_codes: null,
    });
  });

  it('should login with a two factor recovery code', async () => {
    const controller = GatewayController(gladys);

    await controller.loginTwoFactor(
      { body: { two_factor_token: 'token', two_factor_recovery_code: '1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d' } },
      res,
    );

    sinonAssert.calledWith(
      gladys.gateway.loginTwoFactor,
      'token',
      undefined,
      '1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d',
      undefined,
    );
  });

  it('should return the generated recovery codes', async () => {
    gladys.gateway.loginTwoFactor = fake.resolves({
      recovery_codes: ['1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d'],
    });
    const controller = GatewayController(gladys);

    await controller.loginTwoFactor(
      { body: { two_factor_token: 'token', two_factor_code: '123456', generate_recovery_codes: true } },
      res,
    );

    sinonAssert.calledWith(gladys.gateway.loginTwoFactor, 'token', '123456', undefined, true);
    expect(res.json.firstCall.args[0]).to.deep.equal({
      success: true,
      recovery_codes: ['1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d'],
    });
  });
});
