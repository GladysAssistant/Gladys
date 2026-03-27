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
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { EVENTS } = require('../../../../utils/constants');

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
});
