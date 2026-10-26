const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  PILOT_WIRE_MODE,
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
  THERMOSTAT_PRESET,
} = require('../../../../utils/constants');
const { getCurrentDayAndMinutes } = require('../../../../utils/thermostatSchedule');

const todayDow = getCurrentDayAndMinutes(new Date(), 'Europe/Paris').dayOfWeek;

// A single point at 00:00 today: it is the last transition at or before now
// whatever the time of day, so the whole day carries this preset.
const fullDaySchedule = (preset) => ({
  selector: 'my-schedule',
  transitions: [{ day_of_week: todayDow, time: '00:00', preset }],
});

const load = (schedule) =>
  proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
    '../../../models': {
      ThermostatScheduleDevice: {
        findOne: fake.resolves(schedule ? { schedule } : null),
        count: fake.resolves(schedule ? 1 : 0),
      },
      ThermostatSchedule: {},
      ThermostatScheduleTransition: {},
    },
    './thermostat.scheduleDevice': { followsSchedule: fake.resolves(Boolean(schedule)) },
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const setpointFeature = () => ({
  selector: 'thermostat-living-room',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
});
const operatingStateFeature = () => ({
  selector: 'thermostat-living-room:operating-state',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE,
  last_value: null,
});
const presetFeature = (preset) => ({
  selector: 'thermostat-living-room:preset',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
  last_value: THERMOSTAT_PRESET[preset.toUpperCase()],
});

const buildGladys = ({ order = PILOT_WIRE_MODE.OFF, windowOpen = false, temp = 18, supported = undefined } = {}) => {
  const setValue = fake.resolves(null);
  return {
    device: {
      get: fake((query) => {
        const selector = query && query.device_feature_selectors;
        if (selector === 'heater-pilot-wire') {
          return Promise.resolve([
            {
              selector: 'heater',
              features: [{ selector: 'heater-pilot-wire', last_value: order, supported_options: supported }],
            },
          ]);
        }
        if (selector === 'window-sensor') {
          return Promise.resolve([
            { selector: 'window', features: [{ selector: 'window-sensor', last_value: windowOpen ? 0 : 1 }] },
          ]);
        }
        if (selector === 'temp-sensor') {
          return Promise.resolve([{ selector: 'sensor', features: [{ selector: 'temp-sensor', last_value: temp }] }]);
        }
        return Promise.resolve([]);
      }),
      setValue,
      saveState: fake.resolves(null),
      setParam: fake.resolves(null),
    },
    variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
    event: { emit: fake.returns(null) },
  };
};

const params = (map) => Object.keys(map).map((name) => ({ name, value: map[name] }));

const pilotWireDevice = (preset, extra = {}) => ({
  id: 'device-id',
  selector: 'living-room',
  features: [setpointFeature(), presetFeature(preset), operatingStateFeature()],
  params: params({
    THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire',
    THERMOSTAT_MODE: 'heating',
    ...extra,
  }),
});

// A virtual thermostat with a room sensor: Gladys regulates on it (C.1.1).
const gladysRegulates = { THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor' };
// A pilot-wire thermostat: the heater regulates, and the sensor is only displayed.
const heaterRegulates = { ...gladysRegulates, THERMOSTAT_TYPE: 'pilot-wire' };

// A manual hold, as setValue arms it: picking a preset by hand holds that
// preset's setpoint, and a turn of the dial holds any value.
const held = (setpoint) => ({ THERMOSTAT_MANUAL_SETPOINT: String(setpoint), THERMOSTAT_MANUAL_UNTIL: '' });

const savedOperatingStates = (gladys) =>
  gladys.device.saveState
    .getCalls()
    .filter((call) => call.args[0].type === DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE)
    .map((call) => call.args[1]);

const regulate = async (mod, gladys, device) => mod.regulateDevice(gladys, device, todayDow, 12 * 60);

describe('thermostat pilot wire', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should send the order the preset maps to', async () => {
    const mod = load(null);
    const gladys = buildGladys();

    await regulate(mod, gladys, pilotWireDevice('comfort'));

    const [, feature, value] = gladys.device.setValue.firstCall.args;
    expect(feature.selector).to.equal('heater-pilot-wire');
    expect(value).to.equal(PILOT_WIRE_MODE.COMFORT);
  });

  it('should map frost onto frost protection', async () => {
    const mod = load(null);
    const gladys = buildGladys();

    await regulate(mod, gladys, pilotWireDevice('frost'));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION);
  });

  it('should send each preset its default order', async () => {
    // Away is frost protection, as nobody is home; night is eco.
    const cases = [
      ['away', PILOT_WIRE_MODE.FROST_PROTECTION],
      ['eco', PILOT_WIRE_MODE.ECO],
      ['night', PILOT_WIRE_MODE.ECO],
    ];
    await Promise.all(
      cases.map(async ([preset, order]) => {
        const mod = load(null);
        const gladys = buildGladys();

        await regulate(mod, gladys, pilotWireDevice(preset));

        expect(gladys.device.setValue.firstCall.args[2], preset).to.equal(order);
      }),
    );
  });

  it('should send the order a preset is set to', async () => {
    const mod = load(null);
    const gladys = buildGladys();

    await regulate(mod, gladys, pilotWireDevice('night', { THERMOSTAT_PILOT_WIRE_ORDER_NIGHT: '2' }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should send the off order rather than cutting a supply it does not hold', async () => {
    // `off` is a mode rather than a preset, so it reaches the heater through a
    // schedule transition — the one place the value is still accepted.
    const mod = load(fullDaySchedule('off'));
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('schedule'));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.OFF);
  });

  it('should skip an order the heater already carries', async () => {
    // Several of these heaters are Zigbee: re-sending an unchanged order once a
    // minute is traffic for nothing.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('comfort'));

    assert.notCalled(gladys.device.setValue);
  });

  // Frost protection rather than off, as the external path writes the frost
  // setpoint: off also turns the heater's own frost guard off.
  it('should put the heater on frost protection when a window opens', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, windowOpen: true });

    await regulate(mod, gladys, pilotWireDevice('comfort', { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION);
  });

  // Stopped, the heater carries off: frost protection would only raise it,
  // then the closing drop it back to off.
  it('should keep a stopped heater on off when a window opens', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, windowOpen: true });
    const stopped = pilotWireDevice('comfort', { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' });
    stopped.features.push({
      selector: 'living-room-mode',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
      last_value: THERMOSTAT_MODE.OFF,
    });

    await regulate(mod, gladys, stopped);

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.OFF);
  });

  // A module that cannot hold frost protection would otherwise be left on the
  // comfort it carries, window open.
  it('should send off to a module that takes no frost protection when a window opens', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      order: PILOT_WIRE_MODE.COMFORT,
      windowOpen: true,
      supported: [PILOT_WIRE_MODE.OFF, PILOT_WIRE_MODE.ECO, PILOT_WIRE_MODE.COMFORT].map((value) => ({ value })),
    });

    await regulate(mod, gladys, pilotWireDevice('comfort', { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.OFF);
  });

  it('should send off above the setpoint to a module that takes no frost protection', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      order: PILOT_WIRE_MODE.COMFORT,
      temp: 24,
      supported: [PILOT_WIRE_MODE.OFF, PILOT_WIRE_MODE.ECO, PILOT_WIRE_MODE.COMFORT].map((value) => ({ value })),
    });

    await regulate(mod, gladys, pilotWireDevice('comfort', gladysRegulates));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.OFF);
    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should still stop the heater with off when it is stopped', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    const stopped = pilotWireDevice('comfort');
    stopped.features.push({
      selector: 'living-room-mode',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
      last_value: THERMOSTAT_MODE.OFF,
    });

    await regulate(mod, gladys, stopped);

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.OFF);
  });

  it('should follow the schedule like any other thermostat', async () => {
    const mod = load(fullDaySchedule('eco'));
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('schedule'));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should stop the heater when the thermostat is switched off by hand', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });
    const device = pilotWireDevice('schedule');
    device.features.push({
      selector: 'thermostat-living-room:mode',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
      last_value: 0,
    });

    await regulate(mod, gladys, device);

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.OFF);
  });

  it('should write nothing for a preset no order matches', async () => {
    // A schedule stored before a preset was removed, or a value written by hand:
    // the heater keeps the order it has rather than being sent something wrong.
    const mod = load({
      selector: 'my-schedule',
      transitions: [{ day_of_week: todayDow, time: '00:00', preset: 'party' }],
    });
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('schedule'));

    assert.notCalled(gladys.device.setValue);
  });

  it('should survive a heater whose feature is gone', async () => {
    const mod = load(null);
    const gladys = buildGladys();
    gladys.device.get = fake.resolves([]);

    await regulate(mod, gladys, pilotWireDevice('comfort'));

    assert.notCalled(gladys.device.setValue);
  });

  it('should survive a write that fails', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.OFF });
    gladys.device.setValue = fake.rejects(new Error('offline'));

    // One unreachable heater must not stop the pass for the others.
    await regulate(mod, gladys, pilotWireDevice('comfort'));

    assert.calledOnce(gladys.device.setValue);
    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should leave the operating state alone when the order cannot be read', async () => {
    const mod = load(null);
    const gladys = buildGladys();
    gladys.device.get = fake.resolves([{ selector: 'heater', features: [{ selector: 'heater-pilot-wire' }] }]);
    gladys.device.setValue = fake.rejects(new Error('offline'));

    await regulate(mod, gladys, pilotWireDevice('comfort'));

    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should survive a heater that cannot be looked up', async () => {
    const mod = load(null);
    const gladys = buildGladys();
    gladys.device.get = fake.rejects(new Error('database locked'));

    await regulate(mod, gladys, pilotWireDevice('comfort'));

    assert.notCalled(gladys.device.setValue);
    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should not report a state for a heater whose feature is gone', async () => {
    const mod = load(null);
    const gladys = buildGladys();
    gladys.device.get = fake.resolves([]);

    await regulate(mod, gladys, pilotWireDevice('comfort'));

    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should leave the operating state alone while the heater regulates', async () => {
    // The wire gives no feedback, and the heater regulates on a setpoint of its
    // own: whether it draws current is unknown, and the state does not guess.
    await Promise.all(
      ['comfort', 'eco', 'frost'].map(async (preset) => {
        const mod = load(null);
        const gladys = buildGladys();

        await regulate(mod, gladys, pilotWireDevice(preset));

        expect(savedOperatingStates(gladys), preset).to.deep.equal([]);
      }),
    );
  });

  it('should retract, once, a flame left from when Gladys regulated', async () => {
    // The thermostat was virtual with a sensor, last saved on heating, then
    // turned into one the heater regulates: scenes and HomeKit would keep
    // reading heating.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });
    const device = pilotWireDevice('comfort', heaterRegulates);
    device.features[2].last_value = THERMOSTAT_OPERATING_STATE.HEATING;

    await regulate(mod, gladys, device);

    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should leave an idle state alone while the heater regulates', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });
    const device = pilotWireDevice('comfort', heaterRegulates);
    device.features[2].last_value = THERMOSTAT_OPERATING_STATE.IDLE;

    await regulate(mod, gladys, device);

    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should send eco for eco on a pilot-wire thermostat, room sensor or not', async () => {
    // The room at 20 °C is above eco's 18 °C: Gladys regulating would send
    // frost protection, but the heater regulates here.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, temp: 20 });

    await regulate(mod, gladys, pilotWireDevice('eco', { ...heaterRegulates, ...held(18) }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should read a real thermostat given a pilot wire as a heater regulating itself', async () => {
    // How such a heater was saved before it had a type of its own.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, temp: 20 });

    await regulate(mod, gladys, pilotWireDevice('eco', { ...gladysRegulates, THERMOSTAT_TYPE: 'external' }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should report idle once stopped', async () => {
    const mod = load(fullDaySchedule('off'));
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('schedule'));

    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should send the order of a preset picked by hand', async () => {
    // Picking a preset in the widget arms a hold on its setpoint: that hold has
    // to reach the heater, or no preset chosen by hand would ever apply.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('eco', held(18)));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should keep the preset picked by hand when another one shares its setpoint', async () => {
    // Eco and comfort both set to 18 °C: the nearest order would be comfort (a
    // tie goes warmer), but the preset carried is what was asked for.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('eco', { ...held(18), THERMOSTAT_PRESET_COMFORT: '18' }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should turn a setpoint held from the dial into the nearest order, a tie going warmer', async () => {
    // 19.5 °C sits half-way between eco (18) and comfort (21).
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.OFF });

    await regulate(mod, gladys, pilotWireDevice('schedule', held(19.5)));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.COMFORT);
  });

  it('should turn a low setpoint held from the dial into frost protection', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT });

    await regulate(mod, gladys, pilotWireDevice('schedule', held(8)));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION);
  });

  it('should keep the order it carries when the programme has no point in force', async () => {
    // `schedule` names no order, just as it names no temperature: nothing is
    // sent, and no state is made up.
    const mod = load({ selector: 'my-schedule', transitions: [] });
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.ECO });
    const device = pilotWireDevice('schedule');
    device.features[0].last_value = 20;

    await regulate(mod, gladys, device);

    assert.notCalled(gladys.device.setValue);
    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should retract a stale flame even when the programme has no point in force', async () => {
    // No order is sent on that path, but a flame left from when Gladys
    // regulated is no truer for it.
    const mod = load({ selector: 'my-schedule', transitions: [] });
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.ECO });
    const device = pilotWireDevice('schedule', heaterRegulates);
    device.features[0].last_value = 20;
    device.features[2].last_value = THERMOSTAT_OPERATING_STATE.HEATING;

    await regulate(mod, gladys, device);

    assert.notCalled(gladys.device.setValue);
    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });
});

describe('thermostat pilot wire: regulated by Gladys on a room sensor', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should hold frost protection while the room is above the setpoint', async () => {
    // Eco at 18 °C in a room at 19.4 °C: the heater has nothing to do.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, temp: 19.4 });

    await regulate(mod, gladys, pilotWireDevice('eco', gladysRegulates));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION);
    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should send comfort while the room is below the setpoint, whatever the preset', async () => {
    // The wire is a switch here: eco would hand the decision back to the
    // heater's own thermometer, three and a half degrees below its comfort.
    await Promise.all(
      ['comfort', 'eco', 'away'].map(async (preset) => {
        const mod = load(null);
        const gladys = buildGladys({ order: PILOT_WIRE_MODE.FROST_PROTECTION, temp: 15 });

        await regulate(mod, gladys, pilotWireDevice(preset, gladysRegulates));

        expect(gladys.device.setValue.firstCall.args[2], preset).to.equal(PILOT_WIRE_MODE.COMFORT);
        expect(savedOperatingStates(gladys), preset).to.deep.equal([THERMOSTAT_OPERATING_STATE.HEATING]);
      }),
    );
  });

  it('should keep what the heater does inside the neutral zone', async () => {
    // Comfort at 21 °C, the room at 21.2 °C: within the stop threshold.
    const cases = [
      [PILOT_WIRE_MODE.COMFORT, THERMOSTAT_OPERATING_STATE.HEATING],
      [PILOT_WIRE_MODE.FROST_PROTECTION, THERMOSTAT_OPERATING_STATE.IDLE],
    ];
    await Promise.all(
      cases.map(async ([order, state]) => {
        const mod = load(null);
        const gladys = buildGladys({ order, temp: 21.2 });

        await regulate(mod, gladys, pilotWireDevice('comfort', gladysRegulates));

        assert.notCalled(gladys.device.setValue);
        expect(savedOperatingStates(gladys), String(order)).to.deep.equal([state]);
      }),
    );
  });

  it('should regulate a hold on its own setpoint, not on the nearest preset', async () => {
    // 19.5 °C from the dial, the room at 20.2 °C: comfort's 21 °C would heat,
    // the setpoint asked for does not.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, temp: 20.2 });

    await regulate(mod, gladys, pilotWireDevice('schedule', { ...gladysRegulates, ...held(19.5) }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION);
  });

  it('should write comfort over a derived comfort: the temperature is Gladys’s to decide', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT_1, temp: 18 });

    await regulate(mod, gladys, pilotWireDevice('comfort', { ...gladysRegulates, ...held(21) }));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.COMFORT);
    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.HEATING]);
  });

  it('should regulate on the setpoint it kept when the programme has no point in force', async () => {
    const mod = load({ selector: 'my-schedule', transitions: [] });
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.FROST_PROTECTION, temp: 18 });
    const device = pilotWireDevice('schedule', gladysRegulates);
    device.features[0].last_value = 20;

    await regulate(mod, gladys, device);

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.COMFORT);
    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.HEATING]);
  });

  it('should leave the heater and its state alone with no point in force and no reading', async () => {
    // Nothing to regulate on, and `schedule` names no order to fall back on.
    const mod = load({ selector: 'my-schedule', transitions: [] });
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, temp: null });
    const device = pilotWireDevice('schedule', gladysRegulates);
    device.features[0].last_value = 20;
    device.features[2].last_value = THERMOSTAT_OPERATING_STATE.HEATING;

    await regulate(mod, gladys, device);

    assert.notCalled(gladys.device.setValue);
    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should not report heating when frost protection cannot be written', async () => {
    // The broker is down: the heater keeps comfort, but the room is above the
    // setpoint, so nothing says it heats — a stale flame would stay lit.
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, temp: 19.4 });
    gladys.device.setValue = fake.rejects(new Error('MQTT not configured'));

    await regulate(mod, gladys, pilotWireDevice('eco', gladysRegulates));

    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should report heating when the order cannot be written but the heater already heats', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.ECO, temp: 15 });
    gladys.device.setValue = fake.rejects(new Error('offline'));

    await regulate(mod, gladys, pilotWireDevice('comfort', gladysRegulates));

    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.HEATING]);
  });

  it('should report idle when the order cannot be written and the heater is on standby', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.FROST_PROTECTION, temp: 15 });
    gladys.device.setValue = fake.rejects(new Error('offline'));

    await regulate(mod, gladys, pilotWireDevice('comfort', gladysRegulates));

    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should hand the heater its order when the sensor has no reading', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.FROST_PROTECTION, temp: null });

    await regulate(mod, gladys, pilotWireDevice('eco', gladysRegulates));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should hand the heater its order when the sensor cannot be looked up', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.FROST_PROTECTION });
    const { get } = gladys.device;
    gladys.device.get = fake((query) =>
      query && query.device_feature_selectors === 'temp-sensor' ? Promise.reject(new Error('locked')) : get(query),
    );

    await regulate(mod, gladys, pilotWireDevice('eco', gladysRegulates));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should hand the heater its order when the sensor is gone', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.FROST_PROTECTION });

    await regulate(
      mod,
      gladys,
      pilotWireDevice('eco', { ...gladysRegulates, THERMOSTAT_TEMPERATURE_FEATURE: 'removed-sensor' }),
    );

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should send off without reading the sensor', async () => {
    const mod = load(fullDaySchedule('off'));
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, temp: 15 });

    await regulate(mod, gladys, pilotWireDevice('schedule', gladysRegulates));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.OFF);
    expect(savedOperatingStates(gladys)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });
});
