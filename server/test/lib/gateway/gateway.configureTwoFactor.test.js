const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const getConfig = require('../../../utils/getConfig');
const { Error403, Error500 } = require('../../../utils/httpErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.configureTwoFactor', () => {
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

  it('should return the otpauth url to configure two factor', async () => {
    const result = await gateway.configureTwoFactor('access-token');
    assert.calledWith(gateway.gladysGatewayClient.configureTwoFactor, 'access-token');
    expect(result).to.deep.equal({
      otpauth_url: 'otpauth://totp/Gladys%20Gateway?secret=THISISMYSECRET',
    });
  });

  it('should throw 403 error when the gateway refuses the access token', async () => {
    const error = new Error();
    error.response = { status: 401 };
    gateway.gladysGatewayClient.configureTwoFactor = fake.rejects(error);
    try {
      await gateway.configureTwoFactor('access-token');
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error403);
    }
  });

  it('should throw 500 error when the gateway is not reachable', async () => {
    gateway.gladysGatewayClient.configureTwoFactor = fake.rejects(new Error());
    try {
      await gateway.configureTwoFactor('access-token');
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error500);
    }
  });

  it('should enable two factor', async () => {
    const result = await gateway.enableTwoFactor('access-token', '123456');
    assert.calledWith(gateway.gladysGatewayClient.enableTwoFactor, 'access-token', '123456');
    expect(result).to.deep.equal({
      two_factor_enabled: true,
    });
  });

  it('should throw 403 error when the two factor code is invalid', async () => {
    const error = new Error();
    error.response = { status: 422 };
    gateway.gladysGatewayClient.enableTwoFactor = fake.rejects(error);
    try {
      await gateway.enableTwoFactor('access-token', '123456');
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error403);
    }
  });

  it('should throw 500 error when the gateway is not reachable', async () => {
    gateway.gladysGatewayClient.enableTwoFactor = fake.rejects(new Error());
    try {
      await gateway.enableTwoFactor('access-token', '123456');
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error500);
    }
  });
});
