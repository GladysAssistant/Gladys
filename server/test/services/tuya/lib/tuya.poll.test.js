const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { TuyaContext } = require('../tuya.mock.test');

const { assert, fake } = sinon;

const connect = proxyquire('../../../../services/tuya/lib/tuya.connect', {
  '@tuya/tuya-connector-nodejs': { TuyaContext },
});
const TuyaHandler = proxyquire('../../../../services/tuya/lib/index', {
  './tuya.connect.js': connect,
});
const { EVENTS } = require('../../../../utils/constants');
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { emitLocalDpsStates } = require('../../../../services/tuya/lib/tuya.poll');

const { BadParameters } = require('../../../../utils/coreErrors');

const gladys = {
  variable: {
    getValue: sinon.stub(),
  },
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.poll', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onFirstCall()
        .resolves({
          result: [{ code: 'switch_1', value: true }],
          total: 1,
          has_more: true,
          last_row_key: 'next',
        }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error (should starts with "tuya:")', async () => {
    try {
      await tuyaHandler.poll({
        external_id: 'test:device',
        features: [
          {
            external_id: 'tuya:feature',
            category: 'light',
            type: 'binary',
          },
        ],
      });
      expect.fail('Expected BadParameters to be thrown');
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('Tuya device external_id is invalid: "test:device" should starts with "tuya:"');
    }
  });

  it('should throw an error (have no network indicator)', async () => {
    try {
      await tuyaHandler.poll({
        external_id: 'tuya',
        features: [
          {
            external_id: 'tuya:feature',
            category: 'light',
            type: 'binary',
          },
        ],
      });
      expect.fail('Expected BadParameters to be thrown');
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('Tuya device external_id is invalid: "tuya" have no network indicator');
    }
  });

  it('should return without throwing when final cloud poll fails', async () => {
    tuyaHandler.connector.request = sinon.stub().rejects(new Error('cloud failed'));
    const logger = {
      debug: sinon.stub(),
      warn: sinon.stub(),
    };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    await poll.call(tuyaHandler, {
      external_id: 'tuya:device',
      features: [
        {
          external_id: 'tuya:device:switch_1',
          category: 'light',
          type: 'binary',
        },
      ],
    });

    assert.callCount(logger.warn, 1);
    expect(logger.warn.firstCall.args[0]).to.include('cloud poll failed');
    assert.callCount(gladys.event.emit, 0);
  });

  it('change state of device feature', async () => {
    await tuyaHandler.poll({
      external_id: 'tuya:device',
      features: [
        {
          external_id: 'tuya:device:switch_1',
          category: 'light',
          type: 'binary',
        },
      ],
    });

    assert.callCount(tuyaHandler.connector.request, 1);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/device/status`,
    });

    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tuya:device:switch_1',
      state: 1,
    });
  });
  it('should skip cloud feature when code is missing from payload', async () => {
    await tuyaHandler.poll({
      external_id: 'tuya:device',
      features: [
        {
          external_id: 'tuya:device:missing_code',
          category: 'light',
          type: 'binary',
        },
      ],
    });

    assert.callCount(tuyaHandler.connector.request, 1);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/device/status`,
    });
    assert.callCount(gladys.event.emit, 0);
  });

  it('should continue cloud poll when one reader throws', async () => {
    tuyaHandler.connector.request = sinon.stub().resolves({
      result: [
        { code: 'colour_data', value: '{' },
        { code: 'switch_1', value: true },
      ],
    });
    const logger = {
      debug: sinon.stub(),
      warn: sinon.stub(),
    };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    await poll.call(tuyaHandler, {
      external_id: 'tuya:device',
      features: [
        {
          external_id: 'tuya:device:colour_data',
          category: 'light',
          type: 'color',
        },
        {
          external_id: 'tuya:device:switch_1',
          category: 'light',
          type: 'binary',
        },
      ],
    });

    assert.callCount(logger.warn, 1);
    expect(logger.warn.firstCall.args[0]).to.include('reader failed');
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tuya:device:switch_1',
      state: 1,
    });
  });

  it('should read cloud values from thing shadow when strategy is shadow', async () => {
    tuyaHandler.connector.request = sinon.stub().resolves({
      result: {
        properties: [{ code: 'power_a', value: 706 }],
      },
    });

    await tuyaHandler.poll({
      external_id: 'tuya:device',
      params: [{ name: 'CLOUD_STRATEGY', value: 'shadow' }],
      features: [
        {
          external_id: 'tuya:device:power_a',
          category: 'energy-sensor',
          type: 'power',
          scale: 1,
        },
      ],
    });

    assert.callCount(tuyaHandler.connector.request, 1);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_2_0}/thing/device/shadow/properties`,
    });
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tuya:device:power_a',
      state: 70.6,
    });
  });

  it('should return without cloud request when feature list is empty', async () => {
    await tuyaHandler.poll({
      external_id: 'tuya:device',
      features: [],
    });

    assert.callCount(tuyaHandler.connector.request, 0);
    assert.callCount(gladys.event.emit, 0);
  });
});

describe('TuyaHandler.poll with local mapping', () => {
  it('should use local dps and skip cloud when all features are mapped', async () => {
    const localPoll = sinon.stub().resolves({ dps: { 1: true } });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });

    const context = {
      connector: {
        request: sinon.stub(),
      },
      gladys: {
        event: {
          emit: sinon.stub(),
        },
      },
    };

    await poll.call(context, {
      external_id: 'tuya:device',
      params: [
        { name: 'IP_ADDRESS', value: '1.1.1.1' },
        { name: 'LOCAL_KEY', value: 'key' },
        { name: 'PROTOCOL_VERSION', value: '3.3' },
        { name: 'LOCAL_OVERRIDE', value: true },
      ],
      features: [
        {
          external_id: 'tuya:device:switch_1',
          category: 'switch',
          type: 'binary',
        },
      ],
    });

    expect(localPoll.calledOnce).to.equal(true);
    expect(context.connector.request.called).to.equal(false);
    expect(context.gladys.event.emit.calledOnce).to.equal(true);
  });

  it('should fallback to cloud for unmapped local feature', async () => {
    const localPoll = sinon.stub().resolves({ dps: { 1: true } });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });

    const request = sinon.stub().resolves({
      result: [{ code: 'countdown', value: true }],
    });
    const emit = sinon.stub();

    await poll.call(
      {
        connector: { request },
        gladys: {
          event: { emit },
        },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'IP_ADDRESS', value: '1.1.1.1' },
          { name: 'LOCAL_KEY', value: 'key' },
          { name: 'PROTOCOL_VERSION', value: '3.3' },
          { name: 'LOCAL_OVERRIDE', value: true },
        ],
        features: [
          {
            external_id: 'tuya:device:countdown',
            category: 'switch',
            type: 'binary',
          },
        ],
      },
    );

    expect(localPoll.calledOnce).to.equal(true);
    expect(request.calledOnce).to.equal(true);
    expect(emit.calledOnce).to.equal(true);
  });

  it('should use state manager cached value to detect local OFF changes', async () => {
    const localPoll = sinon
      .stub()
      .onFirstCall()
      .resolves({ dps: { 1: true } })
      .onSecondCall()
      .resolves({ dps: { 1: false } });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });

    let cachedValue = 0;
    const emit = sinon.stub().callsFake((eventType, payload) => {
      if (eventType === EVENTS.DEVICE.NEW_STATE) {
        cachedValue = payload.state;
      }
    });

    const context = {
      connector: {
        request: sinon.stub(),
      },
      gladys: {
        event: {
          emit,
        },
        stateManager: {
          get: sinon.stub().callsFake((entity, selector) => {
            if (entity === 'deviceFeature' && selector === 'tuya-device-switch-1') {
              return { last_value: cachedValue };
            }
            return null;
          }),
        },
      },
    };

    const device = {
      external_id: 'tuya:device',
      params: [
        { name: 'IP_ADDRESS', value: '1.1.1.1' },
        { name: 'LOCAL_KEY', value: 'key' },
        { name: 'PROTOCOL_VERSION', value: '3.3' },
        { name: 'LOCAL_OVERRIDE', value: true },
      ],
      features: [
        {
          external_id: 'tuya:device:switch_1',
          selector: 'tuya-device-switch-1',
          category: 'switch',
          type: 'binary',
          last_value: 0,
        },
      ],
    };

    await poll.call(context, device);
    await poll.call(context, device);

    expect(localPoll.calledTwice).to.equal(true);
    expect(emit.calledTwice).to.equal(true);
    expect(emit.firstCall.args[1].state).to.equal(1);
    expect(emit.secondCall.args[1].state).to.equal(0);
  });

  it('should emit same cloud value only after heartbeat interval', async () => {
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {});

    const request = sinon.stub().resolves({
      result: [{ code: 'switch_1', value: false }],
    });

    const clock = sinon.useFakeTimers(new Date('2026-02-27T08:00:00.000Z').getTime());
    try {
      const cachedState = {
        last_value: 0,
        last_value_changed: new Date(clock.now).toISOString(),
      };
      const emit = sinon.stub().callsFake((eventType, payload) => {
        if (eventType === EVENTS.DEVICE.NEW_STATE) {
          cachedState.last_value = payload.state;
          cachedState.last_value_changed = new Date(clock.now).toISOString();
        }
      });

      const context = {
        connector: { request },
        gladys: {
          event: { emit },
          stateManager: {
            get: sinon.stub().callsFake((entity, selector) => {
              if (entity === 'deviceFeature' && selector === 'tuya-device-switch-1') {
                return cachedState;
              }
              return null;
            }),
          },
        },
      };

      const device = {
        external_id: 'tuya:device',
        params: [{ name: 'LOCAL_OVERRIDE', value: false }],
        features: [
          {
            external_id: 'tuya:device:switch_1',
            selector: 'tuya-device-switch-1',
            category: 'switch',
            type: 'binary',
            last_value: 0,
            last_value_changed: new Date(clock.now).toISOString(),
          },
        ],
      };

      await poll.call(context, device);
      expect(emit.called).to.equal(false);

      clock.tick(2 * 60 * 1000);
      await poll.call(context, device);
      expect(emit.called).to.equal(false);

      clock.tick(60 * 1000 + 1);
      await poll.call(context, device);
      expect(emit.calledOnce).to.equal(true);
      expect(emit.firstCall.args[1].state).to.equal(0);
    } finally {
      clock.restore();
    }
  });
});

describe('TuyaHandler.poll additional branch coverage', () => {
  it('should not throw when features payload is not an array', async () => {
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: true }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [{ name: 'LOCAL_OVERRIDE', value: false }],
        features: null,
      },
    );

    expect(request.called).to.equal(false);
    expect(emit.called).to.equal(false);
  });

  it('should warn and return when cloud connector is unavailable', async () => {
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: null,
        gladys: { event: { emit: sinon.stub() } },
      },
      {
        external_id: 'tuya:device',
        params: [{ name: 'LOCAL_OVERRIDE', value: false }],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(logger.warn.calledOnce).to.equal(true);
  });

  it('should ignore malformed cloud status entries', async () => {
    const request = sinon
      .stub()
      .resolves({ result: [null, 'bad', { value: true }, { code: 'switch_1', value: true }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [{ name: 'LOCAL_OVERRIDE', value: false }],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(request.calledOnce).to.equal(true);
    expect(emit.calledOnce).to.equal(true);
    expect(emit.firstCall.args[1].state).to.equal(1);
  });

  it('should skip cloud features when code or reader is missing', async () => {
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: true }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [{ name: 'LOCAL_OVERRIDE', value: false }],
        features: [
          { category: 'switch', type: 'binary' },
          { external_id: 'invalid', category: 'switch', type: 'binary' },
          { external_id: 'tuya:device:switch_1' },
          { external_id: 'tuya:device:switch_1', category: 'unknown', type: 'binary' },
        ],
      },
    );

    expect(request.calledOnce).to.equal(true);
    expect(emit.called).to.equal(false);
  });

  it('should warn when local mode is enabled with incomplete config', async () => {
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: false }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'LOCAL_OVERRIDE', value: true },
          { name: 'IP_ADDRESS', value: '1.1.1.1' },
        ],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(logger.warn.calledOnce).to.equal(true);
    expect(request.calledOnce).to.equal(true);
  });

  it('should warn and fallback to cloud when local payload has no dps object', async () => {
    const localPoll = sinon.stub().resolves({});
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: true }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'IP_ADDRESS', value: '1.1.1.1' },
          { name: 'LOCAL_KEY', value: 'key' },
          { name: 'PROTOCOL_VERSION', value: '3.3' },
          { name: 'LOCAL_OVERRIDE', value: true },
        ],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(localPoll.calledOnce).to.equal(true);
    expect(request.calledOnce).to.equal(true);
    expect(logger.warn.calledOnce).to.equal(true);
    expect(logger.warn.firstCall.args[0]).to.include('invalid DPS payload');
  });

  it('should fallback to cloud when local dps value is undefined', async () => {
    const localPoll = sinon.stub().resolves({ dps: { 1: undefined } });
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: true }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'IP_ADDRESS', value: '1.1.1.1' },
          { name: 'LOCAL_KEY', value: 'key' },
          { name: 'PROTOCOL_VERSION', value: '3.3' },
          { name: 'LOCAL_OVERRIDE', value: true },
        ],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(localPoll.calledOnce).to.equal(true);
    expect(request.calledOnce).to.equal(true);
  });

  it('should warn and fallback to cloud when local reader throws', async () => {
    const localPoll = sinon.stub().resolves({ dps: { 1: true } });
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: false }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
      '../../../utils/logger': logger,
      './device/tuya.deviceMapping': {
        readValues: {
          switch: {
            binary: (value) => {
              if (value === true) {
                throw new Error('bad local value');
              }
              return 0;
            },
          },
        },
      },
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'IP_ADDRESS', value: '1.1.1.1' },
          { name: 'LOCAL_KEY', value: 'key' },
          { name: 'PROTOCOL_VERSION', value: '3.3' },
          { name: 'LOCAL_OVERRIDE', value: true },
        ],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(localPoll.calledOnce).to.equal(true);
    expect(request.calledOnce).to.equal(true);
    expect(logger.warn.calledOnce).to.equal(true);
    expect(logger.warn.firstCall.args[0]).to.include('local reader failed');
    expect(emit.calledOnce).to.equal(true);
    expect(emit.firstCall.args[1].state).to.equal(0);
  });

  it('should warn when cloud fallback fails after local success', async () => {
    const localPoll = sinon.stub().resolves({ dps: { 1: true } });
    const request = sinon.stub().rejects(new Error('cloud down'));
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'IP_ADDRESS', value: '1.1.1.1' },
          { name: 'LOCAL_KEY', value: 'key' },
          { name: 'PROTOCOL_VERSION', value: '3.3' },
          { name: 'LOCAL_OVERRIDE', value: true },
        ],
        features: [
          { external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' },
          { external_id: 'tuya:device:countdown', category: 'switch', type: 'binary' },
        ],
      },
    );

    expect(localPoll.calledOnce).to.equal(true);
    expect(logger.warn.calledOnce).to.equal(true);
    expect(emit.calledOnce).to.equal(true);
  });

  it('should warn and fallback to cloud when local poll throws', async () => {
    const localPoll = sinon.stub().rejects(new Error('local down'));
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: true }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
      '../../../utils/logger': logger,
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'IP_ADDRESS', value: '1.1.1.1' },
          { name: 'LOCAL_KEY', value: 'key' },
          { name: 'PROTOCOL_VERSION', value: '3.3' },
          { name: 'LOCAL_OVERRIDE', value: true },
        ],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(localPoll.calledOnce).to.equal(true);
    expect(request.calledOnce).to.equal(true);
    expect(logger.warn.calledOnce).to.equal(true);
  });

  it('should emit same value when last_value_changed is missing or invalid', async () => {
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: false }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
    });

    const context = {
      connector: { request },
      gladys: {
        event: { emit },
        stateManager: {
          get: sinon
            .stub()
            .onFirstCall()
            .returns({ last_value: 0 })
            .onSecondCall()
            .returns({ last_value: 0, last_value_changed: 'not-a-date' }),
        },
      },
    };

    const device = {
      external_id: 'tuya:device',
      params: [{ name: 'LOCAL_OVERRIDE', value: false }],
      features: [{ external_id: 'tuya:device:switch_1', selector: 'switch-1', category: 'switch', type: 'binary' }],
    };

    await poll.call(context, device);
    await poll.call(context, device);

    expect(emit.calledTwice).to.equal(true);
  });

  it('should skip emit when transformed value is null', async () => {
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: true }] });
    const emit = sinon.stub();
    const logger = { debug: sinon.stub(), warn: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
      './device/tuya.deviceMapping': {
        readValues: {
          switch: {
            binary: () => null,
          },
        },
      },
    });

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
      },
      {
        external_id: 'tuya:device',
        params: [{ name: 'LOCAL_OVERRIDE', value: false }],
        features: [{ external_id: 'tuya:device:switch_1', category: 'switch', type: 'binary' }],
      },
    );

    expect(emit.called).to.equal(false);
  });

  it('should skip cloud fallback silently when LOCAL_OVERRIDE=true and connector is unavailable', async () => {
    const localPollStub = sinon.stub().rejects(new Error('local fail'));
    const logger = { debug: sinon.stub(), warn: sinon.stub(), info: sinon.stub() };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      '../../../utils/logger': logger,
      './tuya.localPoll': { localPoll: localPollStub },
    });

    await poll.call(
      {
        connector: null,
        gladys: { event: { emit: sinon.stub() } },
      },
      {
        external_id: 'tuya:device',
        params: [
          { name: 'LOCAL_OVERRIDE', value: true },
          { name: 'IP_ADDRESS', value: '10.0.0.2' },
          { name: 'LOCAL_KEY', value: 'key' },
          { name: 'PROTOCOL_VERSION', value: '3.3' },
        ],
        features: [
          {
            external_id: 'tuya:device:switch_1',
            selector: 'tuya-device-switch-1',
            category: 'switch',
            type: 'binary',
          },
        ],
      },
    );

    // Local poll throws → fallback would normally hit pollCloudFeatures, but
    // connector is null. The skip block must log a single debug line with
    // `cloud_unavailable` in the fallback reason and not warn (the cloud-direct
    // path keeps the warn so a missing connector remains visible there).
    const debugMessages = logger.debug.getCalls().map((c) => c.args[0]);
    expect(debugMessages.some((msg) => msg && msg.includes('fallback=local_poll_failed+cloud_unavailable'))).to.equal(
      true,
    );
    const warnConnectorMessages = logger.warn
      .getCalls()
      .map((c) => c.args[0])
      .filter((msg) => msg && msg.includes('connector unavailable'));
    expect(warnConnectorMessages.length).to.equal(0);
  });
});

describe('TuyaHandler.poll degraded backoff', () => {
  const buildDevice = () => ({
    external_id: 'tuya:device-degraded',
    params: [
      { name: 'IP_ADDRESS', value: '1.1.1.1' },
      { name: 'LOCAL_KEY', value: 'key' },
      { name: 'PROTOCOL_VERSION', value: '3.3' },
      { name: 'LOCAL_OVERRIDE', value: true },
    ],
    features: [{ external_id: 'tuya:device-degraded:switch_1', category: 'switch', type: 'binary' }],
  });

  it('should skip local and use cloud when device is in degraded backoff', async () => {
    const localPoll = sinon.stub().resolves({ dps: { 1: true } });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });
    const request = sinon.stub().resolves({ result: [{ code: 'switch_1', value: true }] });
    const emit = sinon.stub();

    await poll.call(
      {
        connector: { request },
        gladys: { event: { emit } },
        degradedDevices: {
          'device-degraded': { status: 'degraded', until: Date.now() + 60000, failureTimestamps: [] },
        },
      },
      buildDevice(),
    );

    expect(localPoll.called).to.equal(false);
    expect(request.calledOnce).to.equal(true);
  });

  it('should record local failure on ECONNRESET so subsequent polls reach the threshold', async () => {
    const localPoll = sinon.stub().rejects(Object.assign(new Error('connect ECONNRESET'), { code: 'ECONNRESET' }));
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });
    const request = sinon.stub().resolves({ result: [] });
    const emit = sinon.stub();
    const degradedDevices = {};

    const ctx = {
      connector: { request },
      gladys: { event: { emit } },
      degradedDevices,
    };
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await poll.call(ctx, buildDevice());
    }
    expect(degradedDevices['device-degraded']).to.not.equal(undefined);
    expect(degradedDevices['device-degraded'].status).to.equal('degraded');
  });

  it('should clear degraded entry on successful local poll', async () => {
    const localPoll = sinon.stub().resolves({ dps: { 1: true } });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });
    const degradedDevices = {
      'device-degraded': { status: 'ok', until: 0, failureTimestamps: [1, 2] },
    };

    await poll.call(
      {
        connector: { request: sinon.stub() },
        gladys: { event: { emit: sinon.stub() } },
        degradedDevices,
      },
      buildDevice(),
    );

    expect(degradedDevices['device-degraded']).to.equal(undefined);
  });
});

describe('TuyaHandler.poll temperature conversion', () => {
  // Real scenario: a feature was created while the thermostat reported one unit,
  // then the user switched the device to the other unit. On the next poll the
  // device unit (temp_unit_convert) differs from the feature unit, so Gladys must
  // convert the reading to keep the feature consistent.
  const pollThermostat = async (statusResult, feature) => {
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {});
    const request = sinon.stub().resolves({ result: statusResult });
    const emit = sinon.stub();
    await poll.call(
      { connector: { request }, gladys: { event: { emit } } },
      {
        external_id: 'tuya:thermostat',
        params: [{ name: 'LOCAL_OVERRIDE', value: false }],
        features: [feature],
      },
    );
    return emit.getCalls().find((call) => call.args[0] === EVENTS.DEVICE.NEW_STATE);
  };

  it('should convert temp_current from Fahrenheit to the feature Celsius unit', async () => {
    const stateEvent = await pollThermostat(
      [
        { code: 'temp_current', value: 680 },
        { code: 'temp_unit_convert', value: 'f' },
      ],
      {
        external_id: 'tuya:thermostat:temp_current',
        category: 'temperature-sensor',
        type: 'decimal',
        unit: 'celsius',
        scale: 1,
      },
    );

    expect(stateEvent).to.not.equal(undefined);
    // 680 -> scale 1 -> 68 °F -> fahrenheitToCelsius(68) = 20 °C
    expect(stateEvent.args[1].state).to.equal(20);
  });

  it('should convert temp_set from Celsius to the feature Fahrenheit unit', async () => {
    const stateEvent = await pollThermostat(
      [
        { code: 'temp_set', value: 200 },
        { code: 'temp_unit_convert', value: 'c' },
      ],
      {
        external_id: 'tuya:thermostat:temp_set',
        category: 'thermostat',
        type: 'target-temperature',
        unit: 'fahrenheit',
        scale: 1,
      },
    );

    expect(stateEvent).to.not.equal(undefined);
    // 200 -> scale 1 -> 20 °C -> celsiusToFahrenheit(20) = 68 °F -> round(68) = 68
    expect(stateEvent.args[1].state).to.equal(68);
  });

  it('should keep the raw temp_current when the converted value falls out of the feature range', async () => {
    // Firmware inconsistency guard: the device advertises Fahrenheit but the
    // temp_current value is already Celsius. Converting would push it out of the
    // feature's [min, max] range while the raw value is inside it, so Gladys
    // keeps the raw reading instead of double-converting.
    const stateEvent = await pollThermostat(
      [
        { code: 'temp_current', value: 20 },
        { code: 'temp_unit_convert', value: 'f' },
      ],
      {
        external_id: 'tuya:thermostat:temp_current',
        category: 'temperature-sensor',
        type: 'decimal',
        unit: 'celsius',
        scale: 0,
        min: 5,
        max: 35,
      },
    );

    expect(stateEvent).to.not.equal(undefined);
    // fahrenheitToCelsius(20) = -6.7 (out of [5, 35]) while raw 20 is in range -> keep 20
    expect(stateEvent.args[1].state).to.equal(20);
  });
});

describe('emitLocalDpsStates temperature transform (local + push regression)', () => {
  // Regression: the persistent-push handler and the local poll both go through emitLocalDpsStates.
  // It must apply the SAME temperature transform as the cloud path (scale + unit conversion), not the
  // raw feature reader. Before the fix a pushed/local temp_current emitted the raw °F reading instead
  // of the feature's °C value.
  it('converts a pushed local temp_current DPS to the feature unit instead of emitting the raw reader value', () => {
    const emit = sinon.stub();
    const gladysStub = { event: { emit } };
    const device = {
      external_id: 'tuya:therm',
      device_type: 'pilot-thermostat',
      // temp_unit_convert lives on DPS 9 in this fixture and reports Fahrenheit.
      properties: { properties: [{ code: 'temp_unit_convert', dp_id: 9 }] },
      features: [
        {
          external_id: 'tuya:therm:temp_current',
          selector: 'tuya-therm-temp-current',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          scale: 1,
        },
      ],
    };

    // DPS 116 = temp_current (pilot-thermostat local mapping), 680 -> scale 1 -> 68 °F.
    const { handledCodes, changed } = emitLocalDpsStates(gladysStub, device, { 116: 680, 9: 'f' });

    expect(handledCodes.has('temp_current')).to.equal(true);
    expect(changed).to.equal(1);
    const stateEvent = emit.getCalls().find((call) => call.args[0] === EVENTS.DEVICE.NEW_STATE);
    expect(stateEvent).to.not.equal(undefined);
    // 680 -> scale 1 -> 68 °F -> fahrenheitToCelsius(68) = 20 °C (the raw-reader path would emit 68).
    expect(stateEvent.args[1].state).to.equal(20);
  });

  it('derives the temperature unit from the caller when provided', () => {
    const emit = sinon.stub();
    const gladysStub = { event: { emit } };
    const device = {
      external_id: 'tuya:therm',
      device_type: 'pilot-thermostat',
      features: [
        {
          external_id: 'tuya:therm:temp_current',
          selector: 'tuya-therm-temp-current',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          scale: 1,
        },
      ],
    };

    // No unit property on the device: the local poll passes the resolved unit explicitly.
    const { handledCodes } = emitLocalDpsStates(gladysStub, device, { 116: 680 }, 'fahrenheit');

    expect(handledCodes.has('temp_current')).to.equal(true);
    const stateEvent = emit.getCalls().find((call) => call.args[0] === EVENTS.DEVICE.NEW_STATE);
    expect(stateEvent).to.not.equal(undefined);
    expect(stateEvent.args[1].state).to.equal(20);
  });
});
