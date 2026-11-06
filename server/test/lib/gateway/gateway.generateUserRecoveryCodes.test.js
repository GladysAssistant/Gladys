const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const getConfig = require('../../../utils/getConfig');
const { ERROR_MESSAGES } = require('../../../utils/constants');
const { Error403, Error404, Error500 } = require('../../../utils/httpErrors');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const GATEWAY_USER_ID = 'a139e4a6-ec6c-442d-9730-0499155d38d4';

describe('gateway.generateUserRecoveryCodes', () => {
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

  it('should ask Gladys Plus for new recovery codes of the user, authenticated as the instance', async () => {
    const result = await gateway.generateUserRecoveryCodes(GATEWAY_USER_ID);
    assert.calledOnceWithExactly(gateway.gladysGatewayClient.generateTwoFactorRecoveryCodesInstance, GATEWAY_USER_ID);
    expect(result).to.deep.equal({
      recovery_codes: ['1a2b-3c4d-5e6f-7a8b-9c0d-1e2f-3a4b-5c6d'],
    });
  });

  it('should throw a 404 error when the user is not in the account of this instance', async () => {
    const error = new Error();
    error.response = { status: 404 };
    gateway.gladysGatewayClient.generateTwoFactorRecoveryCodesInstance = fake.rejects(error);
    try {
      await gateway.generateUserRecoveryCodes(GATEWAY_USER_ID);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error404);
      expect(e.message).to.equal(ERROR_MESSAGES.GATEWAY_USER_NOT_FOUND);
    }
  });

  it('should throw a 403 error when two factor is not enabled on the user', async () => {
    const error = new Error();
    error.response = { status: 403 };
    gateway.gladysGatewayClient.generateTwoFactorRecoveryCodesInstance = fake.rejects(error);
    try {
      await gateway.generateUserRecoveryCodes(GATEWAY_USER_ID);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error403);
      expect(e.message).to.equal(ERROR_MESSAGES.GATEWAY_TWO_FACTOR_NOT_ENABLED);
    }
  });

  it('should throw a 500 error on any other Gladys Plus error', async () => {
    const error = new Error();
    error.response = { status: 429 };
    gateway.gladysGatewayClient.generateTwoFactorRecoveryCodesInstance = fake.rejects(error);
    try {
      await gateway.generateUserRecoveryCodes(GATEWAY_USER_ID);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error500);
      expect(e.error).to.equal(undefined);
    }
  });

  it('should throw a 500 error when Gladys Plus is not reachable', async () => {
    gateway.gladysGatewayClient.generateTwoFactorRecoveryCodesInstance = fake.rejects(new Error());
    try {
      await gateway.generateUserRecoveryCodes(GATEWAY_USER_ID);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error500);
      expect(e.error).to.equal(ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET);
    }
  });
});
