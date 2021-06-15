const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const { deviceManagerFull, event, serviceId, stateManagerFull, variableOk } = require('../../mocks/consts.test');
const Gladys2ChDevice = require('../../mocks/Gladys-2ch.json');
const GladysBasicDevice = require('../../mocks/Gladys-Basic.json');
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

  it('should poll device and emit 2 states for a "2CH" model', async () => {
    await eweLinkService.device.poll(Gladys2ChDevice);
    assert.callCount(gladys.event.emit, 3);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    assert.calledWith(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004531ae:binary:1',
      state: 1,
    });
    assert.calledWith(gladys.event.emit.getCall(2), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004531ae:binary:2',
      state: 0,
    });
  });
  it('should poll device and emit 1 state for a "POW" device', async () => {
    await eweLinkService.device.poll(GladysPowDevice);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    assert.calledWith(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004533ae:binary:1',
      state: 1,
    });
  });
  it('should poll device and emit 3 states for a "TH" model', async () => {
    await eweLinkService.device.poll(GladysThDevice);
    assert.callCount(gladys.event.emit, 4);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    assert.calledWith(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:binary:1',
      state: 1,
    });
    assert.calledWith(gladys.event.emit.getCall(2), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:humidity',
      state: 42,
    });
    assert.calledWith(gladys.event.emit.getCall(3), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:temperature',
      state: 20,
    });
  });
  it('should poll device and update 2 params for a "Basic" model', async () => {
    expect(GladysBasicDevice.params).to.deep.equal([
      { name: 'IP_ADDRESS', value: '192.168.0.6' },
      { name: 'FIRMWARE', value: '3.1.2' },
      { name: 'ONLINE', value: '0' },
    ]);
    await eweLinkService.device.poll(GladysBasicDevice);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit.getCall(0), EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
    });
    expect(GladysBasicDevice.params).to.deep.equal([
      { name: 'IP_ADDRESS', value: '192.168.0.6' },
      { name: 'FIRMWARE', value: '3.3.0' },
      { name: 'ONLINE', value: '1' },
    ]);
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
      await eweLinkService.device.poll(Gladys2ChDevice);
      assert.fail();
    } catch (error) {
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
