const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  PILOT_WIRE_MODE,
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
const presetFeature = (preset) => ({
  selector: 'thermostat-living-room:preset',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
  last_value: THERMOSTAT_PRESET[preset.toUpperCase()],
});

const buildGladys = ({ order = PILOT_WIRE_MODE.OFF, windowOpen = false } = {}) => {
  const setValue = fake.resolves(null);
  return {
    device: {
      get: fake((query) => {
        const selector = query && query.device_feature_selectors;
        if (selector === 'heater-pilot-wire') {
          return Promise.resolve([
            { selector: 'heater', features: [{ selector: 'heater-pilot-wire', last_value: order }] },
          ]);
        }
        if (selector === 'window-sensor') {
          return Promise.resolve([
            { selector: 'window', features: [{ selector: 'window-sensor', last_value: windowOpen ? 0 : 1 }] },
          ]);
        }
        if (selector === 'temp-sensor') {
          return Promise.resolve([{ selector: 'sensor', features: [{ selector: 'temp-sensor', last_value: 18 }] }]);
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
  features: [setpointFeature(), presetFeature(preset)],
  params: params({
    THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire',
    THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
    THERMOSTAT_MODE: 'heating',
    ...extra,
  }),
});

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

  it('should map away, eco and night onto eco', async () => {
    // The wire offers no "nobody home" and no "night": eco is what both ask for.
    await Promise.all(
      ['away', 'eco', 'night'].map(async (preset) => {
        const mod = load(null);
        const gladys = buildGladys();

        await regulate(mod, gladys, pilotWireDevice(preset));

        expect(gladys.device.setValue.firstCall.args[2], preset).to.equal(PILOT_WIRE_MODE.ECO);
      }),
    );
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

  it('should stop the heater when a window opens', async () => {
    const mod = load(null);
    const gladys = buildGladys({ order: PILOT_WIRE_MODE.COMFORT, windowOpen: true });

    await regulate(mod, gladys, pilotWireDevice('comfort', { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }));

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
    const gladys = buildGladys();
    gladys.device.setValue = fake.rejects(new Error('offline'));

    // One unreachable heater must not stop the pass for the others.
    await regulate(mod, gladys, pilotWireDevice('comfort'));
  });
});
