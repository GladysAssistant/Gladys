const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const { expect } = require('chai');
const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API, DEVICE_PARAM_NAME } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.setValue', () => {
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

  it('should throw an error (should starts with "tuya:")', async () => {
    try {
      await tuyaHandler.setValue(
        {},
        {
          external_id: 'test:uuid:switch_0',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
        1,
      );
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal(
        'Tuya device external_id is invalid: "test:uuid:switch_0" should starts with "tuya:"',
      );
    }
  });

  it('should throw an error (have no network indicator)', async () => {
    try {
      await tuyaHandler.setValue(
        {},
        {
          external_id: 'tuya:',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
        1,
      );
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('Tuya device external_id is invalid: "tuya:" have no network indicator');
    }
  });

  it('should call tuya api', async () => {
    await tuyaHandler.setValue(
      {},
      {
        external_id: 'tuya:uuid:switch_0',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      },
      1,
    );

    assert.callCount(tuyaHandler.connector.request, 1);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'POST',
      path: `${API.VERSION_1_0}/devices/uuid/commands`,
      body: { commands: [{ code: 'switch_0', value: true }] },
    });
  });

  it('should call local tuyapi when local params are set', async () => {
    const connect = sinon.stub().resolves();
    const set = sinon.stub().resolves();
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.set = set;
      this.disconnect = disconnect;
    }
    const setValue = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
    }).setValue;

    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.CLOUD_IP, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
    };
    const deviceFeature = {
      external_id: 'tuya:device:switch_1',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };

    const ctx = {
      connector: { request: sinon.stub() },
      gladys: {},
    };

    await setValue.call(ctx, device, deviceFeature, 1);

    expect(connect.calledOnce).to.equal(true);
    expect(set.calledOnce).to.equal(true);
    expect(disconnect.calledOnce).to.equal(true);
    expect(ctx.connector.request.called).to.equal(false);
  });

  it('should fallback to cloud when local call fails', async () => {
    const connect = sinon.stub().rejects(new Error('local error'));
    const set = sinon.stub().resolves();
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.set = set;
      this.disconnect = disconnect;
    }
    const setValue = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
    }).setValue;

    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.CLOUD_IP, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
    };
    const deviceFeature = {
      external_id: 'tuya:device:switch_1',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };

    const ctx = {
      connector: { request: sinon.stub().resolves({}) },
      gladys: {},
    };

    await setValue.call(ctx, device, deviceFeature, 1);

    expect(ctx.connector.request.calledOnce).to.equal(true);
  });
});
