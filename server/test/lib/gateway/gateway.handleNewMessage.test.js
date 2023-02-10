const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS } = require('../../../utils/constants');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.handleNewMessage', () => {
  const variable = {};
  const stateManager = {};
  const serviceManager = {};
  const event = {};

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
    variable.destroy = fake.resolves(null);

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    event.on = fake.returns(null);
    event.emit = fake.returns(null);

    stateManager.get = fake.returns({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });

    gateway = new Gateway(variable, event, {}, {}, {}, {}, stateManager, serviceManager, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should handle a new gateway message and reject it', async () => {
    const callback = fake.returns(true);

    await gateway.handleNewMessage(
      {
        type: 'gladys-api-call',
      },
      {
        rsaPublicKeyRaw: 'key',
        ecdsaPublicKeyRaw: 'key',
      },
      callback,
    );

    assert.notCalled(event.emit);
    assert.calledOnceWithExactly(callback, {
      error: 'USER_NOT_ACCEPTED_LOCALLY',
      message: 'User not allowed to control this Gladys instance',
      status: 403,
    });
  });

  it('should handle a new gateway message and reject it, user not accepted', async () => {
    gateway.usersKeys = [
      {
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: false,
      },
    ];

    const callback = fake.returns(true);

    await gateway.handleNewMessage(
      {
        type: 'gladys-api-call',
        options: {
          method: 'get',
          url: '/api/v1/house',
        },
      },
      {
        rsaPublicKeyRaw: 'key',
        ecdsaPublicKeyRaw: 'key',
        local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      callback,
    );

    assert.notCalled(event.emit);
    assert.calledOnceWithExactly(callback, {
      error: 'USER_NOT_ACCEPTED_LOCALLY',
      message: 'User not allowed to control this Gladys instance',
      status: 403,
    });
  });

  it('should handle a new gateway message and reject it, user not found', async () => {
    stateManager.get = fake.returns(null);

    gateway.usersKeys = [
      {
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: true,
      },
    ];

    const callback = fake.returns(true);

    await gateway.handleNewMessage(
      {
        type: 'gladys-api-call',
        options: {
          method: 'get',
          url: '/api/v1/house',
        },
      },
      {
        rsaPublicKeyRaw: 'key',
        ecdsaPublicKeyRaw: 'key',
        local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      callback,
    );

    assert.notCalled(event.emit);
    assert.calledOnceWithExactly(callback, {
      error: 'LINKED_USER_NOT_FOUND',
      status: 404,
    });
  });

  it('should handle a new gateway message and handle it', async () => {
    gateway.usersKeys = [
      {
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: true,
      },
    ];

    const callback = fake.returns(true);

    await gateway.handleNewMessage(
      {
        type: 'gladys-api-call',
        options: {
          method: 'get',
          url: '/api/v1/house',
        },
      },
      {
        rsaPublicKeyRaw: 'key',
        ecdsaPublicKeyRaw: 'key',
        local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      callback,
    );

    assert.notCalled(callback);
    assert.calledOnceWithExactly(
      event.emit,
      EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
      { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' },
      'get',
      '/api/v1/house',
      undefined,
      undefined,
      callback,
    );
  });

  it('should handle a new gateway open api message: create-device-state', async () => {
    gateway.usersKeys = [
      {
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: true,
      },
    ];

    const callback = fake.returns(true);

    await gateway.handleNewMessage(
      {
        type: 'gladys-open-api',
        action: 'create-device-state',
        data: {
          device_feature_external_id: 'external-id',
          state: 1,
        },
      },
      {
        rsaPublicKeyRaw: 'key',
        ecdsaPublicKeyRaw: 'key',
        local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      callback,
    );

    assert.calledOnceWithExactly(event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'external-id',
      state: 1,
    });
    assert.calledOnceWithExactly(callback, {
      status: 200,
    });
  });

  it('should handle a new gateway open api message: create-owntracks-location', async () => {
    gateway.usersKeys = [
      {
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: true,
      },
    ];

    const callback = fake.returns(true);

    await gateway.handleNewMessage(
      {
        type: 'gladys-open-api',
        action: 'create-owntracks-location',
        data: {
          lat: 42,
          lon: 42,
          alt: 0,
          acc: 100,
        },
      },
      {
        rsaPublicKeyRaw: 'key',
        ecdsaPublicKeyRaw: 'key',
        local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      callback,
    );

    assert.calledOnceWithExactly(event.emit, EVENTS.GATEWAY.NEW_MESSAGE_OWNTRACKS_LOCATION, {
      lat: 42,
      lon: 42,
      alt: 0,
      acc: 100,
    });
    assert.calledOnceWithExactly(callback, {
      status: 200,
    });
  });

  describe('testing GoogleHome', () => {
    const googleHomeTest = ({ intent, expectedResult }) => async () => {
      serviceManager.getService = fake.returns({
        googleActionsHandler: {
          onSync: fake.resolves({ status: 200, onSync: true }),
          onQuery: fake.resolves({ status: 200, onQuery: true }),
          onExecute: fake.resolves({ status: 200, onExecute: true }),
        },
      });

      gateway.usersKeys = [
        {
          rsa_public_key: 'fingerprint',
          ecdsa_public_key: 'fingerprint',
          accepted: true,
        },
      ];

      const callback = fake.returns(true);

      await gateway.handleNewMessage(
        {
          type: 'gladys-open-api',
          action: 'google-home-request',
          data: {
            inputs: [{ intent: `action.devices.${intent}` }],
          },
        },
        {
          rsaPublicKeyRaw: 'key',
          ecdsaPublicKeyRaw: 'key',
          local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        },
        callback,
      );

      assert.notCalled(event.emit);
      assert.calledOnceWithExactly(callback, expectedResult);
    };

    // We do not loop on array with values, beaucoup "forEach" method doesn't support async callbacks
    it(
      'should handle a new gateway open api message: google-home-request with intent SYNC',
      googleHomeTest({ intent: 'SYNC', expectedResult: { status: 200, onSync: true } }),
    );

    it(
      'should handle a new gateway open api message: google-home-request with intent EXECUTE',
      googleHomeTest({ intent: 'EXECUTE', expectedResult: { status: 200, onExecute: true } }),
    );

    it(
      'should handle a new gateway open api message: google-home-request with intent DISCONNECT',
      googleHomeTest({ intent: 'DISCONNECT', expectedResult: {} }),
    );

    it(
      'should handle a new gateway open api message: google-home-request with intent QUERY',
      googleHomeTest({ intent: 'QUERY', expectedResult: { status: 200, onQuery: true } }),
    );

    it(
      'should handle a new gateway open api message: google-home-request with intent UNKNOWN',
      googleHomeTest({ intent: 'UNKNOWN', expectedResult: { status: 400 } }),
    );
  });

  it('should handle a new gateway open api message: alexa-request', async () => {
    serviceManager.getService = fake.returns({
      alexaHandler: {
        onDiscovery: fake.returns({ onDiscovery: true }),
        onReportState: fake.returns({ onReportState: true }),
        onExecute: fake.returns({ onExecute: true }),
      },
    });

    gateway.usersKeys = [
      {
        rsa_public_key: 'fingerprint',
        ecdsa_public_key: 'fingerprint',
        accepted: true,
      },
    ];

    const callback = fake.returns(true);

    await gateway.handleNewMessage(
      {
        type: 'gladys-open-api',
        action: 'alexa-request',
        data: {
          directive: {
            header: {
              namespace: 'Alexa.Discovery',
              name: 'Discover',
              messageId: 'd89e30ed-bbcb-4ec5-9684-8e5c14e3bffd',
              payloadVersion: '3',
            },
            payload: {},
          },
        },
      },
      {
        rsaPublicKeyRaw: 'key',
        ecdsaPublicKeyRaw: 'key',
        local_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      callback,
    );

    assert.notCalled(event.emit);
    assert.calledOnceWithExactly(callback, { onDiscovery: true });
  });
});
