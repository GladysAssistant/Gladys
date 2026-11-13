const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake } = sinon;

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

const logger = {
  debug: fake.returns(null),
  info: fake.returns(null),
  warn: fake.returns(null),
};

const mod = proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
  '../../../models': {
    ThermostatScheduleDevice: { findOne: fake.resolves(null), count: fake.resolves(0) },
    ThermostatSchedule: {},
    ThermostatScheduleTransition: {},
  },
  './thermostat.scheduleDevice': { followsSchedule: fake.resolves(false) },
  '../../../utils/logger': logger,
});

// A two-relay module wired to the pilot wire through two diodes (C.1.2): each
// output is a plain switch in Gladys, and the two states together are the order.
const buildGladys = ({ q1 = 0, q2 = 0, windowOpen = false, temp = 18, missing = null, failing = null } = {}) => {
  const features = {
    'relay-q1': { selector: 'relay-q1', last_value: q1 },
    'relay-q2': { selector: 'relay-q2', last_value: q2 },
    'window-sensor': { selector: 'window-sensor', last_value: windowOpen ? 0 : 1 },
    'temp-sensor': { selector: 'temp-sensor', last_value: temp },
  };
  return {
    device: {
      get: fake((query) => {
        const selector = query && query.device_feature_selectors;
        return Promise.resolve(
          features[selector] && selector !== missing ? [{ selector: 'owner', features: [features[selector]] }] : [],
        );
      }),
      setValue: fake((device, feature) =>
        feature.selector === failing ? Promise.reject(new Error('relay unreachable')) : Promise.resolve(null),
      ),
      saveState: fake.resolves(null),
      setParam: fake.resolves(null),
    },
    variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
    event: { emit: fake.returns(null) },
  };
};

const thermostatFeature = (type, lastValue = null) => ({
  selector: `thermostat-office:${type}`,
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type,
  last_value: lastValue,
});

const twoSwitchDevice = (preset, extra = {}, mode = THERMOSTAT_MODE.HEATING) => {
  const params = {
    THERMOSTAT_TYPE: 'pilot-wire',
    THERMOSTAT_PILOT_WIRE_SWITCH_FEATURE: '["relay-q1","relay-q2"]',
    THERMOSTAT_MODE: 'heating',
    THERMOSTAT_WINDOW_DELAY: '0',
    ...extra,
  };
  return {
    id: 'device-id',
    selector: 'office',
    features: [
      thermostatFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE),
      thermostatFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET, THERMOSTAT_PRESET[preset.toUpperCase()]),
      thermostatFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.MODE, mode),
      thermostatFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE),
    ],
    params: Object.keys(params).map((name) => ({ name, value: params[name] })),
  };
};

// The switches written, as `{ 'relay-q1': 1 }`.
const written = (gladys) =>
  gladys.device.setValue
    .getCalls()
    .reduce((writes, call) => ({ ...writes, [call.args[1].selector]: call.args[2] }), {});

const savedOperatingStates = (gladys) =>
  gladys.device.saveState
    .getCalls()
    .filter((call) => call.args[0].type === DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE)
    .map((call) => call.args[1]);

const regulate = (gladys, device, selfWritten = null) =>
  mod.regulateDevice(gladys, device, todayDow, 12 * 60, null, selfWritten);

describe('thermostat pilot wire on two switches', () => {
  afterEach(() => {
    sinon.resetHistory();
  });

  it('should set the two switches to the state of the order the preset sends', async () => {
    // Comfort carried (off, off); eco is both on in the default wiring.
    const gladys = buildGladys();

    await regulate(gladys, twoSwitchDevice('eco'));

    expect(written(gladys)).to.deep.equal({ 'relay-q1': 1, 'relay-q2': 1 });
  });

  it('should only actuate the switch that has to change', async () => {
    // Eco carried (on, on); frost protection is (off, on).
    const gladys = buildGladys({ q1: 1, q2: 1 });

    await regulate(gladys, twoSwitchDevice('frost'));

    expect(written(gladys)).to.deep.equal({ 'relay-q1': 0 });
  });

  it('should write nothing when the switches already carry the order', async () => {
    const gladys = buildGladys({ q1: 0, q2: 0 });

    await regulate(gladys, twoSwitchDevice('comfort'));

    expect(gladys.device.setValue.callCount).to.equal(0);
  });

  it('should follow the states set for this heater rather than the default wiring', async () => {
    const gladys = buildGladys();

    await regulate(
      gladys,
      twoSwitchDevice('eco', {
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_COMFORT: '11',
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_ECO: '10',
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_FROST_PROTECTION: '01',
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_OFF: '00',
      }),
    );

    expect(written(gladys)).to.deep.equal({ 'relay-q1': 1 });
  });

  it('should send comfort for a derived comfort, which two switches cannot carry', async () => {
    const gladys = buildGladys({ q1: 1, q2: 1 });

    await regulate(gladys, twoSwitchDevice('night', { THERMOSTAT_PILOT_WIRE_ORDER_NIGHT: PILOT_WIRE_MODE.COMFORT_2 }));

    expect(written(gladys)).to.deep.equal({ 'relay-q1': 0, 'relay-q2': 0 });
  });

  it('should write both switches while one of them has no state yet', async () => {
    const gladys = buildGladys({ q1: null, q2: 0 });

    await regulate(gladys, twoSwitchDevice('eco'));

    expect(written(gladys)).to.deep.equal({ 'relay-q1': 1, 'relay-q2': 1 });
  });

  it('should send off when the thermostat is stopped', async () => {
    const gladys = buildGladys();

    await regulate(gladys, twoSwitchDevice('comfort', {}, THERMOSTAT_MODE.OFF));

    expect(written(gladys)).to.deep.equal({ 'relay-q1': 1 });
  });

  it('should put the heater on frost protection when a window opens', async () => {
    const gladys = buildGladys({ windowOpen: true });

    await regulate(gladys, twoSwitchDevice('comfort', { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' }));

    expect(written(gladys)).to.deep.equal({ 'relay-q2': 1 });
  });

  it('should send comfort then the standby order when Gladys regulates', async () => {
    const regulated = { THERMOSTAT_TYPE: 'virtual', THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor' };
    // 18 °C under comfort at 21 °C, on frost protection: heat.
    const cold = buildGladys({ q1: 0, q2: 1, temp: 18 });
    await regulate(cold, twoSwitchDevice('comfort', regulated));
    expect(written(cold)).to.deep.equal({ 'relay-q2': 0 });
    expect(savedOperatingStates(cold)).to.deep.equal([THERMOSTAT_OPERATING_STATE.HEATING]);

    // 23 °C on comfort: rest on frost protection.
    const warm = buildGladys({ q1: 0, q2: 0, temp: 23 });
    await regulate(warm, twoSwitchDevice('comfort', regulated));
    expect(written(warm)).to.deep.equal({ 'relay-q2': 1 });
    expect(savedOperatingStates(warm)).to.deep.equal([THERMOSTAT_OPERATING_STATE.IDLE]);
  });

  it('should leave no mark: the switches are not followed as a module is', async () => {
    const gladys = buildGladys();
    const selfWritten = new Map();

    await regulate(gladys, twoSwitchDevice('eco'), selfWritten);

    expect(selfWritten.size).to.equal(0);
  });

  it('should try both switches when a write fails, and leave no mark', async () => {
    const gladys = buildGladys({ failing: 'relay-q1' });
    const selfWritten = new Map();

    await regulate(gladys, twoSwitchDevice('eco'), selfWritten);

    expect(gladys.device.setValue.callCount).to.equal(2);
    expect(selfWritten.size).to.equal(0);
    expect(logger.warn.lastCall.args[0]).to.contain('relay unreachable');
  });

  it('should write nothing when one of the switches is gone', async () => {
    const gladys = buildGladys({ missing: 'relay-q2' });

    await regulate(gladys, twoSwitchDevice('eco'));

    expect(gladys.device.setValue.callCount).to.equal(0);
    expect(logger.warn.lastCall.args[0]).to.contain('relay-q1", "relay-q2');
  });
});
