const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { serviceId, event, variableOk, deviceManagerFull, stateManagerFull } = require('../../mocks/consts.test');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysThDevice = require('../../mocks/Gladys-th.json');
const EwelinkApi = require('../../mocks/ewelink-api.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EwelinkApi,
});

const gladys = {
  variable: variableOk,
  event,
  device: deviceManagerFull,
  stateManager: stateManagerFull,
};

describe('EweLinkHandler poll', () => {
  const eweLinkService = EwelinkService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    eweLinkService.device.connected = false;
    eweLinkService.device.accessToken = '';
  });

  it('should poll device and emit 1 state', async () => {
    await eweLinkService.device.poll(Gladys2Ch1Device);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'ewelink.connected' });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'ewelink:10004533ae:1:binary',
      state: 1,
    });
  });
  it('should poll device and emit 2 states', async () => {
    await eweLinkService.device.poll(GladysPowDevice);
    assert.callCount(gladys.event.emit, 3);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'ewelink.connected' });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'ewelink:10004531ae:0:binary',
      state: 1,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'ewelink:10004531ae:0:power',
      state: 22.3,
    });
  });
  it('should poll device and emit 3 states and 1 param', async () => {
    await eweLinkService.device.poll(GladysThDevice);
    assert.callCount(gladys.event.emit, 5);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'ewelink.connected' });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'ewelink:10004535ae:0:binary',
      state: 1,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'ewelink:10004535ae:0:temperature-sensor',
      state: 20,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'ewelink:10004535ae:0:humidity-sensor',
      state: 42,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.add-param', { name: 'FIRMWARE', value: '3.3.0' });
  });
  it('should throw an error when device is offline', async () => {
    try {
      await eweLinkService.device.poll(GladysOfflineDevice);
      assert.fail();
    } catch (error) {
      expect(error.message).to.equal('eWeLink: Error, device is not currently online');
    }
  });
  it('should throw an error when AccessToken is no more valid', async () => {
    eweLinkService.device.connected = true;
    eweLinkService.device.accessToken = 'NoMoreValidAccessToken';
    try {
      await eweLinkService.device.poll(Gladys2Ch1Device);
      assert.fail();
    } catch (error) {
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
