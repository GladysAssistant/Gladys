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
      scheduleJob: (name, date, callback) => {
        return {
          name,
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
    expect(loginResults).to.have.property('two_factor_token');
    assert.calledWith(gateway.gladysGatewayClient.login, 'tony.stark@gladysassistant.com', 'warmachine123');
  });

  it('should throw 403 error on error with gateway', async () => {
    // force error on gateway client
    const error = new Error();
    error.response = { status: 403 };
    gateway.gladysGatewayClient.login = fake.rejects(error);

    try {
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error403);
    }
  });

  it('should throw 500 error on invalid gateway', async () => {
    // force error on gateway client
    gateway.gladysGatewayClient.login = fake.rejects(null);

    try {
      await gateway.login('tony.stark@gladysassistant.com', 'warmachine123');
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
  });
});
