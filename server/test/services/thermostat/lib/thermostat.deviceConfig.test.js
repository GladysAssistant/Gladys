const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const {
  toNumber,
  buildParamsConfig,
  getDeviceConfig,
  getFeatureBySelector,
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
  it('should return null when the device has no params', () => {
    expect(buildParamsConfig({ params: [] })).to.equal(null);
    expect(buildParamsConfig({})).to.equal(null);
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

    expect(config.temperature_feature).to.equal('temp-sensor');
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
});

describe('thermostat.deviceConfig - getDeviceConfig', () => {
  it('should build the config from the device params', () => {
    const device = deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp-sensor' });

    const config = getDeviceConfig(device);

    expect(config.temperature_feature).to.equal('temp-sensor');
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

  it('should default the min/max, unit and manual duration when unset', () => {
    const config = getDeviceConfig(deviceWithParams({ THERMOSTAT_TEMPERATURE_FEATURE: 'temp' }));

    expect(config.temp_min).to.equal(5);
    expect(config.temp_max).to.equal(35);
    expect(config.temp_unit).to.equal('C');
    expect(config.manual_duration).to.equal(30);
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
