const sinon = require('sinon');

const EwelinkHandler = require('../../../../../services/ewelink/lib');

const { SERVICE_ID } = require('../constants');
const Gladys2ChDevice = require('../payloads/Gladys-2ch.json');
const GladysPowDevice = require('../payloads/Gladys-pow.json');
const EweLinkApiMock = require('../ewelink-api.mock.test');

const { assert } = sinon;

describe('eWeLinkHandler setValue', () => {
  let eWeLinkHandler;
  const functionToTest = sinon.spy(EweLinkApiMock.Connect.prototype, 'updateState');

  beforeEach(() => {
    const gladys = {};
    eWeLinkHandler = new EwelinkHandler(gladys, EweLinkApiMock, SERVICE_ID);
    eWeLinkHandler.ewelinkWebSocketClient = new EweLinkApiMock.Ws();
    eWeLinkHandler.status = { configured: true, connected: true };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should set the binary value of the single channel of the "pow" device to 1', async () => {
    await eWeLinkHandler.setValue(
      GladysPowDevice,
      { external_id: 'ewelink:10004533ae:power:1', category: 'switch', type: 'binary' },
      1,
    );
    assert.calledOnceWithExactly(functionToTest, '10004533ae', { switch: 'on' });
  });

  it('should set the binary value of the channel 2 of the "2CH" device to 0', async () => {
    await eWeLinkHandler.setValue(
      Gladys2ChDevice,
      { external_id: 'ewelink:10004531ae:power:2', category: 'switch', type: 'binary' },
      0,
    );
    assert.calledOnceWithExactly(functionToTest, '10004531ae', { switches: [{ outlet: 1, switch: 'off' }] });
  });

  it('should do nothing because of the feature type is not handled yet', async () => {
    await eWeLinkHandler.setValue(
      GladysPowDevice,
      { external_id: 'ewelink:10004533ae:power:1', category: 'switch', type: 'not_handled' },
      1,
    );
    assert.notCalled(functionToTest);
  });
});
