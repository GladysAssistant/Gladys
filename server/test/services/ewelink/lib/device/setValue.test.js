const { expect } = require('chai');
const sinon = require('sinon');

const { NotFoundError } = require('../../../../../utils/coreErrors');
const EwelinkHandler = require('../../../../../services/ewelink/lib');

const { SERVICE_ID, EWELINK_DENIED_ACCESS_TOKEN } = require('../constants');
const Gladys2ChDevice = require('../payloads/Gladys-2ch.json');
const GladysOfflineDevice = require('../payloads/Gladys-offline.json');
const GladysPowDevice = require('../payloads/Gladys-pow.json');
const EweLinkApiMock = require('../ewelink-api.mock.test');

const { assert } = sinon;

describe('eWeLinkHandler setValue', () => {
  let eWeLinkHandler;
  const functionToTest = sinon.spy(EweLinkApiMock.Device.prototype, 'setThingStatus');

  beforeEach(() => {
    const gladys = {};
    eWeLinkHandler = new EwelinkHandler(gladys, EweLinkApiMock, SERVICE_ID);
    eWeLinkHandler.ewelinkWebAPIClient = new EweLinkApiMock.WebAPI();
    eWeLinkHandler.status = { configured: true, connected: true };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should set the binary value of the channel 1 of the "2CH" device to 1', async () => {
    await eWeLinkHandler.setValue(
      GladysPowDevice,
      { external_id: 'ewelink:10004533ae:power:1', category: 'switch', type: 'binary' },
      1,
    );
    assert.calledOnceWithExactly(functionToTest, 1, '10004533ae', { switch: 'on' });
  });
  it('should set the binary value of the channel 2 of the "2CH" device to 0', async () => {
    await eWeLinkHandler.setValue(
      Gladys2ChDevice,
      { external_id: 'ewelink:10004531ae:power:2', category: 'switch', type: 'binary' },
      0,
    );
    assert.calledOnceWithExactly(functionToTest, 1, '10004531ae', { switches: [{ outlet: 2, switch: 'off' }] });
  });
  it('should do nothing because of the feature type is not handled yet', async () => {
    await eWeLinkHandler.setValue(
      GladysPowDevice,
      { external_id: 'ewelink:10004533ae:power:1', category: 'switch', type: 'not_handled' },
      1,
    );
    assert.notCalled(functionToTest);
  });
  it('should throw an error when device is offline', async () => {
    try {
      await eWeLinkHandler.setValue(
        GladysOfflineDevice,
        { external_id: 'ewelink:10004532ae:power:1', category: 'switch', type: 'binary' },
        1,
      );
      assert.fail();
    } catch (error) {
      assert.calledOnceWithExactly(functionToTest, 1, '10004532ae', { switch: 'on' });
      expect(error).instanceOf(NotFoundError);
      expect(error.message).to.equal('eWeLink: Error, device is not currently online');
    }
  });
  it('should throw an error when AccessToken is no more valid', async () => {
    eWeLinkHandler.ewelinkWebAPIClient.at = EWELINK_DENIED_ACCESS_TOKEN;
    try {
      await eWeLinkHandler.setValue(
        Gladys2ChDevice,
        { external_id: 'ewelink:10004531ae:power:2', category: 'switch', type: 'binary' },
        1,
      );
      assert.fail();
    } catch (error) {
      assert.calledOnceWithExactly(functionToTest, 1, '10004531ae', { switches: [{ outlet: 2, switch: 'on' }] });
      expect(error).instanceOf(Error);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
