const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
  THERMOSTAT_PRESET,
} = require('../../../../utils/constants');

const state = proxyquire('../../../../services/thermostat/lib/thermostat.state', {
  '../../../utils/logger': {
    debug: fake.returns(null),
    info: fake.returns(null),
    warn: fake.returns(null),
  },
});

const modeFeature = (lastValue) => ({
  selector: 'living-room:mode',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
  last_value: lastValue,
});
const presetFeature = (lastValue) => ({
  selector: 'living-room:preset',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
  last_value: lastValue,
});
const operatingStateFeature = (lastValue) => ({
  selector: 'living-room:operating-state',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE,
  last_value: lastValue,
});

const buildHandler = () => ({
  gladys: {
    device: { saveState: fake.resolves(null), setParam: fake.resolves(null) },
    event: { emit: fake.returns(null) },
  },
});

describe('thermostat.state presets', () => {
  it('should map a value to its preset name', () => {
    expect(state.presetName(THERMOSTAT_PRESET.COMFORT)).to.equal('comfort');
    expect(state.presetName(String(THERMOSTAT_PRESET.SCHEDULE))).to.equal('schedule');
  });

  it('should return null for a value that names no preset', () => {
    expect(state.presetName(null)).to.equal(null);
    expect(state.presetName(undefined)).to.equal(null);
    expect(state.presetName('')).to.equal(null);
    expect(state.presetName(42)).to.equal(null);
  });

  it('should map a preset name to its value', () => {
    expect(state.presetValue('frost')).to.equal(THERMOSTAT_PRESET.FROST);
  });

  it('should return null for a name that is not a preset', () => {
    // `off` is a mode, not a preset: it has no place in the enum.
    expect(state.presetValue('off')).to.equal(null);
    expect(state.presetValue(null)).to.equal(null);
  });

  it('should read the preset a thermostat carries', () => {
    expect(state.getPreset({ features: [presetFeature(THERMOSTAT_PRESET.ECO)] })).to.equal('eco');
  });

  it('should return null when the device carries no preset feature', () => {
    expect(state.getPreset({ features: [] })).to.equal(null);
    expect(state.getPreset({})).to.equal(null);
    expect(state.getPreset(null)).to.equal(null);
  });
});

describe('thermostat.state isStopped', () => {
  it('should report a thermostat switched off', () => {
    expect(state.isStopped({ features: [modeFeature(THERMOSTAT_MODE.OFF)] })).to.equal(true);
  });

  it('should report a running thermostat', () => {
    expect(state.isStopped({ features: [modeFeature(THERMOSTAT_MODE.HEATING)] })).to.equal(false);
    expect(state.isStopped({ features: [modeFeature(THERMOSTAT_MODE.COOLING)] })).to.equal(false);
  });

  it('should report a device with no mode feature as running', () => {
    // An external thermostat carries no mode of its own: it is never stopped
    // through this path.
    expect(state.isStopped({ features: [] })).to.equal(false);
    expect(state.isStopped({})).to.equal(false);
    expect(state.isStopped(null)).to.equal(false);
  });
});

describe('thermostat.state savePreset', () => {
  afterEach(() => sinon.restore());

  it('should write the preset and broadcast it', async () => {
    const handler = buildHandler();
    const device = { selector: 'living-room', features: [presetFeature(THERMOSTAT_PRESET.SCHEDULE)] };

    const written = await state.savePreset.call(handler, device, 'away');

    expect(written).to.equal(true);
    assert.calledWith(handler.gladys.device.saveState, device.features[0], THERMOSTAT_PRESET.AWAY);
    assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED,
      payload: { device: 'living-room', preset: 'away' },
    });
  });

  it('should skip a preset the thermostat already carries', async () => {
    const handler = buildHandler();
    const device = { selector: 'living-room', features: [presetFeature(THERMOSTAT_PRESET.AWAY)] };

    const written = await state.savePreset.call(handler, device, 'away');

    // Saving an unchanged state would tell every open widget to redraw for nothing.
    expect(written).to.equal(false);
    assert.notCalled(handler.gladys.device.saveState);
  });

  it('should push an unchanged preset back when forced', async () => {
    const handler = buildHandler();
    const device = { selector: 'living-room', features: [presetFeature(THERMOSTAT_PRESET.AWAY)] };

    // When a hold ends, the widgets display the held preset while the stored one
    // never moved: they need it pushed back even though nothing changed here.
    const written = await state.savePreset.call(handler, device, 'away', true);

    expect(written).to.equal(true);
    assert.calledOnce(handler.gladys.device.saveState);
  });

  it('should do nothing when the device carries no preset feature', async () => {
    const handler = buildHandler();

    expect(await state.savePreset.call(handler, { features: [] }, 'away')).to.equal(false);
    assert.notCalled(handler.gladys.device.saveState);
  });

  it('should do nothing for a name that is not a preset', async () => {
    const handler = buildHandler();
    const device = { selector: 'living-room', features: [presetFeature(THERMOSTAT_PRESET.SCHEDULE)] };

    expect(await state.savePreset.call(handler, device, 'off')).to.equal(false);
    assert.notCalled(handler.gladys.device.saveState);
  });
});

describe('thermostat.state operating state', () => {
  afterEach(() => sinon.restore());

  it('should write the operating state', async () => {
    const handler = buildHandler();
    const device = { features: [operatingStateFeature(THERMOSTAT_OPERATING_STATE.IDLE)] };

    await state.saveOperatingState.call(handler, device, THERMOSTAT_OPERATING_STATE.HEATING);

    assert.calledWith(handler.gladys.device.saveState, device.features[0], THERMOSTAT_OPERATING_STATE.HEATING);
  });

  it('should skip a state the device already carries', async () => {
    const handler = buildHandler();
    const device = { features: [operatingStateFeature(THERMOSTAT_OPERATING_STATE.HEATING)] };

    await state.saveOperatingState.call(handler, device, THERMOSTAT_OPERATING_STATE.HEATING);

    assert.notCalled(handler.gladys.device.saveState);
  });

  it('should do nothing on a device with no operating-state feature', async () => {
    const handler = buildHandler();

    await state.saveOperatingState.call(handler, { features: [] }, THERMOSTAT_OPERATING_STATE.HEATING);

    assert.notCalled(handler.gladys.device.saveState);
  });
});

describe('thermostat.state manual hold', () => {
  afterEach(() => sinon.restore());

  const held = (setpoint, until) => ({
    selector: 'living-room',
    params: [
      { name: 'THERMOSTAT_MANUAL_SETPOINT', value: setpoint },
      ...(until === undefined ? [] : [{ name: 'THERMOSTAT_MANUAL_UNTIL', value: until }]),
    ],
  });

  it('should read a hold with its expiry', () => {
    expect(state.getManualHold(held('21.5', '1700000000000'))).to.deep.equal({
      setpoint: 21.5,
      until: 1700000000000,
    });
  });

  it('should read a permanent hold', () => {
    // Without a schedule the hold never expires, like on a physical thermostat.
    expect(state.getManualHold(held('21.5', ''))).to.deep.equal({ setpoint: 21.5, until: null });
    expect(state.getManualHold(held('21.5'))).to.deep.equal({ setpoint: 21.5, until: null });
  });

  it('should report no hold when none is armed', () => {
    expect(state.getManualHold(held(''))).to.equal(null);
    expect(state.getManualHold({ params: [] })).to.equal(null);
    expect(state.getManualHold({})).to.equal(null);
    expect(state.getManualHold(null)).to.equal(null);
  });

  it('should ignore a malformed setpoint rather than regulate on NaN', () => {
    expect(state.getManualHold(held('not-a-number'))).to.equal(null);
  });

  it('should ignore a malformed expiry and treat the hold as permanent', () => {
    expect(state.getManualHold(held('21', 'soon'))).to.deep.equal({ setpoint: 21, until: null });
  });

  it('should arm a hold and broadcast it', async () => {
    const handler = buildHandler();
    const device = { selector: 'living-room' };

    await state.setManualHold.call(handler, device, 21.5, 1700000000000);

    assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MANUAL_SETPOINT', '21.5');
    assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MANUAL_UNTIL', '1700000000000');
    assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
      payload: { device: 'living-room', setpoint: 21.5, until: 1700000000000 },
    });
  });

  it('should arm a permanent hold with an empty expiry', async () => {
    const handler = buildHandler();

    await state.setManualHold.call(handler, { selector: 'living-room' }, 21.5, null);

    assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_UNTIL', '');
  });

  it('should clear a hold and broadcast it', async () => {
    const handler = buildHandler();
    const device = { selector: 'living-room' };

    await state.clearManualHold.call(handler, device);

    assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MANUAL_SETPOINT', '');
    assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MANUAL_UNTIL', '');
    assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
      payload: { device: 'living-room', setpoint: null, until: null },
    });
  });
});

describe('thermostat.state broadcasts', () => {
  afterEach(() => sinon.restore());

  it('should tell open dashboards to reload a thermostat configuration', () => {
    const handler = buildHandler();

    state.broadcastConfigUpdated.call(handler);

    assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.CONFIG_UPDATED,
      payload: {},
    });
  });

  it('should run a debounced regulation pass', async () => {
    const clock = sinon.useFakeTimers();
    const handler = { applyTimer: null, applySchedules: fake.resolves(null) };

    state.triggerApplySchedules.call(handler);
    await clock.tickAsync(2000);

    assert.calledOnce(handler.applySchedules);
    expect(handler.applyTimer).to.equal(null);
  });

  it('should collapse a burst of calls into a single run', async () => {
    const clock = sinon.useFakeTimers();
    const handler = { applyTimer: null, applySchedules: fake.resolves(null) };

    state.triggerApplySchedules.call(handler);
    state.triggerApplySchedules.call(handler);
    state.triggerApplySchedules.call(handler);
    await clock.tickAsync(2000);

    assert.calledOnce(handler.applySchedules);
  });

  it('should swallow a failing regulation pass', async () => {
    const clock = sinon.useFakeTimers();
    const handler = { applyTimer: null, applySchedules: fake.rejects(new Error('boom')) };

    state.triggerApplySchedules.call(handler);

    // A failing debounced pass must not bring an unhandled rejection down on the
    // process: the next minute tick retries anyway.
    await clock.tickAsync(2000);
    assert.calledOnce(handler.applySchedules);
  });
});
