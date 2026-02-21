const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');
const logger = require('../../../../utils/logger');

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.loadDeviceDetails', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onFirstCall()
        .resolves({ result: { details: 'specification' } })
        .onSecondCall()
        .resolves({ result: { local_key: 'localKey' } }),
    };
  });

  afterEach(() => {
    sinon.reset();
    if (logger.warn.restore) {
      logger.warn.restore();
    }
  });

  it('should load device details', async () => {
    const devices = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(devices).to.deep.eq({ id: 1, local_key: 'localKey', specifications: { details: 'specification' } });

    assert.callCount(tuyaHandler.connector.request, 2);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/1/specification`,
    });
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/1`,
    });
  });

  it('should warn when specifications loading fails', async () => {
    const warnStub = sinon.stub(logger, 'warn');
    tuyaHandler.connector.request = sinon
      .stub()
      .onFirstCall()
      .rejects(new Error('spec failure'))
      .onSecondCall()
      .resolves({ result: { local_key: 'localKey' } });

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device).to.deep.eq({ id: 1, local_key: 'localKey', specifications: {} });
    expect(warnStub.calledOnce).to.equal(true);
    expect(warnStub.firstCall.args[0]).to.match(/Failed to load specifications/);
  });

  it('should warn when details loading fails', async () => {
    const warnStub = sinon.stub(logger, 'warn');
    tuyaHandler.connector.request = sinon
      .stub()
      .onFirstCall()
      .resolves({ result: { details: 'specification' } })
      .onSecondCall()
      .rejects(new Error('details failure'));

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device).to.deep.eq({ id: 1, specifications: { details: 'specification' } });
    expect(warnStub.calledOnce).to.equal(true);
    expect(warnStub.firstCall.args[0]).to.match(/Failed to load details/);
  });
});
