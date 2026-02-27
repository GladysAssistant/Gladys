const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const { STATUS, DEVICE_PARAM_NAME } = require('../../../../services/tuya/lib/utils/tuya.constants');

describe('TuyaHandler.poll', () => {
  it('should poll locally when local override is enabled', async () => {
    const localPollStub = sinon.stub().resolves({ dps: { 1: true } });
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      model: 'Air Conditioner',
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      features: [
        {
          external_id: 'tuya:device1:switch',
          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(localPollStub.calledOnce).to.equal(true);
    expect(connector.request.notCalled).to.equal(true);
    expect(gladys.event.emit.calledOnce).to.equal(true);
  });

  it('should skip unsupported local features', async () => {
    const localPollStub = sinon.stub().resolves({ dps: { 1: true } });
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      model: 'Air Conditioner',
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      features: [
        {
          external_id: 'tuya:device1:unknown',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:switch_1',
          category: 'unknown',
          type: 'unknown',
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(localPollStub.calledOnce).to.equal(true);
    expect(connector.request.notCalled).to.equal(true);
    expect(gladys.event.emit.notCalled).to.equal(true);
  });

  it('should skip cloud poll when not connected and no local config', async () => {
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [],
      features: [],
    };

    await poll.call({ connector, gladys, status: STATUS.ERROR }, device);

    expect(connector.request.notCalled).to.equal(true);
  });

  it('should poll cloud when connected and no local override', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [{ code: 'switch_1', value: true }],
      }),
    };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false }],
      features: [
        {
          external_id: 'tuya:device1:switch_1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(connector.request.calledOnce).to.equal(true);
    expect(gladys.event.emit.calledOnce).to.equal(true);
  });

  it('should convert local temperature values and update unit from local dps', async () => {
    const localPollStub = sinon.stub().resolves({ dps: { 1: true, 2: 68, 3: 15, 105: 'f' } });
    const connector = { request: sinon.fake() };
    const setParamStub = sinon.stub().rejects(new Error('fail'));
    const gladys = { event: { emit: sinon.fake() }, device: { setParam: setParamStub } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      model: 'Air Conditioner',
      device_type: 'air-conditioner',
      properties: { properties: [{ code: 'unit', dp_id: 105 }] },
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
        { name: DEVICE_PARAM_NAME.TEMPERATURE_UNIT, value: DEVICE_FEATURE_UNITS.CELSIUS },
      ],
      features: [
        {
          external_id: 'tuya:device1:temp_set',
          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          max: 300,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:temp_current',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          min: 10,
          max: 20,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:switch',
          category: 'unknown',
          type: 'unknown',
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(localPollStub.calledOnce).to.equal(true);
    expect(connector.request.notCalled).to.equal(true);
    expect(setParamStub.calledOnce).to.equal(true);

    const calls = gladys.event.emit.getCalls().map((call) => call.args[1]);
    expect(
      calls.some((payload) => payload.device_feature_external_id === 'tuya:device1:temp_set' && payload.state === 20),
    ).to.equal(true);
    expect(
      calls.some(
        (payload) => payload.device_feature_external_id === 'tuya:device1:temp_current' && payload.state === 15,
      ),
    ).to.equal(true);
  });

  it('should fallback to cloud after local failure and update cloud unit', async () => {
    const localPollStub = sinon.stub().rejects(new Error('local error'));
    const connector = {
      request: sinon.fake.resolves({
        result: [
          { code: 'unit', value: 'f' },
          { code: 'switch_1', value: true },
          { code: 'temp_current', value: 68 },
        ],
      }),
    };
    const setParamStub = sinon.stub().rejects(new Error('fail'));
    const gladys = { event: { emit: sinon.fake() }, device: { setParam: setParamStub } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      features: [
        {
          external_id: 'tuya:device1:switch_1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:temp_current',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          min: 0,
          max: 300,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:temp_set',
          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.KELVIN,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:unknown',
          category: 'unknown',
          type: 'unknown',
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(localPollStub.calledOnce).to.equal(true);
    expect(connector.request.calledOnce).to.equal(true);
    expect(setParamStub.calledOnce).to.equal(true);

    const calls = gladys.event.emit.getCalls().map((call) => call.args[1]);
    expect(
      calls.some(
        (payload) => payload.device_feature_external_id === 'tuya:device1:temp_current' && payload.state === 20,
      ),
    ).to.equal(true);
  });

  it('should throw when local poll fails in strict mode', async () => {
    const localPollStub = sinon.stub().rejects(new Error('local error'));
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      model: 'Air Conditioner',
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      features: [],
    };

    let thrown = null;
    try {
      await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.instanceof(Error);
    expect(connector.request.notCalled).to.equal(true);
  });

  it('should update cloud unit, skip unknown readers and convert values', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [
          { code: 'unit', value: 'f' },
          { code: 'temp_current', value: 68 },
        ],
      }),
    };
    const setParamStub = sinon.stub().rejects(new Error('fail'));
    const gladys = { event: { emit: sinon.fake() }, device: { setParam: setParamStub } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [{ name: DEVICE_PARAM_NAME.TEMPERATURE_UNIT, value: DEVICE_FEATURE_UNITS.CELSIUS }],
      features: [
        {
          external_id: 'tuya:device1:temp_current',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          min: 0,
          max: 300,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:unknown',
          category: 'unknown',
          type: 'unknown',
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(connector.request.calledOnce).to.equal(true);
    expect(setParamStub.calledOnce).to.equal(true);
    const calls = gladys.event.emit.getCalls().map((call) => call.args[1]);
    expect(
      calls.some(
        (payload) => payload.device_feature_external_id === 'tuya:device1:temp_current' && payload.state === 20,
      ),
    ).to.equal(true);
  });

  it('should keep temperature values when units match and unit property is missing', async () => {
    const localPollStub = sinon.stub().resolves({ dps: { 3: 21 } });
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      device_type: 'air-conditioner',
      properties: { properties: [{ code: 'unit' }] },
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
        { name: DEVICE_PARAM_NAME.TEMPERATURE_UNIT, value: DEVICE_FEATURE_UNITS.CELSIUS },
      ],
      features: [
        {
          external_id: 'tuya:device1:temp_current',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(localPollStub.calledOnce).to.equal(true);
    expect(connector.request.notCalled).to.equal(true);
    const calls = gladys.event.emit.getCalls().map((call) => call.args[1]);
    expect(
      calls.some(
        (payload) => payload.device_feature_external_id === 'tuya:device1:temp_current' && payload.state === 21,
      ),
    ).to.equal(true);
  });

  it('should handle NaN conversion when converting celsius to fahrenheit', async () => {
    const localPollStub = sinon.stub().resolves({ dps: { 2: 20 } });
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
      '../../../utils/units': { celsiusToFahrenheit: () => NaN, fahrenheitToCelsius: () => 0 },
    });

    const device = {
      external_id: 'tuya:device1',
      device_type: 'air-conditioner',
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
        { name: DEVICE_PARAM_NAME.TEMPERATURE_UNIT, value: DEVICE_FEATURE_UNITS.CELSIUS },
      ],
      features: [
        {
          external_id: 'tuya:device1:temp_set',
          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
          unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    const calls = gladys.event.emit.getCalls().map((call) => call.args[1]);
    const payload = calls.find((item) => item.device_feature_external_id === 'tuya:device1:temp_set');
    expect(payload).to.not.equal(undefined);
    expect(Number.isNaN(payload.state)).to.equal(true);
  });

  it('should ignore upsert when params is not an array', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [
          { code: 'unit', value: 'f' },
          { code: 'temp_current', value: 68 },
        ],
      }),
    };
    const setParamStub = sinon.stub().rejects(new Error('fail'));
    const gladys = { event: { emit: sinon.fake() }, device: { setParam: setParamStub } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: {},
      features: [
        {
          external_id: 'tuya:device1:temp_current',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          min: 0,
          max: 300,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(connector.request.calledOnce).to.equal(true);
    expect(setParamStub.calledOnce).to.equal(true);
  });

  it('should not convert temperature when unit is not celsius/fahrenheit', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [{ code: 'temp_current', value: 21.23 }],
      }),
    };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [{ name: DEVICE_PARAM_NAME.TEMPERATURE_UNIT, value: DEVICE_FEATURE_UNITS.CELSIUS }],
      features: [
        {
          external_id: 'tuya:device1:temp_current',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.KELVIN,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    const calls = gladys.event.emit.getCalls().map((call) => call.args[1]);
    const payload = calls.find((item) => item.device_feature_external_id === 'tuya:device1:temp_current');
    expect(payload.state).to.equal(21.23);
  });

  it('should skip conversion when code is missing', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [],
      }),
    };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [],
      features: [
        {
          external_id: 'tuya:device1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(connector.request.calledOnce).to.equal(true);
    expect(gladys.event.emit.notCalled).to.equal(true);
  });

  it('should not emit when state is unchanged', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [{ code: 'switch_1', value: true }],
      }),
    };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [],
      features: [
        {
          external_id: 'tuya:device1:switch_1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 1,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(gladys.event.emit.notCalled).to.equal(true);
  });

  it('should not emit when state is null or undefined', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [{ code: 'temp_current', value: null }],
      }),
    };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [{ name: DEVICE_PARAM_NAME.TEMPERATURE_UNIT, value: DEVICE_FEATURE_UNITS.CELSIUS }],
      features: [
        {
          external_id: 'tuya:device1:temp_current',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(gladys.event.emit.notCalled).to.equal(true);
  });
});
