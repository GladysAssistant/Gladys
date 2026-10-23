const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  PILOT_WIRE_MODE,
  THERMOSTAT_MODE,
  THERMOSTAT_PRESET,
} = require('../../../../utils/constants');
const { getCurrentDayAndMinutes } = require('../../../../utils/thermostatSchedule');

const logger = () => ({
  debug: fake.returns(null),
  info: fake.returns(null),
  warn: fake.returns(null),
});

// An order changed on the module itself — its button, the vendor app — is a
// decision by whoever made it: it is taken as that preset picked by hand, so the
// next regulation pass does not write the scheduled order back over it (C.1.1).
describe('thermostat pilot wire: an order changed on the module', () => {
  afterEach(() => {
    sinon.restore();
  });

  const loadListener = () =>
    proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
      './thermostat.setValue': { holdExpiry: fake.resolves(null) },
      '../../../utils/logger': logger(),
    });

  const presetFeature = (preset) => ({
    selector: 'living-room:preset',
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
    last_value: THERMOSTAT_PRESET[preset.toUpperCase()],
  });
  const modeFeature = (mode) => ({
    selector: 'living-room:mode',
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
    last_value: mode,
  });

  const thermostat = ({ preset = 'schedule', mode = THERMOSTAT_MODE.HEATING, params = {}, features = null } = {}) => ({
    selector: 'living-room',
    features: features || [presetFeature(preset), modeFeature(mode)],
    params: Object.entries({ THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire', ...params }).map(([name, value]) => ({
      name,
      value,
    })),
  });

  const buildHandler = (device, { window = null, carried = null } = {}) => ({
    gladys: {
      device: {
        get: fake((query) => {
          if (query && query.service === 'thermostat') {
            return Promise.resolve([device]);
          }
          if (query && query.device_feature_selectors === 'heater-pilot-wire' && carried !== null) {
            return Promise.resolve([
              { selector: 'heater', features: [{ selector: 'heater-pilot-wire', last_value: carried }] },
            ]);
          }
          if (query && query.device_feature_selectors === 'window-sensor' && window !== null) {
            return Promise.resolve([
              { selector: 'window', features: [{ selector: 'window-sensor', last_value: window }] },
            ]);
          }
          return Promise.resolve([]);
        }),
        setParam: fake.resolves(null),
        setValue: fake.resolves(null),
      },
      event: { emit: fake.returns(null) },
    },
    setValue: fake.resolves(null),
    windowSelectorsCache: null,
    targetSelectorsCache: null,
    selfWrittenSetpoints: new Map(),
    // The module was on comfort: every report below is a change from it.
    observedSetpoints: new Map([['heater-pilot-wire', PILOT_WIRE_MODE.COMFORT]]),
  });

  const press = (mod, handler, order) => mod.onExternalSetpointChanged.call(handler, 'heater-pilot-wire', order);

  it('should take eco pressed on the module as eco picked by hand', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat());

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    // The same write path as the widget: the preset is saved and its hold armed.
    const [, feature, value] = handler.setValue.firstCall.args;
    expect(feature.type).to.equal(DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET);
    expect(value).to.equal(THERMOSTAT_PRESET.ECO);
    // Nothing goes back to the module: it already carries the order.
    assert.notCalled(handler.gladys.device.setValue);
  });

  it('should take frost protection pressed on the module as frost', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat());

    await press(mod, handler, PILOT_WIRE_MODE.FROST_PROTECTION);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.FROST);
  });

  it('should take a derived comfort as comfort', async () => {
    // Comfort -1 and -2 are comfort chosen on the heater, not a temperature
    // Gladys knows.
    const mod = loadListener();
    const handler = buildHandler(thermostat());
    handler.observedSetpoints.set('heater-pilot-wire', PILOT_WIRE_MODE.ECO);

    await press(mod, handler, PILOT_WIRE_MODE.COMFORT_1);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.COMFORT);
  });

  it('should stop the thermostat when the heater is turned off on the module', async () => {
    // Off is no preset: holding the frost setpoint instead would write frost
    // protection over the off that was just pressed.
    const mod = loadListener();
    const handler = buildHandler(thermostat());

    await press(mod, handler, PILOT_WIRE_MODE.OFF);

    const [, feature, value] = handler.setValue.firstCall.args;
    expect(feature.type).to.equal(DEVICE_FEATURE_TYPES.THERMOSTAT.MODE);
    expect(value).to.equal(THERMOSTAT_MODE.OFF);
  });

  it('should not take the order it wrote itself, reported back', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat());
    handler.selfWrittenSetpoints.set('heater-pilot-wire', PILOT_WIRE_MODE.ECO);

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    assert.notCalled(handler.setValue);
  });

  it('should not take a report that changes nothing', async () => {
    // A restart, or a periodic report: the module still carries the order the
    // database knows.
    const mod = loadListener();
    const handler = buildHandler(thermostat());

    await press(mod, handler, PILOT_WIRE_MODE.COMFORT);

    assert.notCalled(handler.setValue);
  });

  it('should ignore an order that is no pilot-wire value, without recording it', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat());

    await press(mod, handler, 9);

    assert.notCalled(handler.setValue);
    // The next real report is still compared against what the module carried.
    expect(handler.observedSetpoints.get('heater-pilot-wire')).to.equal(PILOT_WIRE_MODE.COMFORT);
  });

  // The module already carries the order pressed: OFF is written back at once
  // rather than at the next pass, and marked so its echo is not another press.
  const offWritten = (handler) => {
    const [, feature, value] = handler.gladys.device.setValue.firstCall.args;
    expect(feature.selector).to.equal('heater-pilot-wire');
    expect(value).to.equal(PILOT_WIRE_MODE.OFF);
    expect(handler.selfWrittenSetpoints.get('heater-pilot-wire')).to.equal(PILOT_WIRE_MODE.OFF);
  };

  it('should take nothing while the thermostat is stopped, and write off back at once', async () => {
    // The stop outranks a hold, and a hold armed behind it would resurface later
    // as a manual mode nobody remembers.
    const mod = loadListener();
    const handler = buildHandler(thermostat({ mode: THERMOSTAT_MODE.OFF }), { carried: PILOT_WIRE_MODE.ECO });

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    assert.notCalled(handler.setValue);
    offWritten(handler);
  });

  it('should take nothing while a window is open, and write off back at once', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat({ params: { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' } }), {
      window: 0,
      carried: PILOT_WIRE_MODE.ECO,
    });

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    assert.notCalled(handler.setValue);
    offWritten(handler);
  });

  it('should take the order once the window is closed', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat({ params: { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' } }), {
      window: 1,
    });

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.ECO);
  });

  it('should take the order when the window sensor cannot be found', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat({ params: { THERMOSTAT_WINDOW_FEATURE: 'window-sensor' } }));

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.ECO);
  });

  it('should not take again a comfort it already holds', async () => {
    // Comfort then comfort -1, which no preset sends: the same choice twice,
    // and taking it again would only push the hold's expiry forward.
    const mod = loadListener();
    const handler = buildHandler(thermostat({ preset: 'comfort', params: { THERMOSTAT_MANUAL_SETPOINT: '21' } }));
    handler.observedSetpoints.set('heater-pilot-wire', PILOT_WIRE_MODE.COMFORT);

    await press(mod, handler, PILOT_WIRE_MODE.COMFORT_1);

    assert.notCalled(handler.setValue);
  });

  it('should take an order as the preset set to send it', async () => {
    // Night set to comfort -2: pressed on the module, comfort -2 is night.
    const mod = loadListener();
    const handler = buildHandler(
      thermostat({
        preset: 'comfort',
        params: { THERMOSTAT_PILOT_WIRE_ORDER_NIGHT: String(PILOT_WIRE_MODE.COMFORT_2) },
      }),
    );

    await press(mod, handler, PILOT_WIRE_MODE.COMFORT_2);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.NIGHT);
  });

  it('should take a derived comfort as comfort when Gladys regulates, whatever night sends', async () => {
    // Under Gladys the module only carries comfort or frost from it: the table
    // of orders is the heater's, and does not apply.
    const mod = loadListener();
    const handler = buildHandler(
      thermostat({
        preset: 'eco',
        params: {
          THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
          THERMOSTAT_PILOT_WIRE_ORDER_NIGHT: String(PILOT_WIRE_MODE.COMFORT_2),
        },
      }),
    );

    await press(mod, handler, PILOT_WIRE_MODE.COMFORT_2);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.COMFORT);
  });

  it('should take eco as eco, not as night, when both send it', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat({ preset: 'comfort' }));

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.ECO);
  });

  it('should take frost protection as frost, not as away', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat({ preset: 'comfort' }));

    await press(mod, handler, PILOT_WIRE_MODE.FROST_PROTECTION);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.FROST);
  });

  it('should take a preset it carries with no hold on it', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat({ preset: 'eco' }));

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.ECO);
  });

  it('should take a preset it carries when the hold is on another setpoint', async () => {
    // A turn of the dial after eco was picked: pressing eco on the module goes
    // back to eco's own setpoint.
    const mod = loadListener();
    const handler = buildHandler(thermostat({ preset: 'eco', params: { THERMOSTAT_MANUAL_SETPOINT: '19.5' } }));

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.ECO);
  });

  it('should survive a thermostat with no feature to take the order on', async () => {
    const mod = loadListener();
    const handler = buildHandler(thermostat({ features: [] }));

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    assert.notCalled(handler.setValue);
  });

  it('should take an order changed on a heater that regulates itself', async () => {
    // A heater regulating itself is still driven by its order (C.1.1).
    const mod = loadListener();
    const handler = buildHandler(thermostat({ params: { THERMOSTAT_TYPE: 'pilot-wire' } }));

    await press(mod, handler, PILOT_WIRE_MODE.ECO);

    expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_PRESET.ECO);
  });

  it('should seed the order reference at start, like a setpoint', async () => {
    // Without it, the first press after every restart would only establish the
    // reference, and the next pass would write the scheduled order back over it.
    const mod = loadListener();
    const handler = buildHandler(thermostat());
    handler.observedSetpoints = new Map();
    handler.gladys.device.get = fake((query) => {
      if (query && query.service === 'thermostat') {
        return Promise.resolve([thermostat()]);
      }
      return Promise.resolve([
        { selector: 'heater', features: [{ selector: 'heater-pilot-wire', last_value: PILOT_WIRE_MODE.COMFORT }] },
      ]);
    });

    await mod.primeObservedSetpoints.call(handler);

    expect(handler.observedSetpoints.get('heater-pilot-wire')).to.equal(PILOT_WIRE_MODE.COMFORT);
  });
});

describe('thermostat pilot wire: holds and marks in the regulation loop', () => {
  afterEach(() => {
    sinon.restore();
  });

  const todayDow = getCurrentDayAndMinutes(new Date(), 'Europe/Paris').dayOfWeek;

  const load = () =>
    proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
      '../../../models': {
        ThermostatScheduleDevice: { findOne: fake.resolves(null), count: fake.resolves(0) },
        ThermostatSchedule: {},
        ThermostatScheduleTransition: {},
      },
      './thermostat.scheduleDevice': { followsSchedule: fake.resolves(false) },
      '../../../utils/logger': logger(),
    });

  const buildGladys = (order, { found = true } = {}) => ({
    device: {
      get: fake((query) => {
        if (found && query && query.device_feature_selectors === 'heater-pilot-wire') {
          return Promise.resolve([
            { selector: 'heater', features: [{ selector: 'heater-pilot-wire', last_value: order }] },
          ]);
        }
        return Promise.resolve([]);
      }),
      setValue: fake.resolves(null),
      saveState: fake.resolves(null),
      setParam: fake.resolves(null),
    },
    variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
    event: { emit: fake.returns(null) },
  });

  const device = (preset, hold = null) => ({
    id: 'device-id',
    selector: 'living-room',
    features: [
      {
        selector: 'thermostat-living-room',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      },
      {
        selector: 'living-room:preset',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
        last_value: THERMOSTAT_PRESET[preset.toUpperCase()],
      },
      {
        selector: 'living-room:operating-state',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE,
        last_value: null,
      },
    ],
    params: [
      { name: 'THERMOSTAT_PILOT_WIRE_FEATURE', value: 'heater-pilot-wire' },
      { name: 'THERMOSTAT_MODE', value: 'heating' },
      ...(hold === null
        ? []
        : [
            { name: 'THERMOSTAT_MANUAL_SETPOINT', value: String(hold) },
            { name: 'THERMOSTAT_MANUAL_UNTIL', value: '' },
          ]),
    ],
  });

  const savedOperatingStates = (gladys) =>
    gladys.device.saveState
      .getCalls()
      .filter((call) => call.args[0].type === DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE)
      .map((call) => call.args[1]);

  const regulate = (mod, gladys, thermostat, marks) =>
    mod.regulateDevice(gladys, thermostat, todayDow, 12 * 60, null, marks);

  it('should keep a derived comfort pressed on the module while comfort is held', async () => {
    // Writing plain comfort over comfort -1 would undo, within a minute, the
    // choice that was just made on the heater.
    await Promise.all(
      [PILOT_WIRE_MODE.COMFORT_1, PILOT_WIRE_MODE.COMFORT_2].map(async (order) => {
        const mod = load();
        const gladys = buildGladys(order);

        await regulate(mod, gladys, device('comfort', 21), new Map());

        assert.notCalled(gladys.device.setValue);
        // The heater regulates here: whether it draws current is unknown, and the
        // state is left alone rather than guessed.
        expect(savedOperatingStates(gladys), String(order)).to.deep.equal([]);
      }),
    );
  });

  it('should still write comfort while comfort is held over another order', async () => {
    const mod = load();
    const gladys = buildGladys(PILOT_WIRE_MODE.ECO);

    await regulate(mod, gladys, device('comfort', 21), new Map());

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.COMFORT);
  });

  it('should survive a comfort hold on a heater whose feature is gone', async () => {
    const mod = load();
    const gladys = buildGladys(PILOT_WIRE_MODE.COMFORT_1, { found: false });

    await regulate(mod, gladys, device('comfort', 21), new Map());

    assert.notCalled(gladys.device.setValue);
    expect(savedOperatingStates(gladys)).to.deep.equal([]);
  });

  it('should mark the order it writes as its own', async () => {
    // The module reports it back: without the mark, that report would be taken
    // for a press of its button and held.
    const mod = load();
    const gladys = buildGladys(PILOT_WIRE_MODE.OFF);
    const marks = new Map();

    await regulate(mod, gladys, device('eco'), marks);

    expect(marks.get('heater-pilot-wire')).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should mark an order already carried as its own too', async () => {
    const mod = load();
    const gladys = buildGladys(PILOT_WIRE_MODE.ECO);
    const marks = new Map();

    await regulate(mod, gladys, device('eco'), marks);

    assert.notCalled(gladys.device.setValue);
    expect(marks.get('heater-pilot-wire')).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should drop the mark of a write that failed', async () => {
    // No report of it will come: a mark left behind would swallow a real press
    // of that same order later on.
    const mod = load();
    const gladys = buildGladys(PILOT_WIRE_MODE.OFF);
    gladys.device.setValue = fake.rejects(new Error('offline'));
    const marks = new Map();

    await regulate(mod, gladys, device('eco'), marks);

    expect(marks.has('heater-pilot-wire')).to.equal(false);
  });
});
