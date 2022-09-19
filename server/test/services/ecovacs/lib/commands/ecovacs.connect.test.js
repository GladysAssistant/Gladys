const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const { event, serviceId, variableOk, variableNok, variableNotConfigured } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

describe('ecovacs.connect command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect and receive success', async () => {
    const gladys = { event, variable: variableOk };
    const ecovacsService = EcovacsService(gladys, serviceId);
    await ecovacsService.device.connect();

    assert.notCalled(gladys.variable.setValue);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ECOVACS.CONNECTED,
    });

    expect(ecovacsService.device.configured).to.equal(true);
    expect(ecovacsService.device.connected).to.equal(true);
  });

  it('should return not configured error', async () => {
    const gladys = { event, variable: variableNotConfigured };
    const ecovacsService = EcovacsService(gladys, serviceId);
    try {
      await ecovacsService.device.connect();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ECOVACS.ERROR,
        payload: 'Service is not configured',
      });
      expect(error.message).to.equal('Ecovacs: Error, service is not configured');
    }
  });

  it('should throw an error and emit a message when authentication fail', async () => {
    const gladys = { event, variable: variableNok };
    const ecovacsService = EcovacsService(gladys, serviceId);
    try {
      await ecovacsService.device.connect();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ECOVACS.ERROR,
        payload: 'Ecovacs: Authentication error',
      });
      expect(ecovacsService.device.configured).to.equal(false);
      expect(ecovacsService.device.connected).to.equal(false);
    }
  });
});
