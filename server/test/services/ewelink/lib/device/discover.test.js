const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const {
  serviceId,
  event,
  variableNotConfigured,
  variableOk,
  stateManagerWith0Devices,
  stateManagerWith3Devices,
} = require('../../mocks/consts.test');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const Gladys2Ch2Device = require('../../mocks/Gladys-2ch2.json');
const EweLinkApi = require('../../mocks/ewelink-api.mock.test');
const EweLinkApiEmpty = require('../../mocks/ewelink-api-empty.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApi,
});
const EwelinkServiceEmpty = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApiEmpty,
});

const gladysWithoutDevices = {
  variable: variableOk,
  event,
  stateManager: stateManagerWith0Devices,
};
const gladysWithThreeDevice = {
  variable: variableOk,
  event,
  stateManager: stateManagerWith3Devices,
};

describe('EweLinkHandler discover', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should found 5 devices, 5 of wich are new unknown devices', async () => {
    const eweLinkService = EwelinkService(gladysWithoutDevices, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.have.deep.members([
      GladysPowDevice,
      GladysOfflineDevice,
      GladysUnhandledDevice,
      Gladys2Ch1Device,
      Gladys2Ch2Device,
    ]);
  });
  it('should found 5 devices, 3 of wich are already in Gladys and 1 are a new unknown device', async () => {
    const eweLinkService = EwelinkService(gladysWithThreeDevice, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.have.deep.members([GladysOfflineDevice, GladysUnhandledDevice]);
  });
  it('should found 0 devices', async () => {
    const eweLinkService = EwelinkServiceEmpty(gladysWithoutDevices, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.have.deep.members([]);
  });
  it('should return not configured error', async () => {
    const gladys = { event, variable: variableNotConfigured };
    const eweLinkService = EwelinkService(gladys, serviceId);
    eweLinkService.device.connected = false;
    try {
      await eweLinkService.device.discover();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: 'Service is not configured',
      });
      expect(error.message).to.equal('eWeLink: Error, service is not configured');
    }
  });
  it('should throw an error and emit a message when AccessToken is no more valid', async () => {
    const gladys = { event, variable: variableOk };
    const eweLinkService = EwelinkService(gladys, serviceId);
    eweLinkService.device.connected = true;
    eweLinkService.device.accessToken = 'NoMoreValidAccessToken';
    try {
      await eweLinkService.device.discover();
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
