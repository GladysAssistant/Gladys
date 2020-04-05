const chai = require('chai');
const sinon = require('sinon');
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const proxyquire = require('proxyquire').noCallThru();
const {
  serviceId,
  event,
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

chai.use(deepEqualInAnyOrder);
const { expect } = chai;
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

describe('EwelinkHandler discover', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should found 5 devices, 5 of wich are new unknown devices', async () => {
    const eweLinkService = EwelinkService(gladysWithoutDevices, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.deep.equalInAnyOrder([
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
    expect(newDevices).to.deep.equalInAnyOrder([GladysOfflineDevice, GladysUnhandledDevice]);
  });
  it('should found 0 devices', async () => {
    const eweLinkService = EwelinkServiceEmpty(gladysWithoutDevices, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.deep.equalInAnyOrder([]);
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
      assert.calledOnceWithExactly(gladys.event.emit, 'websocket.send-all', {
        type: 'ewelink.error',
        payload: 'Authentication error',
      });
      expect(error.status).to.equal(401);
      expect(error.message).to.equal('EWeLink error: Authentication error');
    }
  });
});
