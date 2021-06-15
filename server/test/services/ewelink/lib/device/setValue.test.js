const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { event, serviceId, variableOk } = require('../../mocks/consts.test');
const Gladys2ChDevice = require('../../mocks/Gladys-2ch.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const EweLinkApiMock = require('../../mocks/ewelink-api.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApiMock,
});

const gladys = {
  event,
  variable: variableOk,
};

describe('EweLinkHandler setValue', () => {
  const eweLinkService = EwelinkService(gladys, serviceId);
  const functionToTest = sinon.spy(EweLinkApiMock.prototype, 'setDevicePowerState');

  beforeEach(() => {
    sinon.reset();
    eweLinkService.device.connected = false;
    eweLinkService.device.accessToken = '';
    eweLinkService.device.apiKey = '';
  });

  it('should set the binary value of the channel 1 of the "2CH" device to 1', async () => {
    await eweLinkService.device.setValue(
      GladysPowDevice,
      { external_id: 'ewelink:10004533ae:power:1', category: 'switch', type: 'binary' },
      1,
    );
    assert.calledWith(functionToTest, '10004533ae', 'on', 1);
  });
  it('should set the binary value of the channel 2 of the "2CH" device to 0', async () => {
    await eweLinkService.device.setValue(
      Gladys2ChDevice,
      { external_id: 'ewelink:10004531ae:power:2', category: 'switch', type: 'binary' },
      0,
    );
    assert.calledWith(functionToTest, '10004531ae', 'off', 2);
  });
  it('should do nothing because of the feature type is not handled yet', async () => {
    await eweLinkService.device.setValue(
      GladysPowDevice,
      { external_id: 'ewelink:10004533ae:power:1', category: 'switch', type: 'not_handled' },
      1,
    );
    assert.notCalled(functionToTest);
  });
  it('should throw an error when device is offline', async () => {
    try {
      await eweLinkService.device.setValue(
        GladysOfflineDevice,
        { external_id: 'ewelink:10004532ae:power:1', category: 'switch', type: 'binary' },
        1,
      );
      assert.fail();
    } catch (error) {
      assert.notCalled(functionToTest);
      expect(error.message).to.equal('eWeLink: Error, device is not currently online');
    }
  });
  it('should throw an error when AccessToken is no more valid', async () => {
    eweLinkService.device.connected = true;
    eweLinkService.device.accessToken = 'NoMoreValidAccessToken';
    try {
      await eweLinkService.device.setValue(
        Gladys2ChDevice,
        { external_id: 'ewelink:10004531ae:power:2', category: 'switch', type: 'binary' },
        1,
      );
      assert.fail();
    } catch (error) {
      assert.notCalled(functionToTest);
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
