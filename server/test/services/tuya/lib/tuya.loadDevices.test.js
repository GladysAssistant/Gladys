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
    gladys.variable.getValue = fake.resolves('APP_ACCOUNT_UID');
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

  it('should loop on pages with array result', async () => {
    tuyaHandler.connector.request = sinon
      .stub()
      .onFirstCall()
      .resolves({ result: [{ id: 1 }] })
      .onSecondCall()
      .resolves({ result: [] });

    const devices = await tuyaHandler.loadDevices(1, 1);

    expect(devices).to.deep.eq([{ id: 1 }]);
    assert.callCount(tuyaHandler.connector.request, 2);
  });

  it('should throw on invalid pageNo', async () => {
    try {
      await tuyaHandler.loadDevices(0, 1);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('pageNo must be a positive integer');
    }
  });

  it('should throw on invalid pageSize', async () => {
    try {
      await tuyaHandler.loadDevices(1, 0);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('pageSize must be a positive integer');
    }
  });

  it('should throw on api error response', async () => {
    tuyaHandler.connector.request = sinon.stub().resolves({
      success: false,
      msg: 'Tuya error',
    });

    try {
      await tuyaHandler.loadDevices(1, 1);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('Tuya error');
    }
  });

  it('should throw on empty api response', async () => {
    tuyaHandler.connector.request = sinon.stub().resolves(null);

    try {
      await tuyaHandler.loadDevices(1, 1);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('Tuya API returned no response');
    }
  });

  it('should throw when app account uid is missing', async () => {
    gladys.variable.getValue = sinon.fake.resolves(null);

    try {
      await tuyaHandler.loadDevices(1, 1);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('Tuya APP_ACCOUNT_UID is missing');
    }
  });

  it('should throw when pagination does not advance', async () => {
    tuyaHandler.connector.request = sinon.stub().resolves({
      result: { list: [], has_more: true },
    });

    try {
      await tuyaHandler.loadDevices(1, 1);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('Tuya API pagination did not advance (has_more=true with empty page)');
    }
  });
});
