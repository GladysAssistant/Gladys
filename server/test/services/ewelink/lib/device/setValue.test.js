const { expect } = require('chai');
const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { serviceId, event, variableOk } = require('../../mocks/consts.test');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const EweLinkApi = require('../../mocks/ewelink-api.mock.test');

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApi,
});

const gladys = {
  event,
  variable: variableOk,
};

describe('EweLinkHandler setValue', () => {
  const eweLinkService = EwelinkService(gladys, serviceId);

  beforeEach(() => {
    eweLinkService.device.connected = false;
    eweLinkService.device.accessToken = '';
    eweLinkService.device.apiKey = '';
  });

  it('should set binary value of the device with 1 feature', async () => {
    await eweLinkService.device.setValue(Gladys2Ch1Device, { category: 'switch', type: 'binary' }, 1);
  });
  it('should set binary value of the device with 2 features', async () => {
    await eweLinkService.device.setValue(GladysPowDevice, { category: 'switch', type: 'binary' }, 1);
  });
  it('should do nothing because of the feature type is not handled yet', async () => {
    await eweLinkService.device.setValue(GladysPowDevice, { category: 'switch', type: 'not_handled' }, 1);
  });
  it('should throw an error when device is offline', async () => {
    try {
      await eweLinkService.device.setValue(GladysOfflineDevice, { category: 'switch', type: 'binary' }, 1);
      assert.fail();
    } catch (error) {
      expect(error.message).to.equal('eWeLink: Error, device is not currently online');
    }
  });
  it('should throw an error when AccessToken is no more valid', async () => {
    eweLinkService.device.connected = true;
    eweLinkService.device.accessToken = 'NoMoreValidAccessToken';
    try {
      await eweLinkService.device.setValue(Gladys2Ch1Device, { category: 'switch', type: 'binary' }, 1);
      assert.fail();
    } catch (error) {
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
