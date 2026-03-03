/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const sinon = require('sinon');
const proxyquire = require('proxyquire')
  .noCallThru()
  .noPreserveCache();

const { assert, fake } = sinon;

const { expect } = require('chai');
const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API, DEVICE_PARAM_NAME } = require('../../../../services/tuya/lib/utils/tuya.constants');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
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
      {
        specifications: {
          functions: [{ code: 'switch_0' }],
        },
      },
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
    const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

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

  it('should call local tuyapi-newgen for protocol 3.5', async () => {
    const connect = sinon.stub().resolves();
    const set = sinon.stub().resolves();
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      throw new Error('tuyapi should not be used for protocol 3.5');
    }
    function TuyAPINewGenStub() {
      this.connect = connect;
      this.set = set;
      this.disconnect = disconnect;
    }
    const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': TuyAPINewGenStub,
    });

    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.5' },
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

  it('should call local tuyapi with switch code', async () => {
    const connect = sinon.stub().resolves();
    const set = sinon.stub().resolves();
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.set = set;
      this.disconnect = disconnect;
    }
    const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

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
      external_id: 'tuya:device:switch',
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

  it('should fallback to cloud when local override is false', async () => {
    const connect = sinon.stub().resolves();
    const set = sinon.stub().resolves();
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.set = set;
      this.disconnect = disconnect;
    }
    const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.CLOUD_IP, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: 'false' },
      ],
      specifications: {
        functions: [{ code: 'switch_1' }],
      },
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

    expect(connect.called).to.equal(false);
    expect(ctx.connector.request.calledOnce).to.equal(true);
  });

  it('should convert thermostat target temperature to device unit before sending', async () => {
    const device = {
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false }],
      properties: {
        properties: [{ code: 'temp_unit_convert', value: 'f' }],
      },
      specifications: {
        functions: [{ code: 'temp_set' }],
      },
    };
    const deviceFeature = {
      external_id: 'tuya:device:temp_set',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      scale: 1,
    };

    const ctx = {
      connector: { request: sinon.stub().resolves({ success: true }) },
      gladys: {},
    };

    await tuyaHandler.setValue.call(ctx, device, deviceFeature, 20);

    expect(ctx.connector.request.calledOnce).to.equal(true);
    expect(ctx.connector.request.firstCall.args[0]).to.deep.equal({
      method: 'POST',
      path: `${API.VERSION_1_0}/devices/device/commands`,
      body: { commands: [{ code: 'temp_set', value: 680 }] },
    });
  });

  it('should fallback to mapping scale for thermostat target temperature when feature scale is missing', async () => {
    const device = {
      device_type: 'pilot-thermostat',
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false }],
      properties: {
        properties: [{ code: 'temp_unit_convert', value: 'c' }],
      },
      specifications: {
        functions: [{ code: 'temp_set' }],
      },
    };
    const deviceFeature = {
      external_id: 'tuya:device:temp_set',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
    };

    const ctx = {
      connector: { request: sinon.stub().resolves({ success: true }) },
      gladys: {},
    };

    await tuyaHandler.setValue.call(ctx, device, deviceFeature, 20);

    expect(ctx.connector.request.calledOnce).to.equal(true);
    expect(ctx.connector.request.firstCall.args[0]).to.deep.equal({
      method: 'POST',
      path: `${API.VERSION_1_0}/devices/device/commands`,
      body: { commands: [{ code: 'temp_set', value: 200 }] },
    });
  });

  it('should write through thing shadow when strategy is shadow', async () => {
    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false },
        { name: DEVICE_PARAM_NAME.CLOUD_STRATEGY, value: 'shadow' },
      ],
    };
    const deviceFeature = {
      external_id: 'tuya:device:child_lock',
      category: DEVICE_FEATURE_CATEGORIES.CHILD_LOCK,
      type: DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY,
    };

    const ctx = {
      connector: { request: sinon.stub().resolves({ success: true }) },
      gladys: {},
    };

    await tuyaHandler.setValue.call(ctx, device, deviceFeature, 1);

    expect(ctx.connector.request.calledOnce).to.equal(true);
    expect(ctx.connector.request.firstCall.args[0]).to.deep.equal({
      method: 'POST',
      path: `${API.VERSION_2_0}/thing/device/shadow/properties/issue`,
      body: { properties: JSON.stringify({ child_lock: true }) },
    });
  });

  it('should fallback to cloud when dps is not mapped', async () => {
    const connect = sinon.stub().resolves();
    const set = sinon.stub().resolves();
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.set = set;
      this.disconnect = disconnect;
    }
    const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.CLOUD_IP, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      specifications: {
        functions: [{ code: 'countdown' }],
      },
    };
    const deviceFeature = {
      external_id: 'tuya:device:countdown',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };

    const ctx = {
      connector: { request: sinon.stub().resolves({}) },
      gladys: {},
    };

    await setValue.call(ctx, device, deviceFeature, 1);

    expect(connect.called).to.equal(false);
    expect(ctx.connector.request.calledOnce).to.equal(true);
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
    const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.CLOUD_IP, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      specifications: {
        functions: [{ code: 'switch_1' }],
      },
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

  it('should throw when command is empty', async () => {
    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
    };
    const deviceFeature = {
      external_id: 'tuya:device:',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };

    const ctx = {
      connector: { request: sinon.stub().resolves({}) },
      gladys: {},
    };

    try {
      await tuyaHandler.setValue.call(ctx, device, deviceFeature, 1);
      expect.fail('Expected setValue to throw');
    } catch (error) {
      expect(error.message).to.include('have no command');
    }
    expect(ctx.connector.request.called).to.equal(false);
  });

  it('should throw when cloud command is rejected', async () => {
    const device = {
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false }],
      specifications: {
        functions: [{ code: 'child_lock' }],
      },
    };
    const deviceFeature = {
      external_id: 'tuya:device:child_lock',
      category: DEVICE_FEATURE_CATEGORIES.CHILD_LOCK,
      type: DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY,
    };

    const ctx = {
      connector: {
        request: sinon.stub().resolves({ success: false, msg: 'command or value not support' }),
      },
      gladys: {},
    };

    try {
      await tuyaHandler.setValue.call(ctx, device, deviceFeature, 1);
      expect.fail('Expected setValue to throw');
    } catch (error) {
      expect(error.message).to.include('command or value not support');
    }
  });

  it('should poll feedback when cloud command is rejected', async () => {
    const device = {
      external_id: 'tuya:device',
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false }],
      specifications: {
        functions: [{ code: 'child_lock' }],
      },
    };
    const deviceFeature = {
      external_id: 'tuya:device:child_lock',
      category: DEVICE_FEATURE_CATEGORIES.CHILD_LOCK,
      type: DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY,
    };

    const ctx = {
      connector: {
        request: sinon.stub().resolves({ success: false, msg: 'command or value not support' }),
      },
      gladys: {},
      feedbackPollDelayMs: 0,
      poll: sinon.stub().resolves(),
    };

    try {
      await tuyaHandler.setValue.call(ctx, device, deviceFeature, 1);
      expect.fail('Expected setValue to throw');
    } catch (error) {
      expect(error.message).to.include('command or value not support');
    }

    expect(ctx.poll.calledOnceWithExactly(device)).to.equal(true);
  });

  it('should reject when the selected cloud strategy command fails', async () => {
    const device = {
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false }],
    };
    const deviceFeature = {
      external_id: 'tuya:device:child_lock',
      category: DEVICE_FEATURE_CATEGORIES.CHILD_LOCK,
      type: DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY,
    };

    const ctx = {
      connector: {
        request: sinon.stub(),
      },
      gladys: {},
    };

    try {
      await tuyaHandler.setValue.call(ctx, device, deviceFeature, 1);
      expect.fail('Expected setValue to throw');
    } catch (error) {
      expect(error.message).to.include('command rejected');
    }
    expect(ctx.connector.request.calledOnce).to.equal(true);
  });

  it('should log disconnect failures and still return on local success', async () => {
    const connect = sinon.stub().resolves();
    const set = sinon.stub().resolves();
    const disconnect = sinon.stub().rejects(new Error('disconnect error'));
    function TuyAPIStub() {
      this.connect = connect;
      this.set = set;
      this.disconnect = disconnect;
    }
    const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '10.0.0.2' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
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
});
