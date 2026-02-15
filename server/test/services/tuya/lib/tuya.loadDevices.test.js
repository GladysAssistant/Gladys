const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {
  variable: {
    getValue: fake.resolves('APP_ACCOUNT_UID'),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.loadDevices', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onFirstCall()
        .resolves({ result: { list: [{ id: 1 }], has_more: true } })
        .onSecondCall()
        .resolves({ result: { list: [{ id: 2 }], has_more: false } }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should loop on pages', async () => {
    const devices = await tuyaHandler.loadDevices(1, 1);

    expect(devices).to.deep.eq([{ id: 1 }, { id: 2 }]);

    assert.callCount(tuyaHandler.connector.request, 2);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.PUBLIC_VERSION_1_0}/users/APP_ACCOUNT_UID/devices`,
      query: { page_no: 1, page_size: 1 },
    });
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.PUBLIC_VERSION_1_0}/users/APP_ACCOUNT_UID/devices`,
      query: { page_no: 2, page_size: 1 },
    });
  });
});
