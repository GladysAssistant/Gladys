const nock = require('nock');
const { fake, assert } = require('sinon');
const { expect } = require('chai');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const NetatmoManager = require('../../../../../services/netatmo/lib/index.js');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('Test connect netatmo', () => {
  it('should failed to connect to netatmo and intialize "NETATMO_IS_CONNECT"', async () => {
    gladys.variable = {
      getValue: fake.resolves(undefined),
      setValue: fake.returns(undefined),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    try {
      await netatmoManager.connect();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
        payload: 'Service is not configured',
      });
      expect(error.message).to.equal('NETATMO: Error, service is not configured');
    }
  });

  it('should no connect to netatmo because "NETATMO_IS_CONNECT" different of "connect"', async () => {
    gladys.variable = {
      getValue: fake.resolves('true'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.connect();
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
      payload: 'Service is not configured',
    });
  });

  it('should throw an error on the result', async () => {
    gladys.variable = {
      getValue: fake.resolves('connect'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    const nockAuth = nock(`${netatmoManager.baseUrl}`)
      .post('/oauth2/token')
      .reply(400);
    try {
      await netatmoManager.connect();
      assert.fail();
      nockAuth.isDone();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
        payload: 'Service is not configured',
      });
      expect(error.message).to.include('NETATMO: Service is not connected with error');
      nockAuth.isDone();
    }
  });

  it('should connect to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves('connect'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    const nockAuth = nock(`${netatmoManager.baseUrl}`)
      .persist()
      .post('/oauth2/token')
      .reply(201, { access_token: 'XERTRXZEZREAR35346T4' });
    await netatmoManager.connect();
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.CONNECTED,
    });
    nockAuth.isDone();
  });
});
