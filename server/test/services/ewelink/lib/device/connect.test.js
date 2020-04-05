const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const {
  serviceId,
  event,
  variableNotConfigured,
  variableOk,
  variableOkNoRegion,
  variableOkFalseRegion,
  variableNok,
} = require('../../mocks/consts.test');
const EweLinkApi = require('../../mocks/ewelink-api.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApi,
});

describe('EwelinkHandler connect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect', async () => {
    const gladys = { event, variable: variableOk };
    const eweLinkService = EwelinkService(gladys, serviceId);
    await eweLinkService.device.connect();

    assert.notCalled(gladys.variable.setValue);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'ewelink.connected' });

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
      assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', {
        type: 'ewelink.error',
        payload: 'Service is not configured',
      });
      expect(error.message).to.equal('EWeLink error: Service is not configured');
    }
  });
  it('should get region and connect', async () => {
    const gladys = { event, variable: variableOkNoRegion };
    const eweLinkService = EwelinkService(gladys, serviceId);
    await eweLinkService.device.connect();

    assert.calledWithExactly(gladys.variable.setValue, 'EWELINK_REGION', 'eu', serviceId);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'ewelink.connected' });

    expect(eweLinkService.device.configured).to.equal(true);
    expect(eweLinkService.device.connected).to.equal(true);
    expect(eweLinkService.device.accessToken).to.equal('validAccessToken');
    expect(eweLinkService.device.apiKey).to.equal('validApiKey');
  });
  it('should get right region and connect', async () => {
    const gladys = { event, variable: variableOkFalseRegion };
    const eweLinkService = EwelinkService(gladys, serviceId);
    await eweLinkService.device.connect();

    assert.calledWithExactly(gladys.variable.setValue, 'EWELINK_REGION', 'eu', serviceId);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'ewelink.connected' });

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
      assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', {
        type: 'ewelink.error',
        payload: 'Authentication error',
      });
      expect(error.status).to.equal(401);
      expect(error.message).to.equal('EWeLink error: Authentication error');
    }
  });
});
