const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const load = () =>
  proxyquire('../../../../services/thermostat/lib/thermostat.setVariable', {
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

// The keys under test all name the "living-room" feature, so the handler is
// given a thermostat owning it: a key whose middle segment names no feature of
// this service is refused.
const buildHandler = (devices = [{ features: [{ selector: 'living-room' }] }]) => {
  const {
    setVariable,
    getVariable,
    getFeatureKeys,
    resolveRuntimeVariableKey,
    broadcastConfigUpdated,
    triggerApplySchedules,
  } = load();
  const handler = {
    gladys: {
      variable: { setValue: fake.resolves({ value: 'saved' }), getValue: fake.resolves('comfort') },
      device: { get: fake.resolves(devices) },
      event: { emit: fake.returns(null) },
    },
    serviceId: 'service-id',
    applySchedules: fake.resolves(null),
    featureKeysCache: null,
    setVariable,
    getVariable,
    getFeatureKeys,
    resolveRuntimeVariableKey,
    broadcastConfigUpdated,
    triggerApplySchedules,
  };
  return handler;
};

describe('thermostat.setVariable', () => {
  it('should reject a key outside the THERMOSTAT_ namespace', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.setVariable('SOME_OTHER_VARIABLE', 'x');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('Invalid thermostat variable key');
    assert.notCalled(handler.gladys.variable.setValue);
  });

  it('should persist the variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_PRESET', 'eco');

    assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_LIVING_ROOM_PRESET', 'eco', 'service-id');
  });

  it('should refuse a configuration key: the config lives on the device', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.setVariable('THERMOSTAT_CONFIG_LIVING_ROOM', '{}');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    assert.notCalled(handler.gladys.variable.setValue);
  });

  it('should refuse a key naming a feature this service does not own', async () => {
    // The prefix and the suffix are right, so the shape check passes: without
    // the ownership check this row would be created for a feature that does not
    // exist and would never be cleaned up — postDelete only removes the keys
    // derived from a deleted device's features.
    const handler = buildHandler([{ features: [{ selector: 'living-room' }] }]);

    let error = null;
    try {
      await handler.setVariable('THERMOSTAT_GHOST_ROOM_PRESET', 'eco');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('Invalid thermostat variable key');
    assert.notCalled(handler.gladys.variable.setValue);
  });

  it('should refuse a key with no feature segment at all', async () => {
    // "THERMOSTAT_PRESET" passes the shape check — right prefix, right suffix —
    // but names no feature: the slice between them is empty.
    const handler = buildHandler();

    let error = null;
    try {
      await handler.setVariable('THERMOSTAT_PRESET', 'eco');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('Invalid thermostat variable key');
    assert.notCalled(handler.gladys.device.get);
    assert.notCalled(handler.gladys.variable.setValue);
  });

  it('should refuse the key when no thermostat exists at all', async () => {
    // device.get resolves to null on an empty install, and a device row can be
    // returned without its features: neither may throw on the way to the refusal.
    const handler = buildHandler(null);

    let error = null;
    try {
      await handler.setVariable('THERMOSTAT_LIVING_ROOM_PRESET', 'eco');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('Invalid thermostat variable key');
  });

  it('should refuse the key when a thermostat carries no features', async () => {
    const handler = buildHandler([{ selector: 'thermostat-living-room' }]);

    expect(await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET')).to.equal(null);
  });

  it('should broadcast PRESET_UPDATED for a preset variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_PRESET', 'night');

    const [, message] = handler.gladys.event.emit.firstCall.args;
    expect(message.type).to.equal(WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED);
  });

  it('should broadcast MANUAL_MODE_UPDATED for a manual mode variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_MANUAL_MODE', 'true');

    const [, message] = handler.gladys.event.emit.firstCall.args;
    expect(message.type).to.equal(WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED);
  });

  it('should not broadcast anything for an unrelated thermostat variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL', '123');

    assert.notCalled(handler.gladys.event.emit);
    assert.calledOnce(handler.gladys.variable.setValue);
  });
});

describe('thermostat.getFeatureKeys cache', () => {
  it('should query the devices once across several ownership checks', async () => {
    // A widget fires four or five getVariable/setVariable calls on mount; each
    // one used to be a device query.
    const handler = buildHandler();

    await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET');
    await handler.getVariable('THERMOSTAT_LIVING_ROOM_MANUAL_MODE');
    await handler.getVariable('THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL');
    await handler.setVariable('THERMOSTAT_LIVING_ROOM_MANUAL_SETPOINT', '{"setpoint":21}');

    expect(handler.gladys.device.get.callCount).to.equal(1);
  });

  it('should rebuild the cache once it has been invalidated', async () => {
    const handler = buildHandler();

    await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET');
    expect(handler.gladys.device.get.callCount).to.equal(1);

    handler.featureKeysCache = null;

    await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET');
    expect(handler.gladys.device.get.callCount).to.equal(2);
  });

  it('should cache a refusal too, without re-querying', async () => {
    const handler = buildHandler([{ features: [{ selector: 'kitchen' }] }]);

    expect(await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET')).to.equal(null);
    expect(await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET')).to.equal(null);

    expect(handler.gladys.device.get.callCount).to.equal(1);
  });

  it('should not query the devices at all for a key outside the namespace', async () => {
    // The shape check comes first, so a key that can never be owned costs nothing.
    const handler = buildHandler();

    expect(await handler.getVariable('SOME_OTHER_VARIABLE')).to.equal(null);

    assert.notCalled(handler.gladys.device.get);
  });

  it('should collect the keys of every feature of every thermostat', async () => {
    const handler = buildHandler([
      { features: [{ selector: 'living-room' }, { selector: 'living-room-humidity' }] },
      { features: [{ selector: 'kitchen' }] },
    ]);

    const keys = await handler.getFeatureKeys();

    expect([...keys].sort()).to.deep.equal(['KITCHEN', 'LIVING_ROOM', 'LIVING_ROOM_HUMIDITY']);
  });

  // An external thermostat owns no feature: its runtime state is keyed on the
  // real device's setpoint feature. Without this its preset and its manual hold
  // would be refused as "not owned by this service", and the widget would get a
  // 404 on every read.
  it('should collect the target feature of an external thermostat', async () => {
    const handler = buildHandler([
      { features: [], params: [{ name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' }] },
    ]);

    const keys = await handler.getFeatureKeys();

    expect([...keys]).to.deep.equal(['NETATMO_SETPOINT']);
  });

  it('should accept a runtime key named after an external target feature', async () => {
    const handler = buildHandler([
      { features: [], params: [{ name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' }] },
    ]);

    expect(await handler.resolveRuntimeVariableKey('THERMOSTAT_NETATMO_SETPOINT_PRESET')).to.equal(true);
  });

  it('should ignore a target param left empty', async () => {
    const handler = buildHandler([
      { features: [{ selector: 'living-room' }], params: [{ name: 'THERMOSTAT_TARGET_FEATURE', value: '' }] },
    ]);

    const keys = await handler.getFeatureKeys();

    expect([...keys]).to.deep.equal(['LIVING_ROOM']);
  });

  it('should ignore a device carrying no params at all', async () => {
    const handler = buildHandler([{ features: [{ selector: 'living-room' }] }]);

    const keys = await handler.getFeatureKeys();

    expect([...keys]).to.deep.equal(['LIVING_ROOM']);
  });
});

describe('thermostat.broadcastConfigUpdated', () => {
  it('should tell the dashboards to reload, without carrying the config itself', async () => {
    const handler = buildHandler();

    handler.broadcastConfigUpdated();

    // An empty payload on purpose: the device is the single store, so a copy
    // travelling here could disagree with what the regulation loop reads.
    assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.CONFIG_UPDATED,
      payload: {},
    });
  });
});

describe('thermostat.getVariable', () => {
  it('should read a runtime variable in this service scope', async () => {
    const handler = buildHandler();

    const value = await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET');

    expect(value).to.equal('comfort');
    assert.calledWith(handler.gladys.variable.getValue, 'THERMOSTAT_LIVING_ROOM_PRESET', 'service-id');
  });

  it('should return null for a key naming a feature this service does not own', async () => {
    const handler = buildHandler([{ features: [{ selector: 'living-room' }] }]);

    expect(await handler.getVariable('THERMOSTAT_GHOST_ROOM_PRESET')).to.equal(null);
    assert.notCalled(handler.gladys.variable.getValue);
  });

  it('should return null for a key outside the runtime namespace', async () => {
    const handler = buildHandler();

    expect(await handler.getVariable('THERMOSTAT_CONFIG_LIVING_ROOM')).to.equal(null);
    assert.notCalled(handler.gladys.variable.getValue);
  });
});

describe('thermostat.triggerApplySchedules', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should run applySchedules once after the debounce delay', async () => {
    const handler = buildHandler();

    handler.triggerApplySchedules();
    assert.notCalled(handler.applySchedules);

    await clock.tickAsync(2000);
    assert.calledOnce(handler.applySchedules);
  });

  it('should collapse a burst of calls into a single run', async () => {
    const handler = buildHandler();

    handler.triggerApplySchedules();
    await clock.tickAsync(500);
    handler.triggerApplySchedules();
    await clock.tickAsync(500);
    handler.triggerApplySchedules();

    await clock.tickAsync(2000);
    assert.calledOnce(handler.applySchedules);
  });

  it('should swallow an applySchedules failure', async () => {
    const handler = buildHandler();
    handler.applySchedules = fake.rejects(new Error('boom'));

    handler.triggerApplySchedules();
    await clock.tickAsync(2000);

    assert.calledOnce(handler.applySchedules);
  });
});
