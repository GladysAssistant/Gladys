const { fake, assert } = require('sinon');
const { expect } = require('chai');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const NetatmoManager = require('../../../../../services/netatmo/lib/index.js');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('Test disconnect netatmo', () => {
  it('should failed to disconnect to netatmo', async () => {
    gladys.variable = {};
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    try {
      await netatmoManager.disconnect();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
        payload: 'Failed disconnect Netatmo',
      });
      expect(error.message).to.equal('NETATMO: Failed disconnect service');
    }
  });

  it('should disconnect api netatmo', async () => {
    gladys.variable = {
      setValue: fake.resolves('disconnect'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    await netatmoManager.disconnect();
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.DISCONNECTED,
    });
  });
});
