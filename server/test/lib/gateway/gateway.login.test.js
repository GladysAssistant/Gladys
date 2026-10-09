const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const getConfig = require('../../../utils/getConfig');
const { EVENTS } = require('../../../utils/constants');
const { Error403, Error500 } = require('../../../utils/httpErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.login', () => {
  const variable = {};

  let gateway;

  beforeEach(() => {
    const job = {
      wrapper: (type, func) => {
        return async () => {
          return func();
        };
      },
      updateProgress: fake.resolves({}),
    };

    variable.getValue = fake.resolves(null);
    variable.setValue = fake.resolves(null);

    const event = {
      on: fake.returns(null),
      emit: fake.returns(null),
    };

    const config = getConfig();

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    gateway = new Gateway(variable, event, {}, {}, config, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should login to gladys gateway', async () => {
    const loginResults = await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
    expect(loginResults).deep.eq({
      two_factor_token: 'token',
    });
  });

  it('should throw 403 error on error with gateway', async () => {
    try {
      // force error on gateway client
      await gateway.login('tony.stark@gladysassistant.com', 'pass403');
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error403);
    }
  });

  it('should throw 500 error on invalid gateway', async () => {
    try {
      // force error on gateway client
      await gateway.login('tony.stark@gladysassistant.com', 'pass500');
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error500);
    }
  });

  it('should login two factor to gladys gateway', async () => {
    await gateway.loginTwoFactor('token', '123456');
    assert.calledWith(gateway.gladysGatewayClient.loginInstance, 'token', '123456');
    assert.called(variable.getValue);
    assert.called(variable.setValue);
    assert.calledOnce(gateway.gladysGatewayClient.createInstance);
    // Plus is now linked: external integration webhooks recompute
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
  });

  it('should generate recovery codes while the user token is still valid', async () => {
    const result = await gateway.loginTwoFactor('token', '123456', undefined, true);
    // the codes must be generated before init() connects as the instance and
    // replaces the user access token, so before the instance is even created
    assert.callOrder(
      gateway.gladysGatewayClient.loginInstance,
      gateway.gladysGatewayClient.generateTwoFactorRecoveryCodes,
      gateway.gladysGatewayClient.createInstance,
    );
    // the Gateway requires the current two factor code to generate recovery codes
    assert.calledWith(gateway.gladysGatewayClient.generateTwoFactorRecoveryCodes, '123456');
    expect(result).to.deep.equal({
      recovery_codes: ['1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d'],
    });
  });

  it('should not generate recovery codes when they were not asked for', async () => {
    const result = await gateway.loginTwoFactor('token', '123456');
    assert.notCalled(gateway.gladysGatewayClient.generateTwoFactorRecoveryCodes);
    expect(result).to.deep.equal({
      recovery_codes: null,
    });
  });

  it('should login two factor with a recovery code to gladys gateway', async () => {
    await gateway.loginTwoFactor('token', undefined, '1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d');
    assert.notCalled(gateway.gladysGatewayClient.loginInstance);
    assert.calledWith(
      gateway.gladysGatewayClient.loginInstanceWithRecoveryCode,
      'token',
      '1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d',
    );
    assert.calledOnce(gateway.gladysGatewayClient.createInstance);
    // Plus is now linked: external integration webhooks recompute
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
  });
});
