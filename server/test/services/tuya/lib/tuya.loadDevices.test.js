const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.loadDevices', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onFirstCall()
        .resolves({ result: { list: [{ id: 1 }], total: 2, has_more: true, last_row_key: 'next' } })
        .onSecondCall()
        .resolves({ result: { list: [{ id: 2 }], total: 2, has_more: false } }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should loop on pages', async () => {
    const devices = await tuyaHandler.loadDevices();

    expect(devices).to.deep.eq([{ id: 1 }, { id: 2 }]);

    assert.callCount(tuyaHandler.connector.request, 2);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION}/devices`,
      query: { last_row_key: null },
    });
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION}/devices`,
      query: { last_row_key: 'next' },
    });
  });
});
