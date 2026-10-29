const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const {
  toNumber,
  buildParamsConfig,
  getDeviceConfig,
  getFeatureBySelector,
  isExternal,
} = require('../../../../services/thermostat/lib/thermostat.deviceConfig');

const deviceWithParams = (params) => ({
  params: Object.entries(params).map(([name, value]) => ({ name, value })),
});

describe('thermostat.deviceConfig - toNumber', () => {
  it('should parse a numeric string', () => {
    expect(toNumber('21.5', 0)).to.equal(21.5);
  });

  it('should keep a legitimate 0 instead of falling back', () => {
    expect(toNumber('0', 7)).to.equal(0);
  });

  it('should fall back on a non-numeric value', () => {
    expect(toNumber('abc', 7)).to.equal(7);
    expect(toNumber(null, 7)).to.equal(7);
    expect(toNumber(undefined, 7)).to.equal(7);
  });
});

describe('thermostat.deviceConfig - buildParamsConfig', () => {
  it('should default the presets by use', () => {
    const cooling = buildParamsConfig(deviceWithParams({ THERMOSTAT_MODE: 'cooling' }));
    expect(cooling.preset_comfort).to.equal(24);
    expect(cooling.preset_frost).to.equal(30);
    const heating = buildParamsConfig(deviceWithParams({ THERMOSTAT_MIN_TEMP: '5' }));
    expect(heating.preset_comfort).to.equal(21);
    expect(heating.preset_frost).to.equal(7);
  });

  it('should return null when the device has no params', () => {
    expect(buildParamsConfig({ params: [] })).to.equal(null);
    expect(buildParamsConfig({})).to.equal(null);
  });

  it('should read several window and temperature sensors, and the power feature', () => {
    const config = buildParamsConfig(
      deviceWithParams({
        THERMOSTAT_TEMPERATURE_FEATURE: '["salon-temp","kitchen-temp"]',
        THERMOSTAT_WINDOW_FEATURE: '["salon-window","kitchen-door"]',
        THERMOSTAT_POWER_FEATURE: 'ac-power',
      }),
    );

    expect(config.temperature_features).to.deep.equal(['salon-temp', 'kitchen-temp']);
    expect(config.window_features).to.deep.equal(['salon-window', 'kitchen-door']);
    expect(config.power_feature).to.equal('ac-power');
  });

  it('should read no sensor and no power when the params are absent', () => {
    const config = buildParamsConfig(deviceWithParams({ THERMOSTAT_MODE: 'heating' }));

    expect(config.temperature_features).to.deep.equal([]);
    expect(config.window_features).to.deep.equal([]);
    expect(config.power_feature).to.equal(null);
  });

  it('should read features and mode from params', () => {
    const config = buildParamsConfig(
      deviceWithParams({
        THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor',
        THERMOSTAT_SWITCH_FEATURE: 'heater-switch',
        THERMOSTAT_MODE: 'cooling',
        THERMOSTAT_CONTROL_TYPE: 'tpi',
      }),
    );

    expect(config.temperature_features).to.deep.equal(['temp-sensor']);
    expect(config.switch_feature).to.equal('heater-switch');
    expect(config.default_mode).to.equal('cooling');
    expect(config.control_type).to.equal('tpi');
  });

  it('should apply defaults for missing params', () => {
    const config = buildParamsConfig(deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp' }));

    expect(config.default_mode).to.equal('heating');
    expect(config.control_type).to.equal('hysteresis');
    expect(config.humidity_feature).to.equal(null);
    expect(config.preset_frost).to.equal(7);
    expect(config.preset_away).to.equal(16);
  });

  it('should keep a preset explicitly set to 0', () => {
    const config = buildParamsConfig(
      deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp', THERMOSTAT_PRESET_FROST: '0' }),
    );

    expect(config.preset_frost).to.equal(0);
  });

  // Who regulates a pilot-wire heater is said by the thermostat type (C.1.1).
  it('should let Gladys regulate a pilot wire on a virtual thermostat with a room sensor', () => {
    const config = buildParamsConfig(deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp' }));

    expect(config.pilot_wire_regulation).to.equal('gladys');
  });

  it('should let the heater regulate a pilot wire on a pilot-wire thermostat, sensor or not', () => {
    const config = buildParamsConfig(
      deviceWithParams({ THERMOSTAT_TYPE: 'pilot-wire', THERMOSTAT_TEMPERATURE_FEATURE: 'temp' }),
    );

    expect(config.pilot_wire_regulation).to.equal('heater');
  });

  it('should read a real thermostat given a pilot wire as a pilot-wire thermostat', () => {
    // How such a heater was saved before it had a type of its own.
    const config = buildParamsConfig(
      deviceWithParams({ THERMOSTAT_TYPE: 'external', THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire' }),
    );

    expect(config.thermostat_type).to.equal('pilot-wire');
    expect(config.pilot_wire_regulation).to.equal('heater');
  });

  it('should let the heater regulate a pilot wire with no room sensor to regulate on', () => {
    const config = buildParamsConfig(deviceWithParams({ THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire' }));

    expect(config.pilot_wire_regulation).to.equal('heater');
  });

  it('should let the heater regulate a pilot wire whose sensor list is empty', () => {
    // A list saved with every probe removed names no sensor to regulate on.
    const config = buildParamsConfig(
      deviceWithParams({ THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire', THERMOSTAT_TEMPERATURE_FEATURE: '[]' }),
    );

    expect(config.pilot_wire_regulation).to.equal('heater');
  });

  it('should let Gladys regulate a pilot wire on several room sensors', () => {
    const config = buildParamsConfig(
      deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: '["salon-temp","kitchen-temp"]' }),
    );

    expect(config.pilot_wire_regulation).to.equal('gladys');
  });

  it('should read the order each preset sends, falling back on the defaults', () => {
    const config = buildParamsConfig(
      deviceWithParams({
        THERMOSTAT_TEMPERATURE_FEATURE: 'temp',
        THERMOSTAT_PILOT_WIRE_ORDER_NIGHT: '2',
        // Not one of the six orders: ignored rather than sent.
        THERMOSTAT_PILOT_WIRE_ORDER_ECO: '9',
      }),
    );

    expect(config.pilot_wire_orders).to.deep.equal({ frost: 1, away: 1, eco: 2, night: 2, comfort: 5 });
  });
});

describe('thermostat.deviceConfig - isExternal', () => {
  it('should take a real thermostat for one', () => {
    const config = buildParamsConfig(deviceWithParams({ THERMOSTAT_TYPE: 'external' }));

    expect(isExternal(config)).to.equal(true);
  });

  it('should never take a pilot-wire heater for a real thermostat driven by its setpoint', () => {
    const cases = [
      { THERMOSTAT_TYPE: 'pilot-wire', THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire' },
      { THERMOSTAT_TYPE: 'external', THERMOSTAT_PILOT_WIRE_FEATURE: 'heater-pilot-wire' },
    ];
    cases.forEach((params) => {
      expect(isExternal(buildParamsConfig(deviceWithParams(params))), params.THERMOSTAT_TYPE).to.equal(false);
    });
  });
});

describe('thermostat.deviceConfig - getDeviceConfig', () => {
  it('should build the config from the device params', () => {
    const device = deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor' });

    const config = getDeviceConfig(device);

    expect(config.temperature_features).to.deep.equal(['temp-sensor']);
  });

  it('should return null when the device carries no params', () => {
    // No legacy variable is consulted: the device is the only store, so a
    // thermostat without params simply has no configuration.
    expect(getDeviceConfig({ params: [] })).to.equal(null);
  });

  it('should expose the min/max, unit and manual duration params', () => {
    const config = getDeviceConfig(
      deviceWithParams({
        THERMOSTAT_MIN_TEMP: '10',
        THERMOSTAT_MAX_TEMP: '28',
        THERMOSTAT_TEMP_UNIT: 'F',
        THERMOSTAT_MANUAL_DURATION: '45',
      }),
    );

    expect(config.temp_min).to.equal(10);
    expect(config.temp_max).to.equal(28);
    expect(config.temp_unit).to.equal('F');
    expect(config.manual_duration).to.equal(45);
  });

  it('should default the min/max and the unit when unset', () => {
    const config = getDeviceConfig(deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp' }));

    expect(config.temp_min).to.equal(5);
    expect(config.temp_max).to.equal(35);
    expect(config.temp_unit).to.equal('C');
  });

  it('should leave the manual duration null when unset', () => {
    // An absent duration is the setting "hand the thermostat back at the next
    // schedule point": filling in the default here made that unreachable, since
    // holdExpiry could then never tell the two apart.
    const config = getDeviceConfig(deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp' }));

    expect(config.manual_duration).to.equal(null);
  });
});

describe('thermostat.deviceConfig - getFeatureBySelector', () => {
  it('should return the device and its matching feature', async () => {
    const feature = { selector: 'heater-switch' };
    const gladys = { device: { get: fake.resolves([{ features: [feature] }]) } };

    const found = await getFeatureBySelector(gladys, 'heater-switch');

    expect(found.feature).to.equal(feature);
  });

  it('should return null when no device matches', async () => {
    const gladys = { device: { get: fake.resolves([]) } };

    expect(await getFeatureBySelector(gladys, 'unknown')).to.equal(null);
  });

  it('should return null when the device has no matching feature', async () => {
    const gladys = { device: { get: fake.resolves([{ features: [{ selector: 'other' }] }]) } };

    expect(await getFeatureBySelector(gladys, 'heater-switch')).to.equal(null);
  });
});
