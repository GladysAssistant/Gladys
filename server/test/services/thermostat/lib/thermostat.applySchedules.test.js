const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

// The regulation loop resolves the setpoint feature by category and type,
// never by position in the features array.
const thermostatFeature = (extra = {}) => ({
  selector: 'thermostat-living-room',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
  ...extra,
});

// Build a slot covering the whole day so the current time always matches.
const fullDaySlot = (preset) => ({
  day_of_week: 0,
  start_time: '00:00',
  end_time: '00:00', // 00:00 end = end of day (1440)
  preset,
});

// Schedule slots use the real "today" day-of-week so findMatchingPreset matches now.
// Regulation reads the clock in the Gladys timezone, which falls back to
// Europe/Paris when the TIMEZONE variable is unset, as it is in these fixtures.
const { getCurrentDayAndMinutes } = require('../../../../utils/thermostatSchedule');

const todayDow = getCurrentDayAndMinutes(new Date(), 'Europe/Paris').dayOfWeek;

const buildSchedule = (preset) => ({
  selector: 'my-schedule',
  slots: [{ ...fullDaySlot(preset), day_of_week: todayDow }],
});

const buildDb = (schedule) => ({
  ThermostatSchedule: {
    findOne: fake.resolves(schedule),
  },
  ThermostatScheduleSlot: {},
});

const loadModule = (schedule) =>
  proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
    '../../../models': buildDb(schedule),
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

// Helper to build a thermostat device with params-based config.
const buildThermostatDevice = (params) => ({
  features: [thermostatFeature()],
  params,
});

const baseParams = (overrides = {}) => {
  const map = {
    THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
    THERMOSTAT_SWITCH_FEATURE: 'heater-switch',
    // The active schedule is device-owned since the config moved off the dashboard.
    THERMOSTAT_ACTIVE_SCHEDULE: 'my-schedule',
    THERMOSTAT_MODE: 'heating',
    THERMOSTAT_HYSTERESIS_START: '0.5',
    THERMOSTAT_HYSTERESIS_STOP: '0.5',
    THERMOSTAT_PRESET_COMFORT: '21',
    ...overrides,
  };
  return Object.keys(map).map((name) => ({ name, value: map[name] }));
};

describe('thermostat.applySchedules (integration)', () => {
  let gladysDeviceSetValue;
  let gladysVariableSetValue;
  let eventEmit;

  const makeGladys = ({ devices, variables, switchOn, currentTemp, windowOpen = false }) => {
    gladysDeviceSetValue = fake.resolves(null);
    gladysVariableSetValue = fake.resolves(null);
    eventEmit = fake.returns(null);

    const switchDevice = {
      features: [{ selector: 'heater-switch', last_value: switchOn ? 1 : 0 }],
    };
    const tempDevice = {
      features: [{ selector: 'temp-sensor', last_value: currentTemp }],
    };
    // Window contact: last_value 0 = open (cuts heating), 1 = closed.
    const windowDevice = {
      features: [{ selector: 'window-sensor', last_value: windowOpen ? 0 : 1 }],
    };

    return {
      device: {
        get: fake((query) => {
          if (query && query.service === 'thermostat') {
            return Promise.resolve(devices);
          }
          if (query && query.device_feature_selectors === 'heater-switch') {
            return Promise.resolve([switchDevice]);
          }
          if (query && query.device_feature_selectors === 'temp-sensor') {
            return Promise.resolve([tempDevice]);
          }
          if (query && query.device_feature_selectors === 'window-sensor') {
            return Promise.resolve([windowDevice]);
          }
          return Promise.resolve([]);
        }),
        setValue: gladysDeviceSetValue,
        saveState: fake.resolves(null),
      },
      variable: {
        getValue: fake((key) => Promise.resolve((variables && variables[key]) || null)),
        setValue: gladysVariableSetValue,
      },
      event: { emit: eventEmit },
    };
  };

  beforeEach(() => {
    sinon.reset();
  });

  it('should do nothing when there are no thermostat devices', async () => {
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({ devices: [], variables: {}, switchOn: false, currentTemp: 18 });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    expect(gladysDeviceSetValue.called).to.equal(false);
  });

  it('should turn switch ON when heating and temp is below setpoint', async () => {
    const device = buildThermostatDevice(baseParams({ THERMOSTAT_PRESET_COMFORT: '21' }));
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: { THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule' },
      switchOn: false,
      currentTemp: 18,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    expect(gladysDeviceSetValue.calledOnce).to.equal(true);
    const [, , value] = gladysDeviceSetValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should turn switch OFF when heating and temp is above setpoint', async () => {
    const device = buildThermostatDevice(baseParams({ THERMOSTAT_PRESET_COMFORT: '21' }));
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: { THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule' },
      switchOn: true,
      currentTemp: 23,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    expect(gladysDeviceSetValue.calledOnce).to.equal(true);
    const [, , value] = gladysDeviceSetValue.firstCall.args;
    expect(value).to.equal(0);
  });

  it('should not change the switch when already at the desired state', async () => {
    const device = buildThermostatDevice(baseParams({ THERMOSTAT_PRESET_COMFORT: '21' }));
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: { THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule' },
      switchOn: true,
      currentTemp: 18, // heating, below setpoint → should be ON, already ON
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    expect(gladysDeviceSetValue.called).to.equal(false);
  });

  it('should turn switch OFF when matched preset is off', async () => {
    const device = buildThermostatDevice(baseParams());
    const mod = loadModule(buildSchedule('off'));
    const gladys = makeGladys({
      devices: [device],
      variables: { THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule' },
      switchOn: true,
      currentTemp: 18,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    expect(gladysDeviceSetValue.calledOnce).to.equal(true);
    const [, , value] = gladysDeviceSetValue.firstCall.args;
    expect(value).to.equal(0);
  });

  it('should do nothing when there is no schedule and no preset selected', async () => {
    const device = buildThermostatDevice(baseParams({ THERMOSTAT_ACTIVE_SCHEDULE: '' }));
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: {},
      switchOn: false,
      currentTemp: 18,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    expect(gladysDeviceSetValue.called).to.equal(false);
  });

  it('should regulate on the current preset when no schedule is configured', async () => {
    const device = buildThermostatDevice(baseParams({ THERMOSTAT_PRESET_COMFORT: '21' }));
    const mod = loadModule(null);
    const gladys = makeGladys({
      devices: [device],
      variables: { THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET: 'comfort' },
      switchOn: false,
      currentTemp: 18, // cold → heating must turn ON even without a schedule
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    expect(gladysDeviceSetValue.calledOnce).to.equal(true);
    const [, , value] = gladysDeviceSetValue.firstCall.args;
    expect(value).to.equal(1);
  });

  it('should not write the setpoint state when it did not change', async () => {
    const device = {
      features: [{ selector: 'thermostat-living-room', last_value: 21 }],
      params: baseParams({ THERMOSTAT_PRESET_COMFORT: '21' }),
    };
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: {
        THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET: 'comfort',
      },
      switchOn: true,
      currentTemp: 18, // already ON, stays ON
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    // Setpoint unchanged (21) and preset unchanged → no state write, no preset write, no emit
    expect(gladys.device.saveState.called).to.equal(false);
    const presetWrites = gladysVariableSetValue
      .getCalls()
      .filter((c) => c.args[0] === 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET');
    expect(presetWrites).to.have.lengthOf(0);
    expect(eventEmit.called).to.equal(false);
  });

  it('should cut heating when the window is open', async () => {
    const device = buildThermostatDevice(baseParams({ THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }));
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: { THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule' },
      switchOn: true,
      currentTemp: 18, // cold, would normally heat
      windowOpen: true,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    // The only setValue call should turn the switch OFF (window override).
    expect(gladysDeviceSetValue.calledOnce).to.equal(true);
    const [, , value] = gladysDeviceSetValue.firstCall.args;
    expect(value).to.equal(0);
  });

  it('should not apply the schedule preset when manual mode is active', async () => {
    const device = buildThermostatDevice(baseParams());
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: {
        THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE: 'true',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_SETPOINT: JSON.stringify({ setpoint: 22 }),
      },
      switchOn: false,
      currentTemp: 18,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    // The schedule preset variable must NOT be written while manual mode is active.
    const presetWrites = gladysVariableSetValue
      .getCalls()
      .filter((c) => c.args[0] === 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET');
    expect(presetWrites).to.have.lengthOf(0);
  });

  it('should revert manual mode and apply schedule when the manual timer expired', async () => {
    const device = buildThermostatDevice(baseParams());
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [device],
      variables: {
        THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE: 'true',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL: String(Date.now() - 1000),
      },
      switchOn: false,
      currentTemp: 18,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);
    // Manual mode should be turned off.
    const manualOff = gladysVariableSetValue
      .getCalls()
      .filter((c) => c.args[0] === 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE' && c.args[1] === 'false');
    expect(manualOff).to.have.lengthOf(1);
    // And the heating switch should be actuated by the schedule (ON, since cold).
    expect(gladysDeviceSetValue.called).to.equal(true);
  });

  it('should push the schedule preset back when the manual timer expires on the same preset', async () => {
    // Reproduces the reported bug: the schedule says "away" all day, the user
    // raises the temperature by hand (dashboards show "comfort"), and the timer
    // expires. The stored preset never left "away", so notifying only on change
    // left every open dashboard stuck on "comfort" until a page refresh.
    const device = buildThermostatDevice(baseParams());
    const mod = loadModule(buildSchedule('away'));
    const gladys = makeGladys({
      devices: [device],
      variables: {
        THERMOSTAT_ACTIVE_SCHEDULE_THERMOSTAT_LIVING_ROOM: 'my-schedule',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE: 'true',
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL: String(Date.now() - 1000),
        THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET: 'away',
      },
      switchOn: false,
      currentTemp: 18,
    });
    const ctx = { gladys, serviceId: 'svc' };
    await mod.applySchedules.call(ctx);

    const presetEvents = eventEmit
      .getCalls()
      .filter((c) => c.args[1] && c.args[1].type === 'thermostat.preset-updated' && c.args[1].payload.value === 'away');
    expect(presetEvents).to.have.lengthOf(1);
  });

  // One failing thermostat must not stop the others: they are regulated in
  // parallel, and a device whose integration is down would otherwise leave the
  // rest of the house unregulated until the next tick.
  it('should isolate a device that fails to regulate', async () => {
    const mod = loadModule(buildSchedule('comfort'));
    const gladys = makeGladys({
      devices: [buildThermostatDevice(baseParams()), buildThermostatDevice(baseParams())],
      variables: {},
      switchOn: false,
      currentTemp: 18,
    });
    // The first device blows up on the preset write, which regulateDevice does
    // not guard: the per-device catch is what keeps the second one regulated.
    let firstCall = true;
    const originalSetValue = gladys.variable.setValue;
    gladys.variable.setValue = fake((key, value, serviceId) => {
      if (key && key.endsWith('_PRESET') && firstCall) {
        firstCall = false;
        return Promise.reject(new Error('database down'));
      }
      return originalSetValue(key, value, serviceId);
    });

    await mod.applySchedules.call({ gladys, serviceId: 'svc' });

    // The second device was still regulated: its setpoint was written.
    expect(gladys.device.saveState.called).to.equal(true);
  });
});
