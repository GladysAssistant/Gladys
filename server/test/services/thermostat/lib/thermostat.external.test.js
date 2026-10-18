const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  THERMOSTAT_MODE,
  AC_MODE,
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

const params = (map) => Object.keys(map).map((name) => ({ name, value: map[name] }));

// An external thermostat regulates itself: it carries no feature of its own and
// no switch, only the selectors of the real device it drives.
const externalParams = (overrides = {}) =>
  params({
    THERMOSTAT_TYPE: 'external',
    THERMOSTAT_TARGET_FEATURE: 'netatmo-setpoint',
    THERMOSTAT_MODE: 'heating',
    THERMOSTAT_PRESET_COMFORT: '21',
    THERMOSTAT_PRESET_FROST: '7',
    ...overrides,
  });

const externalDevice = (overrides = {}) => ({
  id: 'device-id',
  selector: 'netatmo-thermostat',
  name: 'Netatmo',
  features: [],
  params: externalParams(overrides),
});

// The hold lives on the device, as params.
const heldExternalDevice = (setpoint, overrides = {}) =>
  externalDevice({
    THERMOSTAT_MANUAL_SETPOINT: String(setpoint),
    THERMOSTAT_MANUAL_UNTIL: String(Date.now() + 60 * 60 * 1000),
    ...overrides,
  });

const buildGladys = ({ features = {}, variables = {} } = {}) => {
  const deviceGet = fake((query) => {
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

  // Nothing is written, but this is still the value the service stands behind. Not
  // marking it let an integration re-reporting that untouched setpoint — on a
  // reconnection or on its regular report — look like a change made on the device,
  // which armed a manual hold nobody asked for.
  it('should mark a value it did not need to write', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature({ last_value: 21 }) } });
    const selfWritten = new Map();

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test', selfWritten);

    assert.notCalled(gladys.device.setValue);
    expect(selfWritten.get('netatmo-setpoint')).to.equal(21);
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

  // 21 °C is 69.8 °F: a device echoing back 70 would never equal it, and the
  // setpoint would be re-written — and its echo taken for a hold — every pass.
  it('should round a celsius setpoint to a whole fahrenheit degree', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      features: { 'netatmo-setpoint': targetFeature({ unit: DEVICE_FEATURE_UNITS.FAHRENHEIT }) },
    });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 21, 'C', 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(70);
  });

  it('should round a fahrenheit setpoint to half a celsius degree', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      features: { 'netatmo-setpoint': targetFeature({ unit: DEVICE_FEATURE_UNITS.CELSIUS }) },
    });

    // 70 °F is 21.11 °C.
    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 70, 'F', 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(21);
  });

  it('should snap the setpoint to the step the device declares', async () => {
    const mod = load(null);
    const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature({ step: 0.5 }) } });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 19.3, null, 'test');

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(19.5);
  });

  it('should skip the write once the snapped value is what the device reports', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      features: { 'netatmo-setpoint': targetFeature({ step: 1, last_value: 20 }) },
    });

    await mod.writeExternalSetpoint(gladys, 'netatmo-setpoint', 20.2, null, 'test');

    expect(gladys.device.setValue.called).to.equal(false);
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

    // An open-plan salon and kitchen are heated as one: the kitchen door open is
    // enough to stop the heating, whatever the salon's window says (A.1.1).
    it('should stop the thermostat when any of several windows is open', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: {
          'netatmo-setpoint': targetFeature(),
          'salon-window': { selector: 'salon-window', last_value: 1 },
          'kitchen-door': { selector: 'kitchen-door', last_value: 0 },
        },
      });

      await regulate(mod, gladys, withWindow({ THERMOSTAT_WINDOW_FEATURE: '["salon-window","kitchen-door"]' }));

      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(7);
    });

    it('should regulate normally when all the windows are closed', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: {
          'netatmo-setpoint': targetFeature(),
          'salon-window': { selector: 'salon-window', last_value: 1 },
          'kitchen-door': { selector: 'kitchen-door', last_value: 1 },
        },
      });

      await regulate(mod, gladys, withWindow({ THERMOSTAT_WINDOW_FEATURE: '["salon-window","kitchen-door"]' }));

      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(21);
    });

    // A sensor with a flat battery, or one whose read fails, is not an open window:
    // taking it as one would stop the heating for good.
    it('should not take a sensor it cannot read for an open window', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });
      const { get } = gladys.device;
      gladys.device.get = fake((query) =>
        query && query.device_feature_selectors === 'broken-window' ? Promise.reject(new Error('db')) : get(query),
      );

      await regulate(mod, gladys, withWindow({ THERMOSTAT_WINDOW_FEATURE: '["broken-window","missing-window"]' }));

      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(21);
    });
  });

  describe('manual hold', () => {
    it('should hand the held setpoint to the real device', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

      await regulate(mod, gladys, heldExternalDevice(23));

      assert.calledOnce(gladys.device.setValue);
      expect(gladys.device.setValue.firstCall.args[2]).to.equal(23);
    });

    it('should write a held setpoint in the unit it was set in', async () => {
      // The hold came from the real feature — the widget dial reads its unit, and
      // a change made on the device arrives in it. Converting it again as if it
      // were in the thermostat's unit would command 158 °F for a 70 °F hold.
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: { 'netatmo-setpoint': { ...targetFeature(), unit: 'fahrenheit' } },
      });

      await regulate(mod, gladys, heldExternalDevice(70, { THERMOSTAT_TEMP_UNIT: 'C' }));

      expect(gladys.device.setValue.firstCall.args[2]).to.equal(70);
    });

    // Stopping is a mode, not a held setpoint: a transition saying `off` writes
    // the frost setpoint, which is the "stop" every thermostat understands.
    it('should write the frost setpoint on an off transition', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

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

    // A manual hold arrives on a thermostat that may still be switched off by a
    // previous `off` slot: the held setpoint alone would change nothing.
    it('should hand the mode back for a manual hold on a setpoint', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: modeFeatures({ 'netatmo-mode': modeFeature({ last_value: THERMOSTAT_MODE.OFF }) }),
      });

      await regulate(mod, gladys, heldExternalDevice(23, { THERMOSTAT_MODE_FEATURE: 'netatmo-mode' }));

      expect(writtenOn(gladys, 'netatmo-mode')).to.equal(THERMOSTAT_MODE.HEATING);
      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(23);
    });

    it('should write the mode before the frost setpoint when stopping', async () => {
      // The mode is what the machine obeys: writing 7 °C to a thermostat still in
      // COOLING asks it to cool the room to 7 °C until the mode write lands.
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: modeFeatures() });

      await regulate(mod, gladys, withMode());

      const order = gladys.device.setValue.getCalls().map((call) => call.args[1].selector);
      expect(order).to.deep.equal(['netatmo-mode', 'netatmo-setpoint']);
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

  // A heat pump publishes its setpoint, its mode and its power in the
  // air-conditioning category: its mode speaks AC_MODE and has no off, and its
  // power is what stops it (A.0.3).
  describe('air conditioner', () => {
    const acDevice = (overrides = {}) =>
      externalDevice({
        THERMOSTAT_TARGET_FEATURE: 'ac-setpoint',
        THERMOSTAT_MODE_FEATURE: 'ac-mode',
        THERMOSTAT_POWER_FEATURE: 'ac-power',
        ...overrides,
      });
    const acFeatures = ({ mode = AC_MODE.HEATING, power = 1, setpoint = 18 } = {}) => ({
      'ac-setpoint': {
        selector: 'ac-setpoint',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
        min: 16,
        max: 31,
        last_value: setpoint,
      },
      'ac-mode': {
        selector: 'ac-mode',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        min: 0,
        max: 4,
        last_value: mode,
      },
      'ac-power': {
        selector: 'ac-power',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
        last_value: power,
      },
    });

    it('should power the unit on, put it in heating, then write the setpoint', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: acFeatures({ mode: AC_MODE.COOLING, power: 0 }) });

      await regulate(mod, gladys, acDevice());

      const writes = gladys.device.setValue.getCalls().map((call) => [call.args[1].selector, call.args[2]]);
      // AC_MODE.HEATING is 2, where THERMOSTAT_MODE.HEATING is 1: written as 1, the
      // unit would be put in cooling.
      expect(writes).to.deep.equal([
        ['ac-power', 1],
        ['ac-mode', AC_MODE.HEATING],
        ['ac-setpoint', 21],
      ]);
    });

    it('should translate the cooling mode', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: acFeatures({ mode: AC_MODE.HEATING }) });

      await regulate(mod, gladys, acDevice({ THERMOSTAT_MODE: 'cooling' }));

      expect(writtenOn(gladys, 'ac-mode')).to.equal(AC_MODE.COOLING);
    });

    it('should leave a unit already running in the right mode alone', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: acFeatures({ setpoint: 21 }) });

      await regulate(mod, gladys, acDevice());

      assert.notCalled(gladys.device.setValue);
    });

    // AC_MODE has no off, and 0 is AUTO: writing THERMOSTAT_MODE.OFF there would
    // start the unit. The power is what stops it.
    it('should stop the unit through its power, never through its mode', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: acFeatures() });

      await regulate(mod, gladys, acDevice());

      expect(writtenOn(gladys, 'ac-mode')).to.equal(undefined);
      expect(writtenOn(gladys, 'ac-power')).to.equal(0);
      // No setpoint after the power: a setpoint command can turn the unit back on.
      expect(writtenOn(gladys, 'ac-setpoint')).to.equal(undefined);
    });

    it('should power the unit off when a window opens', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({
        features: { ...acFeatures(), 'window-sensor': { selector: 'window-sensor', last_value: 0 } },
      });

      await regulate(mod, gladys, acDevice({ THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }));

      expect(writtenOn(gladys, 'ac-power')).to.equal(0);
    });

    it('should power the unit back on for a manual hold', async () => {
      const mod = load(fullDaySchedule('comfort'));
      const gladys = buildGladys({ features: acFeatures({ power: 0 }) });

      await regulate(
        mod,
        gladys,
        heldExternalDevice(23, {
          THERMOSTAT_TARGET_FEATURE: 'ac-setpoint',
          THERMOSTAT_MODE_FEATURE: 'ac-mode',
          THERMOSTAT_POWER_FEATURE: 'ac-power',
        }),
      );

      expect(writtenOn(gladys, 'ac-power')).to.equal(1);
      expect(writtenOn(gladys, 'ac-setpoint')).to.equal(23);
    });

    // The power is optional and not tied to the category: any external
    // thermostat with a power switch is stopped by it, and by it alone.
    it('should stop a thermostat through a power switch alone', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({
        features: {
          'netatmo-setpoint': targetFeature(),
          'boiler-power': { selector: 'boiler-power', last_value: 1 },
        },
      });

      await regulate(mod, gladys, externalDevice({ THERMOSTAT_POWER_FEATURE: 'boiler-power' }));

      const order = gladys.device.setValue.getCalls().map((call) => call.args[1].selector);
      expect(order).to.deep.equal(['boiler-power']);
    });

    // A power that could not be cut is no stop: the setpoint fallback applies
    // again, except on an air conditioner, which a setpoint could switch on.
    const failingOn = (gladys, failing) => {
      gladys.device.setValue = fake((device, feature) =>
        feature.selector === failing ? Promise.reject(new Error('offline')) : Promise.resolve(null),
      );
    };

    it('should fall back on the frost setpoint when the power cannot be cut', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({
        features: {
          'netatmo-setpoint': targetFeature(),
          'boiler-power': { selector: 'boiler-power', last_value: 1 },
        },
      });
      failingOn(gladys, 'boiler-power');

      await regulate(mod, gladys, externalDevice({ THERMOSTAT_POWER_FEATURE: 'boiler-power' }));

      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(7);
    });

    it('should fall back on the frost setpoint when the power feature is gone', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: { 'netatmo-setpoint': targetFeature() } });

      await regulate(mod, gladys, externalDevice({ THERMOSTAT_POWER_FEATURE: 'boiler-power' }));

      expect(writtenOn(gladys, 'netatmo-setpoint')).to.equal(7);
    });

    it('should write no setpoint to an air conditioner whose power cannot be cut', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: acFeatures() });
      failingOn(gladys, 'ac-power');

      await regulate(mod, gladys, acDevice());

      expect(writtenOn(gladys, 'ac-setpoint')).to.equal(undefined);
    });

    it('should write no setpoint when neither the power nor the setpoint can be read', async () => {
      const mod = load(fullDaySchedule('off'));
      const gladys = buildGladys({ features: {} });
      const { get } = gladys.device;
      gladys.device.get = fake((query) =>
        query && query.device_feature_selectors === 'netatmo-setpoint'
          ? Promise.reject(new Error('locked'))
          : get(query),
      );

      await regulate(mod, gladys, externalDevice({ THERMOSTAT_POWER_FEATURE: 'boiler-power' }));

      assert.notCalled(gladys.device.setValue);
    });

    // The power this service stands behind is marked, so that its report is not
    // taken for the unit switched from its remote (C.0.1).
    describe('power marks', () => {
      const regulateWithMarks = (mod, gladys, device, marks) =>
        mod.regulateDevice(gladys, device, todayDow, 12 * 60, null, null, null, marks);

      it('should mark the power it cuts', async () => {
        const mod = load(fullDaySchedule('off'));
        const gladys = buildGladys({ features: acFeatures() });
        const marks = new Map();

        await regulateWithMarks(mod, gladys, acDevice(), marks);

        expect(marks.get('ac-power')).to.equal(0);
      });

      it('should mark the power it hands back', async () => {
        const mod = load(fullDaySchedule('comfort'));
        const gladys = buildGladys({ features: acFeatures({ power: 0 }) });
        const marks = new Map();

        await regulateWithMarks(mod, gladys, acDevice(), marks);

        expect(marks.get('ac-power')).to.equal(1);
      });

      // Nothing goes on the wire, but the unit switched off from its remote has to
      // differ from what Gladys stands behind, or powering it on again would be missed.
      it('should mark a power already in the wanted state', async () => {
        const mod = load(fullDaySchedule('comfort'));
        const gladys = buildGladys({ features: acFeatures({ setpoint: 21 }) });
        const marks = new Map([['ac-power', 0]]);

        await regulateWithMarks(mod, gladys, acDevice(), marks);

        assert.notCalled(gladys.device.setValue);
        expect(marks.get('ac-power')).to.equal(1);
      });

      it('should drop the mark of a power that could not be written', async () => {
        const mod = load(fullDaySchedule('off'));
        const gladys = buildGladys({ features: acFeatures() });
        gladys.device.setValue = fake.rejects(new Error('offline'));
        const marks = new Map();

        await regulateWithMarks(mod, gladys, acDevice(), marks);

        expect(marks.has('ac-power')).to.equal(false);
      });
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

  // The hold is armed through the real `setManualHold`, so what the test asserts
  // is the param actually written — and, just as importantly, that nothing is
  // written back to the appliance.
  const loadListener = () =>
    proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
      './thermostat.setValue': { holdExpiry: fake.resolves(null) },
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
    gladys: {
      device: { get: fake.resolves(devices), setParam: fake.resolves(null), setValue: fake.resolves(null) },
      event: { emit: fake.returns(null) },
    },
    windowSelectorsCache: null,
    targetSelectorsCache: null,
    selfWrittenSetpoints: new Map(),
    observedSetpoints: new Map(),
  });

  // A hold is armed on a *change*, so a reference report has to exist first. The
  // very first report after a start only records what the device carries — see
  // the restart tests at the end of this block.
  const withReference = (handler, selector, value) => {
    handler.observedSetpoints.set(selector, value);
    return handler;
  };

  // The setpoint a hold was armed on, or null when none was.
  const heldSetpoint = (handler) => {
    const call = handler.gladys.device.setParam.getCalls().find((c) => c.args[1] === 'THERMOSTAT_MANUAL_SETPOINT');
    return call ? call.args[2] : null;
  };

  it('should hold a setpoint changed on the device itself', async () => {
    const mod = loadListener();
    // The device was reporting 21; the dial is turned to 19.
    const handler = withReference(buildHandler(), 'netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    expect(heldSetpoint(handler)).to.equal('19');
    // The device already carries this value — it is what it just reported.
    // Writing it back would be a cloud call per turn of the dial, and would hand
    // the running mode back to a thermostat that may be in AUTO or in its own
    // vendor programme.
    assert.notCalled(handler.gladys.device.setValue);
  });

  // A setting made on the device arms the hold on its first report; the periodic
  // reports that follow carry that same value. Re-arming on those would push the
  // expiry forward on every report — every 15 s on Zigbee2MQTT, every two minutes
  // on a polled Netatmo — so a 30-minute hold would never end and a thermostat
  // with a programme would never get it back.
  it('should not re-arm a hold it is already holding at that value', async () => {
    const mod = loadListener();
    const handler = withReference(
      buildHandler([
        {
          ...externalThermostat,
          params: [...externalThermostat.params, { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '22' }],
        },
      ]),
      // Anything but 22: the report has to be a change, or it stops at the
      // previous guard and this branch is never reached.
      'netatmo-setpoint',
      20,
    );

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 22);

    expect(heldSetpoint(handler)).to.equal(null);
  });

  it('should hold a further change made on the device', async () => {
    // The counterpart: a hold at 22 does not stop a move to 23 from being held.
    const mod = loadListener();
    const handler = withReference(
      buildHandler([
        {
          ...externalThermostat,
          params: [...externalThermostat.params, { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '22' }],
        },
      ]),
      'netatmo-setpoint',
      22,
    );

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 23);

    expect(heldSetpoint(handler)).to.equal('23');
  });

  // Our own write is reported back as the very same event: taking it for a change
  // made on the device would arm a manual hold on every scheduled write, and the
  // schedule would suspend itself for ever.
  it('should ignore the report of a setpoint this service just wrote', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.selfWrittenSetpoints.set('netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);

    expect(heldSetpoint(handler)).to.equal(null);
    // The mark is KEPT, not consumed: a change is what differs from the last
    // value this service wrote.
    expect(handler.selfWrittenSetpoints.get('netatmo-setpoint')).to.equal(21);
  });

  // Zigbee2MQTT reports periodically and Netatmo is polled every two minutes,
  // both re-emitting an unchanged value. Consuming the mark on the first report
  // would make the second one look like a setting made on the device: a hold
  // would be armed, the same value rewritten (a cloud call per poll), and the
  // cycle would start again — leaving the thermostat stuck in "manual" for ever.
  it('should ignore an unchanged value however many times it is reported', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.selfWrittenSetpoints.set('netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);
    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);
    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);

    expect(heldSetpoint(handler)).to.equal(null);
  });

  it('should hold a change made on the device after our own value was reported back', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.selfWrittenSetpoints.set('netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);
    // Someone turns the dial: this one differs, so it is a real change.
    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 23);

    expect(heldSetpoint(handler)).to.equal('23');
  });

  it('should hold a change to a different value than the one written', async () => {
    const mod = loadListener();
    const handler = withReference(buildHandler(), 'netatmo-setpoint', 21);
    handler.selfWrittenSetpoints.set('netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    expect(heldSetpoint(handler)).to.equal('19');
  });

  it('should ignore a thermostat whose target param disappeared', async () => {
    const mod = loadListener();
    // The selector is cached, but the device no longer carries the param: the
    // config changed between the cache build and the event.
    const handler = buildHandler([]);
    handler.targetSelectorsCache = new Set(['netatmo-setpoint']);
    handler.windowSelectorsCache = new Set();

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    expect(heldSetpoint(handler)).to.equal(null);
  });

  it('should ignore a feature no thermostat drives', async () => {
    const mod = loadListener();
    const handler = buildHandler();

    await mod.onExternalSetpointChanged.call(handler, 'some-other-feature', 19);

    expect(heldSetpoint(handler)).to.equal(null);
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

    expect(heldSetpoint(handler)).to.equal(null);
  });

  // A restart empties `selfWrittenSetpoints`, which lives only in memory. The
  // integration then reconnects and re-reports the setpoint the schedule had
  // already applied — an unchanged value that used to be read as a turn of the
  // dial, so every update, reboot or power cut left the thermostat in "manual"
  // until the next slot, with nobody having touched anything. The reference is
  // seeded from the database at start, so that report matches it.
  it('should not hold the reconnection report of an unchanged setpoint', async () => {
    const mod = loadListener();
    const handler = withReference(buildHandler(), 'netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);

    expect(heldSetpoint(handler)).to.equal(null);
  });

  // The other half of the restart bug: the write at startup failed because the
  // integration was not connected yet, so the appliance still carries the old
  // value. Its first report used to be taken for a manual setting, and those 19
  // degrees were then held in place of the scheduled comfort — for hours, a whole
  // night in PG's test. The database holds that same old value, so the report
  // matches the seeded reference and the minute loop writes the right setpoint on
  // its next tick.
  it('should not hold a stale value reported after a failed startup write', async () => {
    const mod = loadListener();
    const handler = withReference(buildHandler(), 'netatmo-setpoint', 19);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);

    expect(heldSetpoint(handler)).to.equal(null);
    assert.notCalled(handler.gladys.device.setValue);
  });

  // The regression PG found: a setpoint set on the thermostat seconds after a
  // restart was silently dropped. With "the first report only records the
  // reference", that genuine change *was* the first report — and on a device that
  // only reports its changes, as Zigbee ones do, no further report would ever come
  // to establish one, so the first change after every restart was lost for good.
  it('should hold a setpoint set on the device right after a restart', async () => {
    const mod = loadListener();
    // Seeded from the database at service start: the device was at 18.
    const handler = withReference(buildHandler(), 'netatmo-setpoint', 18);

    // Nothing else has reported yet — this is the very first event.
    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 20);

    expect(heldSetpoint(handler)).to.equal('20');
  });

  // The observed value is recorded before the self-write check, not after: the echo
  // of our own write is swallowed by that check but is still a report, and leaving
  // the reference unset there made the next turn of the dial look like a first
  // report and go unheld.
  it('should record the reference even on a report it swallows as its own echo', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.selfWrittenSetpoints.set('netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);

    expect(handler.observedSetpoints.get('netatmo-setpoint')).to.equal(21);
  });

  // Seeding the reference from the database at service start, so it is in place
  // before any report can arrive. It cannot be read when the report lands:
  // `device.saveState` persists that same report on the same event, and the
  // listener would race the write.
  describe('primeObservedSetpoints', () => {
    const buildPrimeHandler = (lastValue) => ({
      gladys: {
        device: {
          get: fake(async (options) => {
            // The lookup by selector resolves the owning device of the external
            // setpoint feature; the unfiltered call builds the selector cache.
            if (options && options.device_feature_selectors) {
              return [{ selector: 'netatmo', features: [{ selector: 'netatmo-setpoint', last_value: lastValue }] }];
            }
            return [externalThermostat];
          }),
        },
      },
      windowSelectorsCache: null,
      targetSelectorsCache: null,
      powerSelectorsCache: null,
      selfWrittenSetpoints: new Map(),
      observedSetpoints: new Map(),
      selfWrittenPowers: new Map(),
      observedPowers: new Map(),
    });

    it('should seed the reference from the stored value', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(18);

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedSetpoints.get('netatmo-setpoint')).to.equal(18);
    });

    // A unit re-reporting after a restart the power the programme had cut must not
    // read as a unit switched off from its remote.
    it('should seed the power reference from the stored value', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(18);
      handler.gladys.device.get = fake(async (options) => {
        if (options && options.device_feature_selectors === 'ac-power') {
          return [{ selector: 'ac', features: [{ selector: 'ac-power', last_value: 0 }] }];
        }
        if (options && options.device_feature_selectors) {
          return [];
        }
        return [
          {
            ...externalThermostat,
            params: [...externalThermostat.params, { name: 'THERMOSTAT_POWER_FEATURE', value: 'ac-power' }],
          },
        ];
      });
      handler.observedPowers.set('old-power', 1);
      handler.selfWrittenPowers.set('old-power', 1);

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedPowers.get('ac-power')).to.equal(0);
      expect(handler.observedPowers.has('old-power')).to.equal(false);
      expect(handler.selfWrittenPowers.has('old-power')).to.equal(false);
    });

    it('should leave a feature that never reported without a reference', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(null);

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedSetpoints.has('netatmo-setpoint')).to.equal(false);
    });

    it('should leave a selector whose feature no longer exists without a reference', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(18);
      handler.gladys.device.get = fake(async (options) => {
        if (options && options.device_feature_selectors) {
          return [];
        }
        return [externalThermostat];
      });

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedSetpoints.has('netatmo-setpoint')).to.equal(false);
    });

    it('should forget the references of a selector no thermostat targets any more', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(18);
      // A target re-pointed by a migration: the old selector is no longer configured.
      handler.observedSetpoints.set('old-netatmo-setpoint', 20);
      handler.selfWrittenSetpoints.set('old-netatmo-setpoint', 20);

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedSetpoints.has('old-netatmo-setpoint')).to.equal(false);
      expect(handler.selfWrittenSetpoints.has('old-netatmo-setpoint')).to.equal(false);
      expect(handler.observedSetpoints.get('netatmo-setpoint')).to.equal(18);
    });

    it('should not overwrite a report that arrived while the stored value was read', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(18);
      // Primed again from postUpdate, with the listener live: a report lands
      // between the check and the read, and is fresher than the database.
      const { get } = handler.gladys.device;
      handler.gladys.device.get = fake(async (options) => {
        if (options && options.device_feature_selectors) {
          handler.observedSetpoints.set('netatmo-setpoint', 22);
        }
        return get(options);
      });

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedSetpoints.get('netatmo-setpoint')).to.equal(22);
    });

    it('should not overwrite a reference already in memory', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(18);
      // Fresher than the database's: this thermostat has reported since.
      handler.observedSetpoints.set('netatmo-setpoint', 21);

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedSetpoints.get('netatmo-setpoint')).to.equal(21);
    });

    // Priming must never stop the service from starting: without a reference the
    // listener simply establishes one on the first report.
    it('should swallow a failure to read the devices', async () => {
      const mod = loadListener();
      const handler = buildPrimeHandler(18);
      handler.gladys.device.get = fake.rejects(new Error('database down'));

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedSetpoints.size).to.equal(0);
    });
  });

  it('should not hold an unchanged value reported again', async () => {
    const mod = loadListener();
    const handler = withReference(buildHandler(), 'netatmo-setpoint', 21);

    await mod.onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 21);

    expect(heldSetpoint(handler)).to.equal(null);
  });

  it('should survive a failing hold', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.gladys.device.setParam = fake.rejects(new Error('database down'));

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

    expect(heldSetpoint(handler)).to.equal(null);
  });
});

// An air conditioner switched off from its remote must not be powered back on by
// the next pass: the power cut is taken as a stop, like the widget's Off button.
describe('thermostat.onExternalPowerChanged', () => {
  afterEach(() => {
    sinon.restore();
  });

  const loadListener = () =>
    proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
      './thermostat.setValue': { holdExpiry: fake.resolves(null) },
      '../../../utils/logger': {
        debug: fake.returns(null),
        info: fake.returns(null),
        warn: fake.returns(null),
      },
    });

  const thermostatModeFeature = (mode) => ({
    selector: 'ac-thermostat-mode',
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
    last_value: mode,
  });

  const acThermostat = ({ mode = THERMOSTAT_MODE.HEATING, running = 'heating', features } = {}) => ({
    selector: 'ac-thermostat',
    features: features || [thermostatModeFeature(mode)],
    params: [
      { name: 'THERMOSTAT_TYPE', value: 'external' },
      { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
      { name: 'THERMOSTAT_POWER_FEATURE', value: 'ac-power' },
      { name: 'THERMOSTAT_MODE', value: running },
    ],
  });

  // The unit was reporting `previous` (null: never reported): a report is a
  // change only against it.
  const buildHandler = ({ devices = [acThermostat()], previous = 1 } = {}) => {
    const handler = {
      gladys: { device: { get: fake.resolves(devices) } },
      windowSelectorsCache: null,
      targetSelectorsCache: null,
      powerSelectorsCache: null,
      selfWrittenPowers: new Map(),
      observedPowers: new Map(),
      setValue: fake.resolves(null),
    };
    if (previous !== null) {
      handler.observedPowers.set('ac-power', previous);
    }
    return handler;
  };

  it('should stop the thermostat when the unit is switched off on the device', async () => {
    const mod = loadListener();
    const handler = buildHandler();

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 0);

    assert.calledOnce(handler.setValue);
    expect(handler.setValue.firstCall.args[1].selector).to.equal('ac-thermostat-mode');
    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.OFF);
  });

  it('should start a stopped thermostat when the unit is switched on on the device', async () => {
    const mod = loadListener();
    const handler = buildHandler({
      devices: [acThermostat({ mode: THERMOSTAT_MODE.OFF, running: 'cooling' })],
      previous: 0,
    });

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

    assert.calledOnce(handler.setValue);
    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.COOLING);
  });

  describe('a unit switched on carrying a setpoint of its own', () => {
    // The unit reports `setpoint`, and this service last wrote `written`
    // (null: nothing written since the start). The power cut that stopped
    // the thermostat dropped the hold the remote's setpoint had armed.
    const startingHandler = ({ setpoint = 21, written = 20.5, unitFound = true, extraParams = [] } = {}) => {
      const thermostat = acThermostat({ mode: THERMOSTAT_MODE.OFF });
      thermostat.params.push(...extraParams);
      const unit = { selector: 'ac', features: [{ selector: 'ac-setpoint', last_value: setpoint }] };
      const handler = buildHandler({ devices: [thermostat], previous: 0 });
      handler.gladys.device.get = fake((query) =>
        Promise.resolve(query.device_feature_selectors ? [unitFound ? unit : null].filter(Boolean) : [thermostat]),
      );
      handler.gladys.device.setParam = fake.resolves(null);
      handler.gladys.event = { emit: fake.returns(null) };
      handler.selfWrittenSetpoints = new Map();
      if (written !== null) {
        handler.selfWrittenSetpoints.set('ac-setpoint', written);
      }
      return handler;
    };

    it('should start the thermostat on the setpoint the unit carries', async () => {
      const mod = loadListener();
      const handler = startingHandler();

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT', '21');
      // Held before the start, whose regulation pass must find it.
      assert.callOrder(handler.gladys.device.setParam, handler.setValue);
      expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.HEATING);
    });

    it('should not hold the setpoint this service last wrote', async () => {
      const mod = loadListener();
      const handler = startingHandler({ setpoint: 20.5 });

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.notCalled(handler.gladys.device.setParam);
      assert.calledOnce(handler.setValue);
    });

    it('should not hold anything with no setpoint written since the start', async () => {
      const mod = loadListener();
      const handler = startingHandler({ written: null });

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.notCalled(handler.gladys.device.setParam);
      assert.calledOnce(handler.setValue);
    });

    it('should not hold anything when the service keeps no setpoint marks', async () => {
      const mod = loadListener();
      const handler = startingHandler();
      delete handler.selfWrittenSetpoints;

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.notCalled(handler.gladys.device.setParam);
      assert.calledOnce(handler.setValue);
    });

    it('should not hold anything when the setpoint feature is gone', async () => {
      const mod = loadListener();
      const handler = startingHandler({ unitFound: false });

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.notCalled(handler.gladys.device.setParam);
      assert.calledOnce(handler.setValue);
    });

    it('should not hold a setpoint the unit never reported', async () => {
      const mod = loadListener();
      const handler = startingHandler({ setpoint: null });

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.notCalled(handler.gladys.device.setParam);
      assert.calledOnce(handler.setValue);
    });

    it('should not re-arm a hold already on that setpoint', async () => {
      const mod = loadListener();
      const handler = startingHandler({ extraParams: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' }] });

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.notCalled(handler.gladys.device.setParam);
      assert.calledOnce(handler.setValue);
    });
  });

  it('should take the report of a power it wrote for its own', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.selfWrittenPowers.set('ac-power', 0);

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 0);

    assert.notCalled(handler.setValue);
    expect(handler.observedPowers.get('ac-power')).to.equal(0);
  });

  it('should not act on a report that does not change the power', async () => {
    const mod = loadListener();
    const handler = buildHandler({ previous: 0 });

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 0);

    assert.notCalled(handler.setValue);
  });

  it('should only record the first report of a power it has no reference for', async () => {
    const mod = loadListener();
    const handler = buildHandler({ previous: null });

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 0);

    assert.notCalled(handler.setValue);
    expect(handler.observedPowers.get('ac-power')).to.equal(0);
  });

  it('should leave a thermostat already stopped alone when the unit is switched off', async () => {
    const mod = loadListener();
    const handler = buildHandler({ devices: [acThermostat({ mode: THERMOSTAT_MODE.OFF })] });

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 0);

    assert.notCalled(handler.setValue);
  });

  it('should leave a running thermostat alone when the unit is switched on', async () => {
    const mod = loadListener();
    const handler = buildHandler({ previous: 0 });

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

    assert.notCalled(handler.setValue);
  });

  it('should skip a thermostat without a mode feature', async () => {
    const mod = loadListener();
    const handler = buildHandler({ devices: [acThermostat({ features: [] })] });

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 0);

    assert.notCalled(handler.setValue);
  });

  it('should ignore a feature that is not a driven power', async () => {
    const mod = loadListener();
    const handler = buildHandler();

    await mod.onExternalPowerChanged.call(handler, 'kitchen-light', 0);

    assert.notCalled(handler.setValue);
    expect(handler.observedPowers.has('kitchen-light')).to.equal(false);
  });

  it('should ignore a report without a value', async () => {
    const mod = loadListener();
    const handler = buildHandler();

    await mod.onExternalPowerChanged.call(handler, 'ac-power', null);

    assert.notCalled(handler.gladys.device.get);
  });

  it('should swallow a failure to stop the thermostat', async () => {
    const mod = loadListener();
    const handler = buildHandler();
    handler.setValue = fake.rejects(new Error('database locked'));

    await mod.onExternalPowerChanged.call(handler, 'ac-power', 0);

    assert.calledOnce(handler.setValue);
  });

  it('should be reached from the device new-state listener', async () => {
    const mod = loadListener();
    const handler = {
      ...buildHandler(),
      selfWrittenSetpoints: new Map(),
      observedSetpoints: new Map(),
    };

    await mod.onDeviceNewState.call(handler, { device_feature: 'ac-power', state: 0 });

    assert.calledOnce(handler.setValue);
  });
});
