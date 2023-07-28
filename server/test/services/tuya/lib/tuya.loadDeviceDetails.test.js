const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.loadDeviceDetails', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: fake.resolves({ result: { details: 'details' } }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load device details', async () => {
    const devices = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(devices).to.deep.eq({ id: 1, specifications: { details: 'details' } });

    assert.callCount(tuyaHandler.connector.request, 1);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_2}/devices/1/specification`,
    });
  });
});
