const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const { fake } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.getUsersKeys', () => {
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

    variable.getValue = fake.resolves('[]');
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

  it('should get users keys with no users in current list', async () => {
    const users = await gateway.getUsersKeys();
    expect(users).to.deep.equal([
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
        connected: false,
        accepted: false,
      },
    ]);
  });
  it('should merge new user keys with old user', async () => {
    const oldUsers = [
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'not-the-fingerprint',
        gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
        connected: false,
        accepted: true,
      },
    ];
    variable.getValue = fake.resolves(JSON.stringify(oldUsers));

    const users = await gateway.getUsersKeys();
    expect(users).to.deep.equal([
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
        connected: false,
        accepted: false,
      },
    ]);
  });
  it('should merge new user keys with old user', async () => {
    const oldUsers = [
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key: 'not-the-fingerprint',
        ecdsa_public_key: 'not-the-fingerprint',
        gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
        connected: false,
        accepted: true,
      },
    ];
    variable.getValue = fake.resolves(JSON.stringify(oldUsers));

    const users = await gateway.getUsersKeys();
    expect(users).to.deep.equal([
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
        connected: false,
        accepted: false,
      },
    ]);
  });
});
