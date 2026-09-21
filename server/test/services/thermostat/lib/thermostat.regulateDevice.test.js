const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  EVENTS,
  THERMOSTAT_MODE,
  THERMOSTAT_PRESET,
} = require('../../../../utils/constants');
const { getCurrentDayAndMinutes } = require('../../../../utils/thermostatSchedule');

const setpointFeature = (extra = {}) => ({
  selector: 'thermostat-living-room',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
  ...extra,
});

// The preset a thermostat currently carries is the last_value of its preset
// feature, not a variable.
const presetFeature = (preset) => ({
  selector: 'thermostat-living-room:preset',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
  last_value: THERMOSTAT_PRESET[preset.toUpperCase()],
});

const modeFeature = (mode) => ({
  selector: 'thermostat-living-room:mode',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
  last_value: mode,
});

const todayDow = getCurrentDayAndMinutes(new Date(), 'Europe/Paris').dayOfWeek;

// A single point at 00:00 today: whatever the time of day, it is the last
// transition at or before now, so the whole day carries this preset.
const fullDaySchedule = (preset) => ({
  selector: 'my-schedule',
  transitions: [{ day_of_week: todayDow, time: '00:00', preset }],
});

// `follows` defaults to "a schedule is attached", which is what the schedule
// argument means; it is passed explicitly only to describe a thermostat that
// follows none — the case where a manual hold stays permanent.
const load = (schedule, follows = Boolean(schedule)) =>
  proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
    '../../../models': {
      ThermostatScheduleDevice: {
        findOne: fake.resolves(schedule && follows ? { schedule } : null),
        count: fake.resolves(follows ? 1 : 0),
      },
      ThermostatSchedule: {},
      ThermostatScheduleTransition: {},
    },
    './thermostat.scheduleDevice': {
      followsSchedule: fake.resolves(follows),
    },
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const params = (map) => Object.keys(map).map((name) => ({ name, value: map[name] }));

const baseParams = (overrides = {}) =>
  params({
    THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
    THERMOSTAT_SWITCH_FEATURE: 'heater-switch',
    THERMOSTAT_MODE: 'heating',
    THERMOSTAT_PRESET_COMFORT: '21',
    ...overrides,
  });

// Feature lookups go through gladys.device.get({ device_feature_selectors }).
const buildGladys = ({ features = {}, variables = {}, getOverride = null } = {}) => {
  const deviceGet = fake((query) => {
    if (getOverride) {
      const overridden = getOverride(query);
      if (overridden !== undefined) {
        return overridden;
      }
    }
    const selector = query && query.device_feature_selectors;
    if (selector && features[selector] !== undefined) {
      return Promise.resolve([{ selector: `${selector}-device`, features: [features[selector]] }]);
    }
    return Promise.resolve([]);
  });
  return {
    device: {
      get: deviceGet,
      setValue: fake.resolves(null),
      saveState: fake.resolves(null),
      setParam: fake.resolves(null),
    },
    variable: {
      getValue: fake((key) => Promise.resolve(variables[key] !== undefined ? variables[key] : null)),
      setValue: fake.resolves(null),
    },
    event: { emit: fake.returns(null) },
  };
};

const standardFeatures = ({ temp = 18, switchOn = false, windowOpen = null } = {}) => {
  const features = {
    'temp-sensor': { selector: 'temp-sensor', last_value: temp },
    'heater-switch': { selector: 'heater-switch', last_value: switchOn ? 1 : 0 },
  };
  if (windowOpen !== null) {
    features['window-sensor'] = { selector: 'window-sensor', last_value: windowOpen ? 0 : 1 };
  }
  return features;
};

const regulate = async (mod, gladys, device) => mod.regulateDevice(gladys, device, todayDow, 12 * 60);

describe('thermostat.regulateDevice', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should skip a device without a target-temperature feature', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys();

    await regulate(mod, gladys, { features: [{ selector: 'x', category: 'light', type: 'binary' }] });

    assert.notCalled(gladys.device.setValue);
  });

  it('should skip a device with no features at all', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys();

    await regulate(mod, gladys, {});

    assert.notCalled(gladys.device.setValue);
  });

  it('should stop when no config can be resolved', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys();

    await regulate(mod, gladys, { features: [setpointFeature()], params: [] });

    assert.notCalled(gladys.device.setValue);
  });

  it('should keep going when the window sensor cannot be read', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: standardFeatures({ temp: 18 }),
      getOverride: (query) => {
        if (query && query.device_feature_selectors === 'window-sensor') {
          return Promise.reject(new Error('sensor offline'));
        }
        return undefined;
      },
    });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams({ THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }),
    });

    // Regulation continued despite the sensor error
    assert.calledOnce(gladys.device.setValue);
  });

  it('should cut the switch and stop when the window is open', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 18, switchOn: true, windowOpen: true }) });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams({ THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(0);
  });

  it('should not try to actuate on an open window without a switch', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ windowOpen: true }) });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: params({
        THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
        THERMOSTAT_WINDOW_FEATURE: 'window-sensor',
      }),
    });

    assert.notCalled(gladys.device.setValue);
  });

  describe('manual mode', () => {
    // The hold lives on the device now, as params, so it is described here
    // rather than through the variable table. `setpoint` null means a hold whose
    // setpoint is missing, `until` null a permanent one.
    const heldDevice = ({ setpoint = 22, until = Date.now() + 60000, extraParams = {} } = {}) => ({
      id: 'device-id',
      selector: 'living-room',
      features: [setpointFeature()],
      params: baseParams({
        ...(setpoint === null ? {} : { THERMOSTAT_MANUAL_SETPOINT: String(setpoint) }),
        THERMOSTAT_MANUAL_UNTIL: until === null ? '' : String(until),
        ...extraParams,
      }),
    });

    it('should not actuate when the temperature sensor cannot be read', async () => {
      // The sensor is configured but its feature is gone (renamed, deleted): the
      // manual branch must bail out rather than compare against a missing value.
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: { 'heater-switch': { selector: 'heater-switch', last_value: 1 } },
      });

      await regulate(mod, gladys, heldDevice());

      assert.notCalled(gladys.device.setValue);
    });

    it('should cut the switch when the schedule reaches an off transition', async () => {
      // Stopping is a mode, not a preset with a setpoint: a transition saying
      // `off` must cut the heating rather than regulate on whatever setpoint was
      // current before it.
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15, switchOn: true }) });

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      const [, , value] = gladys.device.setValue.firstCall.args;
      expect(value).to.equal(0);
    });

    it('should regulate on the manual setpoint while the timer runs', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

      await regulate(mod, gladys, heldDevice());

      const [, , value] = gladys.device.setValue.firstCall.args;
      expect(value).to.equal(1);
    });

    it('should hold manual mode forever when no expiry is stored', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

      await regulate(mod, gladys, heldDevice({ until: null }));

      // A permanent hold is never cleared by the loop.
      assert.neverCalledWith(gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT', '');
    });

    it('should fall through to the schedule on a malformed manual setpoint', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

      await regulate(
        mod,
        gladys,
        heldDevice({ setpoint: null, extraParams: { THERMOSTAT_MANUAL_SETPOINT: 'not-a-number' } }),
      );

      // An unreadable hold is no hold: the schedule applies rather than the loop
      // stopping and leaving the heating wherever it was.
      assert.calledOnce(gladys.device.setValue);
    });

    it('should fall through to the schedule when no hold is armed', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

      await regulate(mod, gladys, heldDevice({ setpoint: null }));

      assert.calledOnce(gladys.device.setValue);
    });

    it('should not actuate in manual mode without a temperature reading', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: {
          'temp-sensor': { selector: 'temp-sensor', last_value: null },
          'heater-switch': { selector: 'heater-switch', last_value: 0 },
        },
      });

      await regulate(mod, gladys, heldDevice());

      assert.notCalled(gladys.device.setValue);
    });

    it('should arm the expiry when a schedule is attached after a permanent hold', async () => {
      // Hold taken with no schedule: setValue wrote an empty MANUAL_UNTIL. Once a
      // schedule is attached, that hold must stop being permanent, otherwise the
      // schedule never takes over.
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });
      const before = Date.now();

      await regulate(mod, gladys, heldDevice({ until: null }));

      const call = gladys.device.setParam
        .getCalls()
        .find((c) => c.args[1] === 'THERMOSTAT_MANUAL_UNTIL' && c.args[2] !== '');
      expect(call).to.not.equal(undefined);
      const armed = parseInt(call.args[2], 10);
      // 30 minutes is the shared default, the device configures no duration here.
      expect(armed).to.be.at.least(before + 30 * 60 * 1000);
      expect(armed).to.be.at.most(Date.now() + 30 * 60 * 1000);
      // The hold itself still runs: this pass regulates on the manual setpoint.
      assert.neverCalledWith(gladys.variable.setValue, 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE', 'false');
    });

    it('should use the duration configured on the device when arming that expiry', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });
      const before = Date.now();

      await regulate(mod, gladys, heldDevice({ until: null, extraParams: { THERMOSTAT_MANUAL_DURATION: '120' } }));

      const call = gladys.device.setParam
        .getCalls()
        .find((c) => c.args[1] === 'THERMOSTAT_MANUAL_UNTIL' && c.args[2] !== '');
      expect(parseInt(call.args[2], 10)).to.be.at.least(before + 120 * 60 * 1000);
    });

    it('should carry the armed expiry to open dashboards', async () => {
      // The widget renders the countdown only when it holds an expiry; a
      // permanent hold leaves it on the schedule banner, which has no cancel
      // button. The broadcast carries the expiry so it can swap back.
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

      await regulate(mod, gladys, heldDevice({ until: null }));

      const emitted = gladys.event.emit
        .getCalls()
        .find((c) => c.args[1] && c.args[1].payload && c.args[1].payload.until);
      expect(emitted).to.not.equal(undefined);
      expect(emitted.args[1].payload.device).to.equal('living-room');
      expect(emitted.args[1].payload.until).to.be.above(Date.now());
    });

    it('should leave a permanent hold alone while no schedule is attached', async () => {
      // Without a schedule the hold is permanent by design: nothing would take
      // the setpoint over, and the widget offers the preset bar to leave it.
      const mod = load(fullDaySchedule('comfort'), false);
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

      await regulate(mod, gladys, heldDevice({ until: null }));

      assert.notCalled(gladys.device.setParam);
    });

    it('should not re-arm an expiry that is already set', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

      await regulate(mod, gladys, heldDevice());

      assert.notCalled(gladys.device.setParam);
    });

    it('should revert to the schedule once the manual timer expired', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

      await regulate(mod, gladys, heldDevice({ until: Date.now() - 60000 }));

      // The hold is cleared and the schedule takes over again.
      assert.calledWith(gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT', '');
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL);
    });
  });

  describe('preset resolution', () => {
    it('should fall back to the preset the thermostat carries when the schedule is empty', async () => {
      const mod = load({ selector: 'my-schedule', transitions: [] });
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

      await regulate(mod, gladys, {
        features: [setpointFeature(), presetFeature('comfort')],
        params: baseParams(),
      });

      assert.calledOnce(gladys.device.setValue);
    });

    it('should fall back to the preset the thermostat carries when it follows no schedule', async () => {
      const mod = load(null);
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

      await regulate(mod, gladys, {
        features: [setpointFeature(), presetFeature('comfort')],
        params: baseParams(),
      });

      assert.calledOnce(gladys.device.setValue);
    });

    it('should ignore a legacy active-schedule variable: the schedule is a relation', async () => {
      const mod = load(fullDaySchedule('comfort'), false);
      const gladys = buildGladys({
        features: standardFeatures({ temp: 18 }),
        variables: { THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule' },
      });

      await regulate(mod, gladys, {
        features: [setpointFeature()],
        params: baseParams(),
      });

      // No schedule and no preset variable: nothing to regulate on.
      assert.notCalled(gladys.device.setValue);
    });

    it('should skip the setpoint write when it already matches', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

      await regulate(mod, gladys, {
        features: [setpointFeature({ last_value: 21 })],
        params: baseParams(),
      });

      assert.notCalled(gladys.device.saveState);
    });

    it('should survive a failing setpoint write', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });
      gladys.device.saveState = fake.rejects(new Error('db down'));

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      // The switch is still actuated even though the setpoint could not be stored
      assert.calledOnce(gladys.device.setValue);
    });

    it('should not broadcast the preset when it did not change', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: standardFeatures({ temp: 18 }),
        variables: { THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET: 'comfort' },
      });

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      assert.notCalled(gladys.variable.setValue);
    });
  });

  describe('switch actuation', () => {
    it('should stop when no switch is configured', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

      await regulate(mod, gladys, {
        features: [setpointFeature()],
        params: params({
          THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
        }),
      });

      assert.notCalled(gladys.device.setValue);
    });

    it('should stop when no temperature feature is configured', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

      await regulate(mod, gladys, {
        features: [setpointFeature()],
        params: params({
          THERMOSTAT_SWITCH_FEATURE: 'heater-switch',
          THERMOSTAT_PRESET_COMFORT: '21',
        }),
      });

      assert.notCalled(gladys.device.setValue);
    });

    it('should stop when the temperature cannot be read', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: standardFeatures({ temp: 18 }),
        getOverride: (query) => {
          if (query && query.device_feature_selectors === 'temp-sensor') {
            return Promise.reject(new Error('sensor offline'));
          }
          return undefined;
        },
      });

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      assert.notCalled(gladys.device.setValue);
    });

    it('should stop when the temperature sensor has no reading yet', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: {
          'temp-sensor': { selector: 'temp-sensor', last_value: null },
          'heater-switch': { selector: 'heater-switch', last_value: 0 },
        },
      });

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      assert.notCalled(gladys.device.setValue);
    });

    it('should stop when the switch feature does not exist', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: { 'temp-sensor': { selector: 'temp-sensor', last_value: 18 } },
      });

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      assert.notCalled(gladys.device.setValue);
    });

    it('should leave the switch alone when it is already in the wanted state', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18, switchOn: true }) });

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      assert.notCalled(gladys.device.setValue);
    });

    it('should survive a failing switch write', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });
      gladys.device.setValue = fake.rejects(new Error('switch offline'));

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      assert.calledOnce(gladys.device.setValue);
    });

    it('should turn the switch off on the off preset', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: standardFeatures({ temp: 18, switchOn: true }) });

      await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

      const [, , value] = gladys.device.setValue.firstCall.args;
      expect(value).to.equal(0);
    });
  });
});

describe('thermostat.regulateDevice - resilience', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should skip actuation when the window switch feature is unknown', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: {
        'temp-sensor': { selector: 'temp-sensor', last_value: 18 },
        'window-sensor': { selector: 'window-sensor', last_value: 0 },
        // heater-switch deliberately missing: getFeatureBySelector returns null
      },
    });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams({ THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }),
    });

    assert.notCalled(gladys.device.setValue);
  });

  it('should treat unreadable preset variables as absent', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });
    gladys.variable.getValue = fake.rejects(new Error('variable table locked'));

    await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

    // The schedule still resolves the preset, so regulation goes on
    assert.calledOnce(gladys.device.setValue);
  });

  it('should treat an unreadable manual expiry as no expiry', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });
    gladys.variable.getValue = fake((key) => {
      if (key === 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE') {
        return Promise.resolve('true');
      }
      if (key === 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL') {
        return Promise.reject(new Error('unreadable'));
      }
      if (key === 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_SETPOINT') {
        return Promise.resolve(JSON.stringify({ setpoint: 22 }));
      }
      return Promise.resolve(null);
    });

    await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

    // Manual mode holds rather than silently reverting to the schedule
    assert.neverCalledWith(gladys.variable.setValue, 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE', 'false');
    assert.calledOnce(gladys.device.setValue);
  });

  it('should leave a preset the user picked alone, rather than re-applying the schedule', async () => {
    // A preset chosen on the widget or by a scene outranks the programme: the
    // loop reads the schedule only while the preset feature says `schedule`.
    // Without this the choice would last at most one minute.
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 15, switchOn: true }) });

    await regulate(mod, gladys, {
      id: 'device-id',
      selector: 'living-room',
      // Frost is 7 °C: at 15 °C the heating must stay off, where comfort (21 °C)
      // would turn it on.
      features: [setpointFeature(), presetFeature('frost')],
      params: baseParams(),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(0);
  });

  it('should stop a stopped external thermostat, not a switch it does not have', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: {
        'netatmo-setpoint': { selector: 'netatmo-setpoint', last_value: 21, min: 5, max: 30 },
      },
    });

    await regulate(mod, gladys, {
      id: 'device-id',
      selector: 'netatmo',
      features: [modeFeature(THERMOSTAT_MODE.OFF)],
      params: baseParams({
        THERMOSTAT_TYPE: 'external',
        THERMOSTAT_TARGET_FEATURE: 'netatmo-setpoint',
        THERMOSTAT_SWITCH_FEATURE: '',
      }),
    });

    // The frost setpoint is what stops a device with no mode feature of its own.
    expect(gladys.device.setValue.firstCall.args[2]).to.equal(7);
  });

  it('should fall back on the preset it carries when the schedule has no point', async () => {
    // A schedule with no transition resolves to nothing, so the preset the
    // thermostat carries applies — here `schedule` itself, whose setpoint is the
    // shared fallback rather than a temperature of its own.
    const mod = load({ selector: 'my-schedule', transitions: [] });
    const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

    await regulate(mod, gladys, {
      id: 'device-id',
      selector: 'living-room',
      features: [setpointFeature(), presetFeature('schedule')],
      params: baseParams(),
    });

    // 15 °C against the fallback setpoint: the heating runs.
    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should report a running cooling thermostat as cooling', async () => {
    const mod = load(fullDaySchedule('comfort'));
    // Warm room, cooling mode: the compressor runs, and the operating state has
    // to say "cooling" rather than "heating".
    const gladys = buildGladys({ features: standardFeatures({ temp: 28 }) });

    await regulate(mod, gladys, {
      id: 'device-id',
      selector: 'living-room',
      features: [setpointFeature(), presetFeature('schedule')],
      params: baseParams({ THERMOSTAT_MODE: 'cooling' }),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should follow the schedule while the thermostat asks for it', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

    await regulate(mod, gladys, {
      id: 'device-id',
      selector: 'living-room',
      features: [setpointFeature(), presetFeature('schedule')],
      params: baseParams(),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should leave a stopped thermostat alone, whatever the schedule says', async () => {
    // Stopping writes OFF on the mode feature and triggers a regulation pass:
    // without this the pass would resolve the schedule's preset and start the
    // heating again within seconds — the stop would undo itself.
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 15, switchOn: true }) });

    await regulate(mod, gladys, {
      id: 'device-id',
      selector: 'living-room',
      features: [setpointFeature(), modeFeature(THERMOSTAT_MODE.OFF)],
      params: baseParams(),
    });

    // The switch is cut, and nothing is regulated on the schedule's preset.
    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(0);
    expect(gladys.device.setValue.getCalls()).to.have.lengthOf(1);
  });

  it('should regulate normally once the mode is handed back', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 15 }) });

    await regulate(mod, gladys, {
      id: 'device-id',
      selector: 'living-room',
      features: [setpointFeature(), modeFeature(THERMOSTAT_MODE.HEATING)],
      params: baseParams(),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should regulate on nothing when the thermostat follows no schedule', async () => {
    const mod = load(fullDaySchedule('comfort'), false);
    const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });
    gladys.variable.getValue = fake.resolves(null);

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams(),
    });

    // No schedule and no preset: nothing to regulate on
    assert.notCalled(gladys.device.setValue);
  });
});

describe('thermostat.regulateDevice - defensive paths', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should default to heating when no mode is configured', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: params({
        THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
        THERMOSTAT_SWITCH_FEATURE: 'heater-switch',
        THERMOSTAT_PRESET_COMFORT: '21',
      }),
    });

    // Heating below the setpoint turns the switch ON
    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should keep regulating when the configured window feature does not exist', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams({ THERMOSTAT_WINDOW_FEATURE: 'missing-window' }),
    });

    assert.calledOnce(gladys.device.setValue);
  });

  it('should stop when the temperature feature does not exist', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: { 'heater-switch': { selector: 'heater-switch', last_value: 0 } },
    });

    await regulate(mod, gladys, { features: [setpointFeature()], params: baseParams() });

    assert.notCalled(gladys.device.setValue);
  });
});

describe('thermostat.regulateDevice - config defaults', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should default the mode to heating when the params omit it', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: [
        { name: 'THERMOSTAT_TEMPERATURE_FEATURE', value: 'temp-sensor' },
        { name: 'THERMOSTAT_SWITCH_FEATURE', value: 'heater-switch' },
        { name: 'THERMOSTAT_PRESET_COMFORT', value: '21' },
      ],
    });

    // Heating below the setpoint turns the switch ON
    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should skip a device carrying no params at all', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: standardFeatures({ temp: 18 }) });

    await regulate(mod, gladys, { features: [setpointFeature()], params: [] });

    assert.notCalled(gladys.device.setValue);
  });

  it('should convert a celsius sensor before comparing it to a fahrenheit setpoint', async () => {
    // 18 °C is 64.4 °F, well below the 70 °F comfort setpoint, so the heating
    // must start. Comparing the raw 18 against 70 would also start it here — the
    // cooling case below is the one that proves the conversion actually happens.
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: {
        'temp-sensor': { selector: 'temp-sensor', last_value: 18, unit: DEVICE_FEATURE_UNITS.CELSIUS },
        'heater-switch': { selector: 'heater-switch', last_value: 0 },
      },
    });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams({ THERMOSTAT_TEMP_UNIT: 'F', THERMOSTAT_PRESET_COMFORT: '70' }),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should not leave a fahrenheit thermostat heating on a warm celsius room', async () => {
    // 24 °C is 75.2 °F, above the 70 °F setpoint: the heating must stop. Without
    // the conversion the loop would compare 24 against 70 and heat forever.
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: {
        'temp-sensor': { selector: 'temp-sensor', last_value: 24, unit: DEVICE_FEATURE_UNITS.CELSIUS },
        'heater-switch': { selector: 'heater-switch', last_value: 1 },
      },
    });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams({ THERMOSTAT_TEMP_UNIT: 'F', THERMOSTAT_PRESET_COMFORT: '70' }),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(0);
  });

  it('should convert the sensor on the manual override path too', async () => {
    // The manual branch returns before the schedule is resolved, so it needs its
    // own conversion: 24 °C is 75.2 °F, above a 70 °F manual hold.
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: {
        'temp-sensor': { selector: 'temp-sensor', last_value: 24, unit: DEVICE_FEATURE_UNITS.CELSIUS },
        'heater-switch': { selector: 'heater-switch', last_value: 1 },
      },
      variables: {
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE: 'true',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_SETPOINT: JSON.stringify({ setpoint: 70 }),
      },
    });

    await regulate(mod, gladys, {
      features: [setpointFeature()],
      params: baseParams({ THERMOSTAT_TEMP_UNIT: 'F', THERMOSTAT_PRESET_COMFORT: '70' }),
    });

    const [, , value] = gladys.device.setValue.firstCall.args;
    expect(value).to.equal(0);
  });
});
