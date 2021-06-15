const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const {
  event,
  serviceId,
  variableNok,
  variableNotConfigured,
  variableOk,
  variableOkFalseRegion,
  variableOkNoRegion,
} = require('../../mocks/consts.test');
const EweLinkApiMock = require('../../mocks/ewelink-api.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApiMock,
});

describe('EweLinkHandler connect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect and receive success', async () => {
    const gladys = { event, variable: variableOk };
    const eweLinkService = EwelinkService(gladys, serviceId);
    await eweLinkService.device.connect();

    assert.notCalled(gladys.variable.setValue);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });

    expect(eweLinkService.device.configured).to.equal(true);
    expect(eweLinkService.device.connected).to.equal(true);
    expect(eweLinkService.device.accessToken).to.equal('validAccessToken');
    expect(eweLinkService.device.apiKey).to.equal('validApiKey');
  });
  it('should return not configured error', async () => {
    const gladys = { event, variable: variableNotConfigured };
    const eweLinkService = EwelinkService(gladys, serviceId);
    try {
      await eweLinkService.device.connect();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: 'Service is not configured',
      });
      expect(error.message).to.equal('eWeLink: Error, service is not configured');
    }
  });
  it('should get region and connect', async () => {
    const gladys = { event, variable: variableOkNoRegion };
    const eweLinkService = EwelinkService(gladys, serviceId);
    await eweLinkService.device.connect();

    assert.calledWith(gladys.variable.setValue, 'EWELINK_REGION', 'eu', serviceId);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });

    expect(eweLinkService.device.configured).to.equal(true);
    expect(eweLinkService.device.connected).to.equal(true);
    expect(eweLinkService.device.accessToken).to.equal('validAccessToken');
    expect(eweLinkService.device.apiKey).to.equal('validApiKey');
  });
  it('should get right region and connect', async () => {
    const gladys = { event, variable: variableOkFalseRegion };
    const eweLinkService = EwelinkService(gladys, serviceId);
    await eweLinkService.device.connect();

    assert.calledWith(gladys.variable.setValue, 'EWELINK_REGION', 'eu', serviceId);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });

    expect(eweLinkService.device.configured).to.equal(true);
    expect(eweLinkService.device.connected).to.equal(true);
    expect(eweLinkService.device.accessToken).to.equal('validAccessToken');
    expect(eweLinkService.device.apiKey).to.equal('validApiKey');
  });
  it('should throw an error and emit a message when authentication fail', async () => {
    const gladys = { event, variable: variableNok };
    const eweLinkService = EwelinkService(gladys, serviceId);
    try {
      await eweLinkService.device.connect();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: 'Authentication error',
      });
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
