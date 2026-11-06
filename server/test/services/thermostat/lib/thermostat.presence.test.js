const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  PILOT_WIRE_MODE,
  THERMOSTAT_PRESET,
  THERMOSTAT_ACTIVE_PRESET,
} = require('../../../../utils/constants');
const { getCurrentDayAndMinutes } = require('../../../../utils/thermostatSchedule');
const {
  readsZeroSince,
  findAbsence,
  readRoom,
  presetForEmptyRoom,
  holdsPickedPreset,
} = require('../../../../services/thermostat/lib/thermostat.applySchedules');
const { buildParamsConfig } = require('../../../../services/thermostat/lib/thermostat.deviceConfig');

const NOW = 1_700_000_000_000;
const MINUTE = 60 * 1000;

const params = (map) => Object.keys(map).map((name) => ({ name, value: map[name] }));

// Feature lookups go through gladys.device.get({ device_feature_selectors }),
// several selectors joined by commas; each feature found is on a device of its own.
const buildGladys = (features = {}, failing = []) => ({
  device: {
    get: fake((query) => {
      const selectors = ((query && query.device_feature_selectors) || '').split(',').filter(Boolean);
      if (selectors.some((selector) => failing.includes(selector))) {
        return Promise.reject(new Error('sensor offline'));
      }
      return Promise.resolve(
        selectors
          .filter((selector) => features[selector] !== undefined)
          .map((selector) => ({ selector: `${selector}-device`, features: [features[selector]] })),
      );
    }),
    setValue: fake.resolves(null),
    saveState: fake.resolves(null),
    setParam: fake.resolves(null),
  },
  variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
  event: { emit: fake.returns(null) },
});

const sensor = (selector, value, extra = {}) => ({
  selector,
  category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
  type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
  last_value: value,
  ...extra,
});

describe('thermostat presence: readsZeroSince', () => {
  it('should forget the time of a sensor that reads anything but 0', () => {
    const recorded = new Map([['salon-motion', NOW - MINUTE]]);

    expect(readsZeroSince(sensor('salon-motion', 1), 'salon-motion', recorded, NOW)).to.equal(null);
    expect(recorded.has('salon-motion')).to.equal(false);
  });

  it('should keep the recorded time over the latest report', () => {
    const recorded = new Map([['salon-motion', NOW - 40 * MINUTE]]);
    const feature = sensor('salon-motion', 0, { last_value_changed: new Date(NOW - MINUTE) });

    expect(readsZeroSince(feature, 'salon-motion', recorded, NOW)).to.equal(NOW - 40 * MINUTE);
  });

  it('should work without a record', () => {
    const feature = sensor('salon-motion', 0, { last_value_changed: new Date(NOW - MINUTE) });

    expect(readsZeroSince(feature, 'salon-motion', null, NOW)).to.equal(NOW - MINUTE);
    expect(readsZeroSince(sensor('salon-motion', 1), 'salon-motion', null, NOW)).to.equal(null);
  });
});

describe('thermostat presence: findAbsence', () => {
  const read = (sensors) => new Map(sensors.map((feature) => [feature.selector, feature]));

  it('should take the room as empty once every sensor has seen nobody for the delay', () => {
    const features = read([sensor('salon-motion', 0), sensor('kitchen-motion', 0)]);
    const vacatedAt = new Map([
      ['salon-motion', NOW - 45 * MINUTE],
      ['kitchen-motion', NOW - 31 * MINUTE],
    ]);

    // From the last sensor to go quiet.
    expect(findAbsence(features, ['salon-motion', 'kitchen-motion'], 30, vacatedAt, NOW)).to.equal(NOW - 31 * MINUTE);
  });

  it('should not take the room as empty before the delay has run out', () => {
    const vacatedAt = new Map([['salon-motion', NOW - 29 * MINUTE]]);

    expect(findAbsence(read([sensor('salon-motion', 0)]), ['salon-motion'], 30, vacatedAt, NOW)).to.equal(null);
  });

  it('should take one sensor seeing someone as an occupied room', () => {
    const features = read([sensor('salon-motion', 0), sensor('kitchen-motion', 1)]);
    const vacatedAt = new Map([['salon-motion', NOW - 60 * MINUTE]]);

    expect(findAbsence(features, ['salon-motion', 'kitchen-motion'], 30, vacatedAt, NOW)).to.equal(null);
  });

  // A sensor on a flat battery must not leave the house on eco for good.
  it('should never take the room as empty with no sensor that can be read', () => {
    const features = read([sensor('never-reported', null)]);

    expect(findAbsence(features, ['offline-motion', 'never-reported'], 30, new Map(), NOW)).to.equal(null);
  });

  it('should leave out a sensor that was not read', () => {
    const vacatedAt = new Map([['salon-motion', NOW - 60 * MINUTE]]);

    expect(
      findAbsence(read([sensor('salon-motion', 0)]), ['salon-motion', 'offline-motion'], 30, vacatedAt, NOW),
    ).to.equal(NOW - 60 * MINUTE);
  });

  // Only what the form offers says anything about the room.
  it('should leave out a feature that is not a presence sensor', () => {
    const features = read([
      sensor('salon-motion', 1),
      sensor('salon-presence', 0, { category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR }),
      sensor('salon-pushed', 0, { type: DEVICE_FEATURE_TYPES.SENSOR.PUSH }),
      sensor('salon-temperature', 0, {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      }),
    ]);
    const vacatedAt = new Map([['salon-presence', NOW - 60 * MINUTE]]);

    expect(findAbsence(features, ['salon-presence', 'salon-pushed', 'salon-temperature'], 30, vacatedAt, NOW)).to.equal(
      NOW - 60 * MINUTE,
    );
    // A motion sensor seeing someone still counts.
    expect(findAbsence(features, ['salon-presence', 'salon-motion'], 30, vacatedAt, NOW)).to.equal(null);
  });

  it('should forget the time of a sensor that lost its value, and keep that of one unread', () => {
    const features = read([sensor('salon-motion', null)]);
    const vacatedAt = new Map([
      ['salon-motion', NOW - 60 * MINUTE],
      ['offline-motion', NOW - 60 * MINUTE],
    ]);

    expect(findAbsence(features, ['salon-motion', 'offline-motion'], 30, vacatedAt, NOW)).to.equal(null);
    expect(vacatedAt.has('salon-motion')).to.equal(false);
    expect(vacatedAt.get('offline-motion')).to.equal(NOW - 60 * MINUTE);
    // Its next 0 starts a new count.
    expect(findAbsence(features, ['salon-motion'], 30, null, NOW)).to.equal(null);
  });

  it('should default to the present time and no record', () => {
    const features = read([sensor('salon-motion', 0, { last_value_changed: new Date(Date.now() - 60 * MINUTE) })]);

    expect(findAbsence(features, ['salon-motion'])).to.equal(null);
    expect(findAbsence(features, ['salon-motion'], 30)).to.not.equal(null);
  });
});

describe('thermostat presence: readRoom', () => {
  afterEach(() => {
    sinon.restore();
  });

  const config = (overrides = {}) => ({
    thermostat_type: 'virtual',
    presence_features: ['salon-motion', 'kitchen-motion'],
    presence_delay: 30,
    ...overrides,
  });

  // One query per thermostat, whatever the number of sensors.
  it('should read every sensor in one query', async () => {
    const gladys = buildGladys({
      'salon-motion': sensor('salon-motion', 0),
      'kitchen-motion': sensor('kitchen-motion', 0),
    });
    const vacatedAt = new Map([
      ['salon-motion', NOW - 45 * MINUTE],
      ['kitchen-motion', NOW - 40 * MINUTE],
    ]);
    sinon.useFakeTimers(NOW);

    const room = await readRoom(gladys, config(), vacatedAt);

    assert.calledOnceWithExactly(gladys.device.get, { device_feature_selectors: 'salon-motion,kitchen-motion' });
    expect(room).to.deep.equal({ emptySince: NOW - 40 * MINUTE, pilotWireOptions: null, target: null });
  });

  it('should read the pilot wire of a heater regulating itself, and the target of an external thermostat', async () => {
    const options = [{ value: PILOT_WIRE_MODE.OFF }, { value: PILOT_WIRE_MODE.COMFORT }];
    const target = { selector: 'netatmo-setpoint', unit: DEVICE_FEATURE_UNITS.FAHRENHEIT };
    const gladys = buildGladys({
      'salon-motion': sensor('salon-motion', 1),
      'heater-wire': { selector: 'heater-wire', supported_options: options },
      'netatmo-setpoint': target,
    });

    const heater = await readRoom(
      gladys,
      config({
        presence_features: ['salon-motion'],
        pilot_wire_feature: 'heater-wire',
        pilot_wire_regulation: 'heater',
      }),
    );
    const external = await readRoom(
      gladys,
      config({ presence_features: ['salon-motion'], thermostat_type: 'external', target_feature: 'netatmo-setpoint' }),
    );

    expect(heater.pilotWireOptions).to.equal(options);
    expect(external.target).to.equal(target);
    expect(external.emptySince).to.equal(null);
  });

  // Gladys regulating the heater sends comfort or frost: the orders of the presets do not matter.
  it('should not read the pilot wire of a heater Gladys regulates, nor one that declares no option', async () => {
    const gladys = buildGladys({ 'heater-wire': { selector: 'heater-wire' } });

    const regulated = await readRoom(
      gladys,
      config({
        presence_features: ['salon-motion'],
        pilot_wire_feature: 'heater-wire',
        pilot_wire_regulation: 'gladys',
      }),
    );
    const heater = await readRoom(
      gladys,
      config({
        presence_features: ['salon-motion'],
        pilot_wire_feature: 'heater-wire',
        pilot_wire_regulation: 'heater',
      }),
    );
    const gone = await readRoom(
      buildGladys(),
      config({
        presence_features: ['salon-motion'],
        pilot_wire_feature: 'heater-wire',
        pilot_wire_regulation: 'heater',
      }),
    );

    expect(gladys.device.get.firstCall.args[0]).to.deep.equal({ device_feature_selectors: 'salon-motion' });
    expect(regulated.pilotWireOptions).to.equal(null);
    expect(heater.pilotWireOptions).to.equal(null);
    expect(gone.pilotWireOptions).to.equal(null);
  });

  it('should read nothing, and keep the times recorded, when the query fails', async () => {
    const gladys = buildGladys({}, ['salon-motion']);
    const vacatedAt = new Map([['salon-motion', NOW - 60 * MINUTE]]);

    const room = await readRoom(gladys, config({ thermostat_type: 'external', target_feature: 'netatmo' }), vacatedAt);

    expect(room).to.deep.equal({ emptySince: null, pilotWireOptions: null, target: null });
    expect(vacatedAt.get('salon-motion')).to.equal(NOW - 60 * MINUTE);
  });

  it('should take no device found as nothing read', async () => {
    const gladys = buildGladys();
    gladys.device.get = fake.resolves(null);

    expect((await readRoom(gladys, config())).emptySince).to.equal(null);
    gladys.device.get = fake.resolves([{ selector: 'odd-device' }]);
    expect((await readRoom(gladys, config())).emptySince).to.equal(null);
  });
});

describe('thermostat presence: presetForEmptyRoom', () => {
  const config = (overrides = {}) => ({
    default_mode: 'heating',
    presence_preset: 'eco',
    preset_comfort: 21,
    preset_eco: 18,
    preset_night: 17,
    preset_away: 16,
    preset_frost: 7,
    ...overrides,
  });

  it('should lower comfort to the absence preset when heating', () => {
    expect(presetForEmptyRoom('comfort', config())).to.equal('eco');
  });

  // Eco at 18 °C must not raise a night already on frost protection.
  it('should keep a preset that already saves more', () => {
    expect(presetForEmptyRoom('frost', config())).to.equal('frost');
    expect(presetForEmptyRoom('night', config())).to.equal('night');
  });

  it('should keep the absence preset itself', () => {
    expect(presetForEmptyRoom('eco', config())).to.equal('eco');
  });

  it('should raise the setpoint when cooling', () => {
    const cooling = config({ default_mode: 'cooling', preset_comfort: 24, preset_eco: 26, preset_frost: 30 });

    expect(presetForEmptyRoom('comfort', cooling)).to.equal('eco');
    expect(presetForEmptyRoom('frost', cooling)).to.equal('frost');
  });

  // A pilot-wire heater only heats, whatever THERMOSTAT_MODE says.
  it('should read a pilot-wire heater as heating', () => {
    expect(
      presetForEmptyRoom('comfort', config({ default_mode: 'cooling', pilot_wire_feature: 'heater-wire' })),
    ).to.equal('eco');
  });

  // A heater regulating itself is sent the presets' orders, not their setpoints.
  it('should weigh the orders of a heater that regulates itself', () => {
    const heater = (orders) =>
      config({
        pilot_wire_feature: 'heater-wire',
        pilot_wire_regulation: 'heater',
        // Setpoints that would say the opposite, to show they are not read.
        preset_comfort: 15,
        preset_eco: 20,
        pilot_wire_orders: {
          frost: PILOT_WIRE_MODE.FROST_PROTECTION,
          away: PILOT_WIRE_MODE.FROST_PROTECTION,
          eco: PILOT_WIRE_MODE.ECO,
          night: PILOT_WIRE_MODE.ECO,
          comfort: PILOT_WIRE_MODE.COMFORT,
          ...orders,
        },
      });

    expect(presetForEmptyRoom('comfort', heater())).to.equal('eco');
    expect(presetForEmptyRoom('frost', heater())).to.equal('frost');
    // Comfort -2 °C sends less heat than comfort -1 °C, whatever their values.
    const derived = heater({ comfort: PILOT_WIRE_MODE.COMFORT_1, eco: PILOT_WIRE_MODE.COMFORT_2 });
    expect(presetForEmptyRoom('comfort', derived)).to.equal('eco');
    const reversed = heater({ comfort: PILOT_WIRE_MODE.COMFORT_2, eco: PILOT_WIRE_MODE.COMFORT_1 });
    expect(presetForEmptyRoom('comfort', reversed)).to.equal('comfort');
  });

  it('should leave off and schedule alone', () => {
    expect(presetForEmptyRoom('off', config())).to.equal('off');
    expect(presetForEmptyRoom('schedule', config())).to.equal('schedule');
  });

  // A 4-order module takes no comfort -1: COMFORT_1 is sent as comfort, so an
  // absence preset set to COMFORT_1 changes nothing over comfort, and is no saving.
  it('should weigh the orders a 4-order module takes, as they are sent', () => {
    const fourOrders = [
      { value: PILOT_WIRE_MODE.OFF },
      { value: PILOT_WIRE_MODE.FROST_PROTECTION },
      { value: PILOT_WIRE_MODE.ECO },
      { value: PILOT_WIRE_MODE.COMFORT },
    ];
    const heater = config({
      pilot_wire_feature: 'heater-wire',
      pilot_wire_regulation: 'heater',
      pilot_wire_orders: {
        frost: PILOT_WIRE_MODE.FROST_PROTECTION,
        away: PILOT_WIRE_MODE.FROST_PROTECTION,
        eco: PILOT_WIRE_MODE.COMFORT_1,
        night: PILOT_WIRE_MODE.ECO,
        comfort: PILOT_WIRE_MODE.COMFORT,
      },
    });

    // Configured orders alone would say comfort -1 saves over comfort.
    expect(presetForEmptyRoom('comfort', heater)).to.equal('eco');
    expect(presetForEmptyRoom('comfort', heater, fourOrders)).to.equal('comfort');
    // An order the module takes none of changes nothing either.
    expect(presetForEmptyRoom('comfort', { ...heater, presence_preset: 'night' }, [{ value: 5 }])).to.equal('comfort');
    expect(presetForEmptyRoom('comfort', { ...heater, presence_preset: 'night' }, fourOrders)).to.equal('night');
  });
});

describe('thermostat presence: holdsPickedPreset', () => {
  afterEach(() => {
    sinon.restore();
  });

  const virtualConfig = { thermostat_type: 'virtual', default_mode: 'heating', preset_comfort: 21, temp_unit: 'C' };

  it('should tell a picked preset from a turn of the dial', () => {
    expect(holdsPickedPreset(virtualConfig, { setpoint: 21 }, 'comfort')).to.equal(true);
    expect(holdsPickedPreset(virtualConfig, { setpoint: 22 }, 'comfort')).to.equal(false);
  });

  it('should not take a hold on the programme for a picked preset', () => {
    expect(holdsPickedPreset(virtualConfig, { setpoint: 21 }, 'schedule')).to.equal(false);
  });

  // On an external thermostat the hold is in the real feature's unit (C.3).
  it('should compare in the unit of an external target', () => {
    const config = { ...virtualConfig, thermostat_type: 'external', target_feature: 'netatmo-setpoint' };
    const target = { selector: 'netatmo-setpoint', unit: DEVICE_FEATURE_UNITS.FAHRENHEIT, last_value: 70 };

    expect(holdsPickedPreset(config, { setpoint: 70 }, 'comfort', target)).to.equal(true);
  });

  it('should compare in the thermostat unit when the external target is gone', () => {
    const config = { ...virtualConfig, thermostat_type: 'external', target_feature: 'netatmo-setpoint' };

    expect(holdsPickedPreset(config, { setpoint: 21 }, 'comfort')).to.equal(true);
  });
});

describe('thermostat presence: params', () => {
  const config = (map) => buildParamsConfig({ params: params(map) });

  it('should read one presence sensor or several, with their delay and preset', () => {
    const read = config({
      THERMOSTAT_PRESENCE_FEATURE: '["salon-motion","kitchen-presence"]',
      THERMOSTAT_PRESENCE_DELAY: '45',
      THERMOSTAT_PRESENCE_PRESET: 'away',
    });

    expect(read.presence_features).to.deep.equal(['salon-motion', 'kitchen-presence']);
    expect(read.presence_delay).to.equal(45);
    expect(read.presence_preset).to.equal('away');
  });

  it('should default to no sensor, 30 minutes and eco', () => {
    const read = config({ THERMOSTAT_MODE: 'heating' });

    expect(read.presence_features).to.deep.equal([]);
    expect(read.presence_delay).to.equal(30);
    expect(read.presence_preset).to.equal('eco');
  });

  it('should bound the delay and refuse a preset that is no saving', () => {
    expect(config({ THERMOSTAT_PRESENCE_DELAY: '0' }).presence_delay).to.equal(1);
    expect(config({ THERMOSTAT_PRESENCE_DELAY: '100000' }).presence_delay).to.equal(1440);
    expect(config({ THERMOSTAT_PRESENCE_PRESET: 'comfort' }).presence_preset).to.equal('eco');
  });
});

describe('thermostat presence: regulateDevice', () => {
  const todayDow = getCurrentDayAndMinutes(new Date(), 'Europe/Paris').dayOfWeek;

  afterEach(() => {
    sinon.restore();
  });

  const load = (point) =>
    proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
      '../../../models': {
        ThermostatScheduleDevice: {
          findOne: fake.resolves(
            point ? { schedule: { transitions: [{ day_of_week: todayDow, time: '00:00', preset: point }] } } : null,
          ),
        },
        ThermostatSchedule: {},
        ThermostatScheduleTransition: {},
      },
      './thermostat.scheduleDevice': { followsSchedule: fake.resolves(Boolean(point)) },
      '../../../utils/logger': { debug: fake.returns(null), info: fake.returns(null), warn: fake.returns(null) },
    });

  const setpointFeature = (value = null) => ({
    selector: 'thermostat-living-room',
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
    last_value: value,
  });
  const presetFeature = (preset) => ({
    selector: 'thermostat-living-room:preset',
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
    last_value: THERMOSTAT_PRESET[preset.toUpperCase()],
  });
  const activePresetFeature = () => ({
    selector: 'thermostat-living-room:active-preset',
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.ACTIVE_PRESET,
    last_value: null,
  });

  const virtualDevice = ({ preset = 'schedule', hold = null, since = null, extra = {} } = {}) => {
    const setpoint = setpointFeature();
    const active = activePresetFeature();
    return {
      setpoint,
      active,
      device: {
        id: 'device-id',
        selector: 'living-room',
        features: [setpoint, presetFeature(preset), active],
        params: params({
          THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
          THERMOSTAT_SWITCH_FEATURE: 'heater-switch',
          THERMOSTAT_MODE: 'heating',
          THERMOSTAT_PRESET_COMFORT: '21',
          THERMOSTAT_PRESET_ECO: '18',
          THERMOSTAT_PRESET_FROST: '7',
          THERMOSTAT_PRESENCE_FEATURE: 'salon-motion',
          ...(hold === null
            ? {}
            : { THERMOSTAT_MANUAL_SETPOINT: String(hold), THERMOSTAT_MANUAL_UNTIL: String(Date.now() + 60 * MINUTE) }),
          ...(since === null ? {} : { THERMOSTAT_MANUAL_SINCE: String(since) }),
          ...extra,
        }),
      },
    };
  };

  const roomFeatures = (motion) => ({
    'temp-sensor': { selector: 'temp-sensor', last_value: 17 },
    'heater-switch': { selector: 'heater-switch', last_value: 0 },
    'salon-motion': sensor('salon-motion', motion),
  });

  const emptyFor = (minutes) => new Map([['salon-motion', Date.now() - minutes * MINUTE]]);

  const regulate = (mod, gladys, device, vacatedAt) =>
    mod.regulateDevice(gladys, device, todayDow, 12 * 60, null, null, new Map(), null, null, new Map(), vacatedAt);

  it('should regulate an empty room on the absence preset, and say so on active-preset', async () => {
    const mod = load('comfort');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint, active } = virtualDevice();

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, setpoint, 18);
    assert.calledWith(gladys.device.saveState, active, THERMOSTAT_ACTIVE_PRESET.ECO);
    // 17 °C under eco's 18 °C: the heating still runs, on the lower setpoint.
    expect(gladys.device.setValue.firstCall.args[2]).to.equal(1);
    // The dashboards are still told the programme's point.
    const announced = gladys.event.emit
      .getCalls()
      .map((call) => call.args[1])
      .filter((message) => message && message.payload && message.payload.preset);
    expect(announced.map((message) => message.payload.preset)).to.deep.equal(['comfort']);
  });

  it('should keep the programme while someone is in the room', async () => {
    const mod = load('comfort');
    const gladys = buildGladys(roomFeatures(1));
    const { device, setpoint } = virtualDevice();

    await regulate(mod, gladys, device, new Map());

    assert.calledWith(gladys.device.saveState, setpoint, 21);
  });

  it('should keep the programme until the delay has run out', async () => {
    const mod = load('comfort');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint } = virtualDevice();

    await regulate(mod, gladys, device, emptyFor(10));

    assert.calledWith(gladys.device.saveState, setpoint, 21);
  });

  it('should not raise a point that already saves more', async () => {
    const mod = load('frost');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint } = virtualDevice();

    await regulate(mod, gladys, device, emptyFor(60));

    assert.calledWith(gladys.device.saveState, setpoint, 7);
  });

  // Comfort picked for the evening keeps nobody warm once everybody is in bed.
  it('should lower a preset picked by hand before the room emptied', async () => {
    const mod = load('eco');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint } = virtualDevice({ preset: 'comfort', hold: 21, since: Date.now() - 45 * MINUTE });

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, setpoint, 18);
    // The preset picked stays: it is back once someone is seen.
    const presetWrites = gladys.device.saveState
      .getCalls()
      .filter((call) => call.args[0].type === DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET);
    expect(presetWrites).to.have.length(0);
  });

  // Armed before this rule existed, or written by another client: nothing says
  // it was a pre-heating.
  it('should lower a preset picked by hand at a time unknown', async () => {
    const mod = load('eco');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint } = virtualDevice({ preset: 'comfort', hold: 21 });

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, setpoint, 18);
  });

  // Comfort picked from the phone on the way home: the room was already empty.
  it('should keep a preset picked in a room already empty, until it empties again', async () => {
    const mod = load('eco');
    const pickedAt = Date.now() - 60 * MINUTE;
    const { device, setpoint, active } = virtualDevice({ preset: 'comfort', hold: 21, since: pickedAt });
    const vacatedAt = emptyFor(120);

    const preheating = buildGladys(roomFeatures(0));
    await regulate(mod, preheating, device, vacatedAt);

    assert.calledWith(preheating.device.saveState, setpoint, 21);
    assert.calledWith(preheating.device.saveState, active, THERMOSTAT_ACTIVE_PRESET.COMFORT);
    // The heating runs on comfort: 17 °C is under 21 °C.
    expect(preheating.device.setValue.firstCall.args[2]).to.equal(1);

    // Someone comes in: the record of the quiet room is gone.
    const occupied = buildGladys(roomFeatures(1));
    await regulate(mod, occupied, device, vacatedAt);
    expect(vacatedAt.has('salon-motion')).to.equal(false);
    assert.calledWith(occupied.device.saveState, setpoint, 21);

    // And leaves, after the hold: the room empties again, and comfort is lowered.
    vacatedAt.set('salon-motion', Date.now() - 31 * MINUTE);
    const leftAgain = buildGladys(roomFeatures(0));
    await regulate(mod, leftAgain, device, vacatedAt);
    assert.calledWith(leftAgain.device.saveState, setpoint, 18);
    assert.calledWith(leftAgain.device.saveState, active, THERMOSTAT_ACTIVE_PRESET.ECO);
  });

  // Nothing to weigh: the hold is a dial setpoint, so the sensors are not read.
  it('should not read the room over a setpoint set on the dial', async () => {
    const mod = load('comfort');
    const gladys = buildGladys(roomFeatures(0));
    const { device } = virtualDevice({ preset: 'comfort', hold: 22.5 });

    await regulate(mod, gladys, device, emptyFor(31));

    const presenceQueries = gladys.device.get
      .getCalls()
      .filter((call) => String(call.args[0].device_feature_selectors).includes('salon-motion'));
    expect(presenceQueries).to.have.length(0);
  });

  it('should regulate an empty room in cooling on the warmer absence preset', async () => {
    const mod = load('comfort');
    const gladys = buildGladys({ ...roomFeatures(0), 'temp-sensor': { selector: 'temp-sensor', last_value: 27 } });
    const { device, setpoint, active } = virtualDevice({
      extra: { THERMOSTAT_MODE: 'cooling', THERMOSTAT_PRESET_COMFORT: '24', THERMOSTAT_PRESET_ECO: '26' },
    });

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, setpoint, 26);
    assert.calledWith(gladys.device.saveState, active, THERMOSTAT_ACTIVE_PRESET.ECO);
  });

  // A scene writes Night on a thermostat that cools: a preset the bar does not show.
  it('should lower a preset picked by hand in cooling', async () => {
    const mod = load('comfort');
    const gladys = buildGladys({ ...roomFeatures(0), 'temp-sensor': { selector: 'temp-sensor', last_value: 27 } });
    const { device, setpoint } = virtualDevice({
      preset: 'night',
      hold: 25,
      since: Date.now() - 45 * MINUTE,
      extra: {
        THERMOSTAT_MODE: 'cooling',
        THERMOSTAT_PRESET_COMFORT: '24',
        THERMOSTAT_PRESET_NIGHT: '25',
        THERMOSTAT_PRESET_ECO: '26',
      },
    });

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, setpoint, 26);
  });

  it('should keep a setpoint set on the dial', async () => {
    const mod = load('comfort');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint } = virtualDevice({ preset: 'comfort', hold: 22.5 });

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, setpoint, 22.5);
  });

  it('should keep a picked preset that already saves more', async () => {
    const mod = load('comfort');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint } = virtualDevice({ preset: 'frost', hold: 7 });

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, setpoint, 7);
  });

  it('should regulate as before with no presence sensor', async () => {
    const mod = load('comfort');
    const gladys = buildGladys(roomFeatures(0));
    const { device, setpoint } = virtualDevice({ extra: { THERMOSTAT_PRESENCE_FEATURE: '' } });

    await regulate(mod, gladys, device, emptyFor(60));

    assert.calledWith(gladys.device.saveState, setpoint, 21);
  });

  it('should write the absence setpoint on an external thermostat', async () => {
    const mod = load('comfort');
    const gladys = buildGladys({
      'salon-motion': sensor('salon-motion', 0),
      'netatmo-setpoint': {
        selector: 'netatmo-setpoint',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        last_value: 21,
      },
    });
    const device = {
      id: 'device-id',
      selector: 'netatmo-thermostat',
      features: [],
      params: params({
        THERMOSTAT_TYPE: 'external',
        THERMOSTAT_TARGET_FEATURE: 'netatmo-setpoint',
        THERMOSTAT_MODE: 'heating',
        THERMOSTAT_PRESET_COMFORT: '21',
        THERMOSTAT_PRESET_ECO: '18',
        THERMOSTAT_PRESENCE_FEATURE: 'salon-motion',
      }),
    };

    await regulate(mod, gladys, device, emptyFor(31));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(18);
  });

  // The hold on an external thermostat is in the real feature's unit (C.3).
  it('should lower a preset picked by hand on an external thermostat, in the unit of its feature', async () => {
    const mod = load(null);
    const gladys = buildGladys({
      'salon-motion': sensor('salon-motion', 0),
      'netatmo-setpoint': {
        selector: 'netatmo-setpoint',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
        last_value: 70,
      },
    });
    const preset = presetFeature('comfort');
    const device = {
      id: 'device-id',
      selector: 'netatmo-thermostat',
      features: [preset],
      params: params({
        THERMOSTAT_TYPE: 'external',
        THERMOSTAT_TARGET_FEATURE: 'netatmo-setpoint',
        THERMOSTAT_MODE: 'heating',
        THERMOSTAT_PRESET_COMFORT: '21',
        THERMOSTAT_PRESET_ECO: '18',
        THERMOSTAT_PRESENCE_FEATURE: 'salon-motion',
        THERMOSTAT_MANUAL_SETPOINT: '70',
        THERMOSTAT_MANUAL_UNTIL: String(Date.now() + 60 * MINUTE),
        THERMOSTAT_MANUAL_SINCE: String(Date.now() - 45 * MINUTE),
      }),
    };

    await regulate(mod, gladys, device, emptyFor(31));

    // Eco's 18 °C, in the feature's Fahrenheit.
    expect(gladys.device.setValue.firstCall.args[2]).to.equal(64);
  });

  // A 4-order module sends COMFORT_1 as comfort: the absence preset set to it
  // changes nothing, so nothing says eco.
  it('should not report the absence preset when the module sends the same order', async () => {
    const mod = load('comfort');
    const gladys = buildGladys({
      'salon-motion': sensor('salon-motion', 0),
      'heater-wire': {
        selector: 'heater-wire',
        category: DEVICE_FEATURE_CATEGORIES.HEATER,
        type: DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE,
        last_value: PILOT_WIRE_MODE.ECO,
        supported_options: [
          { value: PILOT_WIRE_MODE.OFF },
          { value: PILOT_WIRE_MODE.FROST_PROTECTION },
          { value: PILOT_WIRE_MODE.ECO },
          { value: PILOT_WIRE_MODE.COMFORT },
        ],
      },
    });
    const { device, active } = virtualDevice({
      extra: {
        THERMOSTAT_TYPE: 'pilot-wire',
        THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-wire',
        THERMOSTAT_PILOT_WIRE_ORDER_ECO: String(PILOT_WIRE_MODE.COMFORT_1),
        THERMOSTAT_SWITCH_FEATURE: '',
      },
    });

    await regulate(mod, gladys, device, emptyFor(31));

    assert.calledWith(gladys.device.saveState, active, THERMOSTAT_ACTIVE_PRESET.COMFORT);
    assert.neverCalledWith(gladys.device.saveState, active, THERMOSTAT_ACTIVE_PRESET.ECO);
    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.COMFORT);
  });

  it('should send the absence order to a pilot-wire heater', async () => {
    const mod = load('comfort');
    const gladys = buildGladys({
      'salon-motion': sensor('salon-motion', 0),
      'heater-wire': {
        selector: 'heater-wire',
        category: DEVICE_FEATURE_CATEGORIES.HEATER,
        type: DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE,
        last_value: PILOT_WIRE_MODE.COMFORT,
      },
    });
    const { device } = virtualDevice({
      extra: {
        THERMOSTAT_TYPE: 'pilot-wire',
        THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-wire',
        THERMOSTAT_SWITCH_FEATURE: '',
      },
    });

    await regulate(mod, gladys, device, emptyFor(31));

    expect(gladys.device.setValue.firstCall.args[2]).to.equal(PILOT_WIRE_MODE.ECO);
  });
});

describe('thermostat presence: onDeviceNewState', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(NOW);
  });

  afterEach(() => {
    sinon.restore();
  });

  const loadModule = () =>
    proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
      '../../../utils/logger': { debug: fake.returns(null), info: fake.returns(null), warn: fake.returns(null) },
    });

  const thermostat = (selector, sensors, delay) => ({
    selector,
    features: [],
    params: params({
      THERMOSTAT_PRESENCE_FEATURE: JSON.stringify(sensors),
      ...(delay === undefined ? {} : { THERMOSTAT_PRESENCE_DELAY: String(delay) }),
    }),
  });

  const buildHandler = (devices) => ({
    gladys: { device: { get: fake.resolves(devices) } },
    lifecycle: 0,
    windowOpenedAt: new Map(),
    windowTimers: new Map(),
    openWindows: new Set(),
    presenceVacatedAt: new Map(),
    selfWrittenSetpoints: new Map(),
    observedSetpoints: new Map(),
    selfWrittenPowers: new Map(),
    observedPowers: new Map(),
    triggerApplySchedules: fake(),
  });

  const report = (mod, handler, selector, state) =>
    mod.onDeviceNewState.call(handler, { device_feature: selector, state });

  it('should record when a sensor sees nobody, and keep that time on the next reports', async () => {
    const mod = loadModule();
    const handler = buildHandler([thermostat('living-room', ['salon-motion'])]);

    await report(mod, handler, 'salon-motion', 0);
    clock.tick(5 * MINUTE);
    await report(mod, handler, 'salon-motion', 0);

    expect(handler.presenceVacatedAt.get('salon-motion')).to.equal(NOW);
    assert.notCalled(handler.triggerApplySchedules);
  });

  it('should regulate at once when someone is seen in a room taken as empty', async () => {
    const mod = loadModule();
    const handler = buildHandler([thermostat('living-room', ['salon-motion'])]);
    handler.presenceVacatedAt.set('salon-motion', NOW - 31 * MINUTE);

    await report(mod, handler, 'salon-motion', 1);

    assert.calledOnce(handler.triggerApplySchedules);
    expect(handler.presenceVacatedAt.has('salon-motion')).to.equal(false);
  });

  // A motion sensor goes back to "nobody" a minute after each movement.
  it('should not regulate when someone is seen before the delay ran out', async () => {
    const mod = loadModule();
    const handler = buildHandler([thermostat('living-room', ['salon-motion'])]);
    handler.presenceVacatedAt.set('salon-motion', NOW - 2 * MINUTE);

    await report(mod, handler, 'salon-motion', 1);
    await report(mod, handler, 'salon-motion', 1);

    assert.notCalled(handler.triggerApplySchedules);
  });

  it('should go by the shortest delay of the thermostats sharing a sensor', async () => {
    const mod = loadModule();
    const handler = buildHandler([
      thermostat('living-room', ['salon-motion'], 60),
      thermostat('kitchen', ['salon-motion'], 10),
      { selector: 'no-params', features: [] },
    ]);
    handler.presenceVacatedAt.set('salon-motion', NOW - 11 * MINUTE);

    await report(mod, handler, 'salon-motion', 1);

    assert.calledOnce(handler.triggerApplySchedules);
  });

  it('should ignore a sensor no thermostat watches', async () => {
    const mod = loadModule();
    const handler = buildHandler([thermostat('living-room', ['salon-motion'])]);

    await report(mod, handler, 'garage-motion', 0);

    expect(handler.presenceVacatedAt.size).to.equal(0);
  });

  // Stopped during the lookup: its records are cleared, and one made now never would be.
  it('should record nothing once the service has stopped', async () => {
    const mod = loadModule();
    const handler = buildHandler([thermostat('living-room', ['salon-motion'])]);
    handler.gladys.device.get = fake(async () => {
      handler.lifecycle += 1;
      return [thermostat('living-room', ['salon-motion'])];
    });

    await report(mod, handler, 'salon-motion', 0);

    expect(handler.presenceVacatedAt.size).to.equal(0);
  });

  it('should swallow a lookup that fails', async () => {
    const mod = loadModule();
    const handler = buildHandler([]);
    handler.gladys.device.get = fake.rejects(new Error('db down'));

    await report(mod, handler, 'salon-motion', 0);

    assert.notCalled(handler.triggerApplySchedules);
  });

  it('should rebuild the presence sensors when the caches are dropped', async () => {
    const mod = loadModule();
    const handler = buildHandler([thermostat('living-room', ['salon-motion'])]);
    await mod.getWindowSelectors.call(handler);
    handler.presenceSelectorsCache = null;

    const sensors = await mod.getPresenceSelectors.call(handler);

    expect([...sensors.keys()]).to.deep.equal(['salon-motion']);
  });
});
