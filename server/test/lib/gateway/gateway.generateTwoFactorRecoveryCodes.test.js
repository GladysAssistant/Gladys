const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const getConfig = require('../../../utils/getConfig');
const { Error403, Error500 } = require('../../../utils/httpErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.generateTwoFactorRecoveryCodes', () => {
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

  it('should return a new set of recovery codes', async () => {
    const result = await gateway.generateTwoFactorRecoveryCodes();
    assert.calledOnce(gateway.gladysGatewayClient.generateTwoFactorRecoveryCodes);
    expect(result).to.deep.equal({
      recovery_codes: ['1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d'],
    });
  });

  it('should throw 403 error when the gateway refuses the request', async () => {
    const error = new Error();
    error.response = { status: 403 };
    gateway.gladysGatewayClient.generateTwoFactorRecoveryCodes = fake.rejects(error);
    try {
      await gateway.generateTwoFactorRecoveryCodes();
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error403);
    }
  });

  it('should throw 500 error when the gateway is not reachable', async () => {
    gateway.gladysGatewayClient.generateTwoFactorRecoveryCodes = fake.rejects(new Error());
    try {
      await gateway.generateTwoFactorRecoveryCodes();
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error500);
    }
  });
});
