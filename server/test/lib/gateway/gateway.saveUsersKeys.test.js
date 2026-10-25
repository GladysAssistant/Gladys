const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.saveUsersKeys', () => {
  const variable = {};

  let gateway;

  beforeEach(async () => {
    const job = {
      wrapper: (type, func) => {
        return async () => {
          return func();
        };
      },
      updateProgress: fake.resolves({}),
    };

    variable.setValue = fake.resolves(null);

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    const event = {
      on: fake.returns(null),
      emit: fake.returns(null),
    };

    gateway = new Gateway(variable, event, {}, {}, {}, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should forget that the keys changed once the user is accepted again', async () => {
    await gateway.saveUsersKeys([
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: true,
        keys_changed: true,
      },
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Pepper',
        rsa_public_key: 'other-fingerprint',
        ecdsa_public_key: 'other-fingerprint',
        accepted: false,
        keys_changed: true,
      },
    ]);
    assert.calledOnce(variable.setValue);
    expect(variable.setValue.firstCall.args[0]).to.equal(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_USERS_KEYS);
    expect(JSON.parse(variable.setValue.firstCall.args[1])).to.deep.equal([
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: true,
      },
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Pepper',
        rsa_public_key: 'other-fingerprint',
        ecdsa_public_key: 'other-fingerprint',
        accepted: false,
        keys_changed: true,
      },
    ]);
  });
});
