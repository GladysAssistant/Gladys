const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  THERMOSTAT_MODE,
} = require('../../../../utils/constants');
const { getCurrentDayAndMinutes } = require('../../../../utils/thermostatSchedule');

const todayDow = getCurrentDayAndMinutes(new Date(), 'Europe/Paris').dayOfWeek;

const fullDaySchedule = (preset) => ({
  selector: 'my-schedule',
  slots: [{ day_of_week: todayDow, start_time: '00:00', end_time: '00:00', preset }],
});

const load = (schedule) =>
  proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
    '../../../models': {
      ThermostatSchedule: { findOne: fake.resolves(schedule) },
      ThermostatScheduleSlot: {},
    },
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const params = (map) => Object.keys(map).map((name) => ({ name, value: map[name] }));

// An external thermostat regulates itself: it carries no feature of its own and
// no switch, only the selectors of the real device it drives.
const externalParams = (overrides = {}) =>
  params({
    THERMOSTAT_TYPE: 'external',
    THERMOSTAT_TARGET_FEATURE: 'netatmo-setpoint',
    THERMOSTAT_ACTIVE_SCHEDULE: 'my-schedule',
    THERMOSTAT_MODE: 'heating',
    THERMOSTAT_PRESET_COMFORT: '21',
    THERMOSTAT_PRESET_FROST: '7',
    ...overrides,
  });

const externalDevice = (overrides = {}) => ({ name: 'Netatmo', features: [], params: externalParams(overrides) });

const buildGladys = ({ features = {}, variables = {} } = {}) => {
  const deviceGet = fake((query) => {
    const selector = query && query.device_feature_selectors;
    if (selector && features[selector] !== undefined) {
      return Promise.resolve([{ selector: `${selector}-device`, features: [features[selector]] }]);
    }
    return Promise.resolve([]);
  });
  return {
    device: { get: deviceGet, setValue: fake.resolves(null), saveState: fake.resolves(null) },
    variable: {
      getValue: fake((key) => Promise.resolve(variables[key] !== undefined ? variables[key] : null)),
      setValue: fake.resolves(null),
    },
    event: { emit: fake.returns(null) },
  };
};

const targetFeature = (extra = {}) => ({
  selector: 'netatmo-setpoint',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
  last_value: 18,
  ...extra,
});

const modeFeature = (extra = {}) => ({
  selector: 'netatmo-mode',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
  last_value: THERMOSTAT_MODE.HEATING,
  ...extra,
});

const regulate = async (mod, gladys, device) => mod.regulateDevice(gladys, device, todayDow, 12 * 60);

// The value written on a given feature, or undefined when it was never written.
const writtenOn = (gladys, selector) => {
  const call = gladys.device.setValue.getCalls().find((c) => c.args[1].selector === selector);
  return call ? call.args[2] : undefined;
};

describe('thermostat.writeExternalSetpoint', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should write through the owning integration', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test');

    assert.calledOnce(gladys.device.setValue);
    expect(gladys.device.setValue.firstCall.args[2]).to.equal(21);
  });

  // Several integrations call a cloud API on every write: re-sending an
  // unchanged setpoint every minute would burn the rate limit for nothing.
  it('should skip a write when the value already matches', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature({ last_value: 21 }) } });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test');

    assert.notCalled(gladys.device.setValue);
  });

  // The mark is what lets the NEW_STATE listener tell our own write apart from a
  // change made on the thermostat itself.
  it('should mark the value it writes', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });
    const selfWritten = new Map();

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test', selfWritten);

    expect(selfWritten.get('netatmo-setpoint')).to.equal(21);
  });

  it('should survive a missing target feature', async () => {
    const mod = load(null);
    const gladys = buildGladys();

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test');

    assert.notCalled(gladys.device.setValue);
  });

  it('should drop the mark when the write fails', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });
    gladys.device.setValue = fake.rejects(new Error('integration timeout'));
    const selfWritten = new Map();

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test', selfWritten);

    expect(selfWritten.has('netatmo-setpoint')).to.equal(false);
  });

  it('should survive a failing write', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });
    gladys.device.setValue = fake.rejects(new Error('cloud down'));

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test');
  });

  // A thermostat configured in celsius driving a fahrenheit device would
  // otherwise write 21 where the device reads 21 °F.
  it('should convert into the target feature unit', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      features: { 'netatmo-setpoint': targetFeature({ unit: DEVICE_FEATURE_UNITS.FAHRENHEIT }) },
    });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 20, 'C', 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(68);
  });

  it('should convert a fahrenheit thermostat onto a celsius device', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      features: { 'netatmo-setpoint': targetFeature({ unit: DEVICE_FEATURE_UNITS.CELSIUS }) },
    });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 68, 'F', 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(20);
  });

  // The real device advertises the range it accepts: Netatmo says 5-30, Zigbee
  // 5-40, Matter -100-200. Writing outside it is rejected or silently clamped.
  it('should clamp to the device minimum', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature({ min: 5, max: 30 }) } });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 3, 'C', 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(5);
  });

  it('should clamp to the device maximum', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature({ min: 5, max: 30 }) } });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 35, 'C', 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(30);
  });

  it('should leave the value alone when the feature declares no bounds', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 35, 'C', 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(35);
  });
});

describe('thermostat.regulateDevice - external', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should write the scheduled setpoint on the real device', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

    await regulate(mod, gladys, externalDevice());

    assert.calledOnce(gladys.device.setValue);
    expect(gladys.device.setValue.firstCall.args[2]).to.equal(21);
  });

  // The real thermostat runs its own heuristic: there is no switch to actuate
  // and no hysteresis to compute. Running one here would fight the device.
  it('should never actuate a switch', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({
      features: {
        'netatmo-setpoint': targetFeature(),
        'heater-switch': { selector: 'heater-switch', last_value: 0 },
      },
    });

    await regulate(mod, gladys, externalDevice({ THERMOSTAT_SWITCH_FEATURE: 'heater-switch' }));

    gladys.device.setValue.getCalls().forEach((call) => {
      expect(call.args[1].selector).to.equal('netatmo-setpoint');
    });
  });

  // The setpoint belongs to another integration: saving it locally would update
  // every Gladys screen while the thermostat never hears about it.
  it('should not persist the setpoint with saveState', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

    await regulate(mod, gladys, externalDevice());

    assert.notCalled(gladys.device.saveState);
  });

  // `off` is expressed as the frost-protection setpoint, the only way to say
  // "stop" that every thermostat understands.
  it('should write the frost setpoint for the off preset', async () => {
    const mod = load(fullDaySchedule('off'));
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

    await regulate(mod, gladys, externalDevice());

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(7);
  });

  it('should skip a device whose target feature is not configured', async () => {
    const mod = load(fullDaySchedule('comfort'));
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

    await regulate(mod, gladys, externalDevice({ THERMOSTAT_TARGET_FEATURE: '' }));

    assert.notCalled(gladys.device.setValue);
  });

  describe('window open', () => {
    const withWindow = (overrides = {}) => externalDevice({ THERMOSTAT_WINDOW_FEATURE: 'window-sensor', ...overrides });

    // Nothing to cut: the real thermostat holds the contact. Writing the frost
    // setpoint is what stops it heating, and every thermostat accepting a
    // setpoint supports it — unlike a mode feature, which almost none expose.
    it('should write the frost setpoint when a window opens', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: {
          'netatmo-setpoint': targetFeature(),
          'window-sensor': { selector: 'window-sensor', last_value: 0 },
        },
      });

      await regulate(mod, gladys, withWindow());

      assert.calledOnce(gladys.device.setValue);
      expect(gladys.device.setValue.firstCall.args[2]).to.equal(7);
    });

    it('should regulate normally when the window is closed', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: {
          'netatmo-setpoint': targetFeature(),
          'window-sensor': { selector: 'window-sensor', last_value: 1 },
        },
      });

      await regulate(mod, gladys, withWindow());

      expect(gladys.device.setValue.firstCall.args[2]).to.equal(21);
    });
  });

  describe('manual hold', () => {
    const manualVariables = (setpoint) => ({
      THERMOSTAT_NETATMO_SETPOINT_MANUAL_MODE: 'true',
      THERMOSTAT_NETATMO_SETPOINT_MANUAL_SETPOINT: JSON.stringify({ setpoint }),
      THERMOSTAT_NETATMO_SETPOINT_MANUAL_UNTIL: String(Date.now() + 60 * 60 * 1000),
    });

    it('should hand the held setpoint to the real device', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: { 'netatmo-setpoint': targetFeature() },
        variables: manualVariables(23),
      });

      await regulate(mod, gladys, externalDevice());

      assert.calledOnce(gladys.device.setValue);
      expect(gladys.device.setValue.firstCall.args[2]).to.equal(23);
    });

    // A manual hold on `off` means the user asked for the heating to stop.
    it('should write the frost setpoint for a manual off hold', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: { 'netatmo-setpoint': targetFeature() },
        variables: { ...manualVariables(23), THERMOSTAT_NETATMO_SETPOINT_PRESET: 'off' },
      });

      await regulate(mod, gladys, externalDevice());

      expect(gladys.device.setValue.firstCall.args[2]).to.equal(7);
    });
  });

  // The frost setpoint alone leaves a real thermostat in `heating`: it stops
  // aiming at 21 °C, but it fires again as soon as the room drops below 7 °C,
  // and its own screen still reads "heating". Only the mode says "stop".
  describe('mode feature', () => {
    const withMode = (overrides = {}) => externalDevice({ THERMOSTAT_MODE_FEATURE: 'netatmo-mode', ...overrides });
    const modeFeatures = (extra = {}) => ({
      'netatmo-setpoint': targetFeature(),
      'netatmo-mode': modeFeature(),
      ...extra,
    });

    it('should switch the device off for the off preset', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: modeFeatures() });

      await regulate(mod, gladys, withMode());

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(THERMOSTAT_MODE.OFF);
      // The frost setpoint is still written: it is the fallback for the day the
      // device is turned back on, and the only "stop" some thermostats hear.
      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(7);
    });

    it('should switch the device off for a manual off hold', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: modeFeatures(),
        variables: {
          THERMOSTAT_NETATMO_SETPOINT_MANUAL_MODE: 'true',
          THERMOSTAT_NETATMO_SETPOINT_MANUAL_SETPOINT: JSON.stringify({ setpoint: 23 }),
          THERMOSTAT_NETATMO_SETPOINT_MANUAL_UNTIL: String(Date.now() + 60 * 60 * 1000),
          THERMOSTAT_NETATMO_SETPOINT_PRESET: 'off',
        },
      });

      await regulate(mod, gladys, withMode());

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(THERMOSTAT_MODE.OFF);
    });

    it('should switch the device off when a window opens', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: modeFeatures({ 'window-sensor': { selector: 'window-sensor', last_value: 0 } }),
      });

      await regulate(mod, gladys, withMode({ THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }));

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(THERMOSTAT_MODE.OFF);
    });

    // Coming back from an `off` slot, a device still switched off would take the
    // new setpoint and do nothing with it.
    it('should hand the mode back when a heating preset takes over', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: modeFeatures({ 'netatmo-mode': modeFeature({ last_value: THERMOSTAT_MODE.OFF }) }),
      });

      await regulate(mod, gladys, withMode());

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(THERMOSTAT_MODE.HEATING);
      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(21);
    });

    it('should hand back the cooling mode on a cooling thermostat', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: modeFeatures({ 'netatmo-mode': modeFeature({ last_value: THERMOSTAT_MODE.OFF }) }),
      });

      await regulate(mod, gladys, withMode({ THERMOSTAT_MODE: 'cooling' }));

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(THERMOSTAT_MODE.COOLING);
    });

    // Like the setpoint, the mode goes through an integration that may call a
    // cloud API on every write.
    it('should skip a mode write when the device already carries it', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: modeFeatures() });

      await regulate(mod, gladys, withMode());

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(undefined);
    });

    // A heating-only thermostat declares max = 1: asking it for COOLING would be
    // rejected by the integration.
    it('should clamp a mode the device does not support', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: modeFeatures({
          'netatmo-mode': modeFeature({ last_value: THERMOSTAT_MODE.OFF, max: THERMOSTAT_MODE.HEATING }),
        }),
      });

      await regulate(mod, gladys, withMode({ THERMOSTAT_MODE: 'cooling' }));

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(THERMOSTAT_MODE.HEATING);
    });

    // Almost no integration exposes a mode feature: those thermostats keep
    // being stopped by the frost setpoint alone.
    it('should keep writing only the setpoint when no mode feature is configured', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

      await regulate(mod, gladys, externalDevice());

      assert.calledOnce(gladys.device.setValue);
      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(7);
    });

    it('should survive a mode feature that no longer exists', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

      await regulate(mod, gladys, withMode());

      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(7);
    });

    it('should survive a failing mode write', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: modeFeatures() });
      gladys.device.setValue = fake.rejects(new Error('cloud down'));

      await regulate(mod, gladys, withMode());
    });
  });
});

// A setpoint changed on the real thermostat — its dial, the vendor app, its own
// programme — must not be undone by the next regulation pass: without a hold,
// the loop rewrites the stored preset within a minute and fights the device.
describe('thermostat.onExternalSetpointChanged', () => {
  afterEach(() => {
    sinon.restore();
  });

  const loadListener = () =>
    proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
      '../../../utils/logger': {
        debug: fake.returns(null),
        info: fake.returns(null),
        warn: fake.returns(null),
      },
    });

  const externalThermostat = {
    features: [],
    params: [
      { name: 'THERMOSTAT_TYPE', value: 'external' },
      { name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' },
    ],
  };

  const buildHandler = (devices = [externalThermostat]) => ({
    gladys: { device: { get: fake.resolves(devices) } },
    windowSelectorsCache: null,
    targetSelectorsCache: null,
    selfWrittenSetpoints: new Map(),
    setValue: fake.resolves(null),
  });

  it('should hold a setpoint changed on the device itself', async () => {
    const mod = loadListener();
    const handler = buildHandler();

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    assert.calledOnce(handler.setValue);
    expect(handler.setValue.firstCall.args[2]).to.equal(19);
  });

  // Our own write echoes back as the very same event: taking it for a change
  // made on the device would arm a manual hold on every scheduled write, and the
  // schedule would suspend itself for ever.
  it('should ignore the echo of a setpoint this service just wrote', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.selfWrittenSetpoints.set('netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);

    assert.notCalled(handler.setValue);
    // The mark is consumed: a later change to the same value is a real one.
    expect(handler.selfWrittenSetpoints.has('netatmo-setpoint')).to.equal(false);
  });

  it('should hold a change to a different value than the one written', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.selfWrittenSetpoints.set('netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    assert.calledOnce(handler.setValue);
  });

  it('should ignore a thermostat whose target param disappeared', async () => {
    const mod = loadListener();
    // The selector is cached, but the device no longer carries the param: the
    // config changed between the cache build and the event.
    const handler = buildHandler([]);
    handler.targetSelectorsCache = new Set(['netatmo-setpoint']);
    handler.windowSelectorsCache = new Set();

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    assert.notCalled(handler.setValue);
  });

  it('should ignore a feature no thermostat drives', async () => {
    const mod = loadListener();
    const handler = buildHandler();

    await mod.onExternalSetpointChanged.call(handler, 'some-other-feature', 19);

    assert.notCalled(handler.setValue);
  });

  // getTargetSelectors returns the warm cache without rebuilding it.
  it('should reuse a warm selector cache', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.targetSelectorsCache = new Set(['netatmo-setpoint']);
    handler.windowSelectorsCache = new Set();

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    // The cache was warm: no device query was needed to reject or accept.
    assert.calledOnce(handler.gladys.device.get);
  });

  it('should ignore an event with no value', async () => {
    const mod = loadListener();
    const handler = buildHandler();

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', null);
    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', undefined);

    assert.notCalled(handler.setValue);
  });

  it('should survive a failing hold', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.setValue = fake.rejects(new Error('database down'));

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);
  });

  // A virtual thermostat has no second source of truth: Gladys is the only
  // writer of its setpoint, so its own writes must never arm a hold.
  it('should ignore a virtual thermostat feature', async () => {
    const mod = loadListener();
    const handler = buildHandler([
      {
        features: [{ selector: 'thermostat-living-room' }],
        params: [{ name: 'THERMOSTAT_SWITCH_FEATURE', value: 'sw' }],
      },
    ]);

    await mod.onExternalSetpointChanged.call(handler, 'thermostat-living-room', 19);

    assert.notCalled(handler.setValue);
  });
});
