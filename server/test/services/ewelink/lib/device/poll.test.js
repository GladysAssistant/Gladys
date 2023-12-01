const { expect } = require('chai');
const sinon = require('sinon');

const { EVENTS } = require('../../../../../utils/constants');
const EwelinkHandler = require('../../../../../services/ewelink/lib');

const { SERVICE_ID, EWELINK_DENIED_ACCESS_TOKEN } = require('../constants');
const Gladys2ChDevice = require('../payloads/Gladys-2ch.json');
const GladysBasicDevice = require('../payloads/Gladys-Basic.json');
const GladysOfflineDevice = require('../payloads/Gladys-offline.json');
const GladysPowDevice = require('../payloads/Gladys-pow.json');
const GladysThDevice = require('../payloads/Gladys-th.json');
const EweLinkApiMock = require('../ewelink-api.mock.test');

const { assert, fake } = sinon;

describe('eWeLinkHandler poll', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
    };

    eWeLinkHandler = new EwelinkHandler(gladys, EweLinkApiMock, SERVICE_ID);
    eWeLinkHandler.ewelinkClient = new EweLinkApiMock.WebAPI();
    eWeLinkHandler.status = { configured: true, connected: true };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should poll device and emit 2 states for a "2CH" model', async () => {
    await eWeLinkHandler.poll(Gladys2ChDevice);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWithExactly(gladys.event.emit.getCall(0), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004531ae:binary:1',
      state: 1,
    });
    assert.calledWithExactly(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004531ae:binary:2',
      state: 0,
    });
  });
  it('should poll device and emit 1 state for a "POW" device', async () => {
    await eWeLinkHandler.poll(GladysPowDevice);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004533ae:binary:1',
      state: 1,
    });
  });
  it('should poll device and emit 3 states for a "TH" model', async () => {
    await eWeLinkHandler.poll(GladysThDevice);
    assert.callCount(gladys.event.emit, 3);
    assert.calledWithExactly(gladys.event.emit.getCall(0), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:binary:1',
      state: 1,
    });
    assert.calledWithExactly(gladys.event.emit.getCall(1), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:humidity',
      state: 42,
    });
    assert.calledWithExactly(gladys.event.emit.getCall(2), EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:10004534ae:temperature',
      state: 20,
    });
  });
  it('should poll device and update 2 params for a "Basic" model', async () => {
    // this check that some values are set on the device, and will be changed
    expect(GladysBasicDevice.params).to.deep.equal([
      { name: 'IP_ADDRESS', value: '192.168.0.6' },
      { name: 'FIRMWARE', value: '3.1.2' },
      { name: 'ONLINE', value: '0' },
    ]);
    await eWeLinkHandler.poll(GladysBasicDevice);
    assert.notCalled(gladys.event.emit);
    expect(GladysBasicDevice.params).to.deep.equal([
      { name: 'IP_ADDRESS', value: '192.168.0.6' },
      { name: 'FIRMWARE', value: '3.3.0' },
      { name: 'ONLINE', value: '1' },
    ]);
  });
  it('should throw an error when device is offline', async () => {
    try {
      await eWeLinkHandler.poll(GladysOfflineDevice);
      assert.fail();
    } catch (error) {
      expect(error.message).to.equal('eWeLink: Error, device is not currently online');
    }
  });
  it('should throw an error when AccessToken is no more valid', async () => {
    eWeLinkHandler.ewelinkClient.at = EWELINK_DENIED_ACCESS_TOKEN;
    try {
      await eWeLinkHandler.poll(Gladys2ChDevice);
      assert.fail();
    } catch (error) {
      expect(error).instanceOf(Error);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
