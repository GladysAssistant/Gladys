const { expect } = require('chai');
const {
  buildValidTargetStates,
  toCelsius,
  fromCelsius,
} = require('../../../../services/homekit/lib/buildThermostatService');
const { clampToCharacteristic } = require('../../../../services/homekit/lib/deviceMappings');
const { DEVICE_FEATURE_UNITS, AC_MODE, THERMOSTAT_MODE } = require('../../../../utils/constants');

const HEATING_SETPOINT = { selector: 'heating' };
const COOLING_SETPOINT = { selector: 'cooling' };
const POWER = { selector: 'power' };

describe('Thermostat unit conversion', () => {
  it('should convert to Celsius from every unit Gladys can carry', () => {
    expect(toCelsius(20, DEVICE_FEATURE_UNITS.CELSIUS)).to.equal(20);
    expect(toCelsius(293.15, DEVICE_FEATURE_UNITS.KELVIN)).to.be.closeTo(20, 0.001);
    expect(toCelsius(68, DEVICE_FEATURE_UNITS.FAHRENHEIT)).to.equal(20);
    // an undeclared unit is already Celsius, HomeKit exchanges nothing else
    expect(toCelsius(20, undefined)).to.equal(20);
  });

  it('should convert back from Celsius to the feature unit', () => {
    expect(fromCelsius(20, DEVICE_FEATURE_UNITS.CELSIUS)).to.equal(20);
    expect(fromCelsius(20, DEVICE_FEATURE_UNITS.KELVIN)).to.be.closeTo(293.15, 0.001);
    expect(fromCelsius(20, DEVICE_FEATURE_UNITS.FAHRENHEIT)).to.equal(68);
    expect(fromCelsius(20, undefined)).to.equal(20);
  });
});

describe('Thermostat characteristic clamping', () => {
  it('should clamp a temperature between the characteristic bounds', () => {
    expect(clampToCharacteristic(45, { minValue: 10, maxValue: 38 })).to.equal(38);
    expect(clampToCharacteristic(5, { minValue: 10, maxValue: 38 })).to.equal(10);
    expect(clampToCharacteristic(21, { minValue: 10, maxValue: 38 })).to.equal(21);
  });

  it('should leave the value alone when the characteristic declares no bound', () => {
    expect(clampToCharacteristic(45, {})).to.equal(45);
    expect(clampToCharacteristic(45, { minValue: 10 })).to.equal(45);
    expect(clampToCharacteristic(5, { maxValue: 38 })).to.equal(5);
    expect(clampToCharacteristic(45)).to.equal(45);
  });
});

describe('Thermostat valid target states', () => {
  it('should only offer heat on a heating only thermostat', () => {
    expect(buildValidTargetStates({ heatingSetpointFeature: HEATING_SETPOINT })).to.eql([1]);
  });

  it('should only offer cool on a cooling only device', () => {
    expect(buildValidTargetStates({ coolingSetpointFeature: COOLING_SETPOINT })).to.eql([2]);
  });

  it('should offer auto when both setpoints exist without a mode feature', () => {
    expect(
      buildValidTargetStates({
        heatingSetpointFeature: HEATING_SETPOINT,
        coolingSetpointFeature: COOLING_SETPOINT,
      }),
    ).to.eql([3]);
  });

  it('should follow supported_options rather than the min/max range', () => {
    // Matter reports a cooling-only air conditioner as cool, dry and fan — 1, 3 and 4 — so the
    // 1..4 range would wrongly include heat, which is 2
    const coolingOnly = {
      min: 1,
      max: 4,
      supported_options: [{ value: 1 }, { value: 3 }, { value: 4 }],
    };
    // cool, plus auto for dry and fan, and no heat
    expect(buildValidTargetStates({ modeFeature: coolingOnly })).to.eql([2, 3]);

    // and the other way round: auto and heat must not bring cool along
    const autoAndHeating = {
      min: 0,
      max: 2,
      supported_options: [{ value: 0 }, { value: 2 }],
    };
    expect(buildValidTargetStates({ modeFeature: autoAndHeating })).to.eql([1, 3]);
  });

  it('should return no state at all when the device declares only unknown modes', () => {
    // an integration whose modes have no HomeKit equivalent must not produce an empty validValues
    // list silently accepted as valid: the caller checks the length before calling setProps
    expect(buildValidTargetStates({ modeFeature: { supported_options: [{ value: 99 }] } })).to.eql([]);
  });

  it('should fall back on the min/max range when no options are declared', () => {
    expect(buildValidTargetStates({ modeFeature: { min: 0, max: 4 } })).to.eql([1, 2, 3]);
    expect(buildValidTargetStates({ modeFeature: { min: 2, max: 2 } })).to.eql([1]);
  });

  it('should offer off only when the device has an on/off command', () => {
    expect(
      buildValidTargetStates({
        powerFeature: POWER,
        heatingSetpointFeature: HEATING_SETPOINT,
      }),
    ).to.eql([0, 1]);
  });

  it('should offer off on a thermostat mode, which carries its own off value', () => {
    // a heating only thermostat: off and heat, and no cool the device could not honour — the whole
    // point of mapping the thermostat mode, since without it the device is heat-only with no off
    expect(
      buildValidTargetStates({
        thermostatModeFeature: {
          supported_options: [{ value: THERMOSTAT_MODE.OFF }, { value: THERMOSTAT_MODE.HEATING }],
        },
        heatingSetpointFeature: HEATING_SETPOINT,
      }),
    ).to.eql([0, 1]);
  });

  it('should fall back on the min/max range of a thermostat mode', () => {
    // what the MQTT integration declares by default for a thermostat mode feature
    expect(buildValidTargetStates({ thermostatModeFeature: { min: 0, max: 3 } })).to.eql([0, 1, 2, 3]);
    expect(
      buildValidTargetStates({ thermostatModeFeature: { min: THERMOSTAT_MODE.OFF, max: THERMOSTAT_MODE.HEATING } }),
    ).to.eql([0, 1]);
  });

  it('should not offer off twice when the device has both an on/off command and a thermostat mode', () => {
    expect(
      buildValidTargetStates({
        powerFeature: POWER,
        thermostatModeFeature: { supported_options: [{ value: THERMOSTAT_MODE.OFF }, { value: THERMOSTAT_MODE.AUTO }] },
      }),
    ).to.eql([0, 3]);
  });

  it('should offer only the air conditioning states when both mode features exist', () => {
    // the air conditioning mode is the authority for the reads and the writes, so offering heat
    // here would let HomeKit set a state the next read could not report back
    expect(
      buildValidTargetStates({
        modeFeature: { supported_options: [{ value: AC_MODE.COOLING }] },
        thermostatModeFeature: { supported_options: [{ value: THERMOSTAT_MODE.HEATING }] },
      }),
    ).to.eql([2]);
  });

  it('should ignore the setpoints when a thermostat mode is declared', () => {
    // both setpoints would otherwise fold into auto, which this device does not support
    expect(
      buildValidTargetStates({
        thermostatModeFeature: { supported_options: [{ value: THERMOSTAT_MODE.HEATING }] },
        heatingSetpointFeature: HEATING_SETPOINT,
        coolingSetpointFeature: COOLING_SETPOINT,
      }),
    ).to.eql([1]);
  });

  it('should derive the states from the AC modes the device declares', () => {
    // a heat pump declaring auto, cooling and heating
    expect(
      buildValidTargetStates({
        modeFeature: { min: AC_MODE.AUTO, max: AC_MODE.HEATING },
      }),
    ).to.eql([1, 2, 3]);
    // a cooling only air conditioner: auto and cooling, dry and fan both fold into auto
    expect(
      buildValidTargetStates({
        modeFeature: { min: AC_MODE.AUTO, max: AC_MODE.COOLING },
      }),
    ).to.eql([2, 3]);
  });
});
