const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const { deviceManagerFull, event, serviceId, stateManagerFull, variableOk } = require('../../mocks/consts.test');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const Gladys2Ch2Device = require('../../mocks/Gladys-2ch2.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysThDevice = require('../../mocks/Gladys-th.json');
const EwelinkApiMock = require('../../mocks/ewelink-api.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EwelinkApiMock,
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

  it('should poll device and emit 1 state for the channel 1 of the "2CH" device', async () => {
    await eweLinkService.device.poll(Gladys2Ch1Device);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    assert.calledWith(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004531ae:1:power',
      state: 1,
    });
  });
  it('should poll device and emit 1 state for the channel 2 of the "2CH" device', async () => {
    await eweLinkService.device.poll(Gladys2Ch2Device);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    assert.calledWith(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004531ae:2:power',
      state: 0,
    });
  });
  it('should poll device and emit 2 states for "energyPower" device', async () => {
    await eweLinkService.device.poll(GladysPowDevice);
    assert.callCount(gladys.event.emit, 3);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    assert.calledWith(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004533ae:1:power',
      state: 1,
    });
    assert.calledWith(gladys.event.emit.getCall(2), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004533ae:1:energyPower',
      state: 22.3,
    });
  });
  it('should poll device and emit 3 states for "humidity" and "temperature" device', async () => {
    await eweLinkService.device.poll(GladysThDevice);
    assert.callCount(gladys.event.emit, 4);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    assert.calledWith(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:1:power',
      state: 1,
    });
    assert.calledWith(gladys.event.emit.getCall(2), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:1:humidity',
      state: 42,
    });
    assert.calledWith(gladys.event.emit.getCall(3), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:1:temperature',
      state: 20,
    });
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
