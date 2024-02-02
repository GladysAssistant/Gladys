const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');
const { writeValues, readValues } = require('../../../../../services/netatmo/lib/device/netatmo.deviceMapping');

describe('Netatmo device mapping', () => {
  describe('writeValues', () => {
    it('should correctly transform THERMOSTAT.TARGET_TEMPERATURE value from Gladys to Netatmo', () => {
      const thermostatValue = 21;
      const mappingFunction =
        writeValues[DEVICE_FEATURE_CATEGORIES.THERMOSTAT][DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE];

      expect(mappingFunction(thermostatValue)).to.equal(21);
    });
  });

  describe('readValues', () => {
    it('should correctly transform THERMOSTAT.TARGET_TEMPERATURE value from Netatmo to Gladys', () => {
      const thermostatValue = 21.5;
      const mappingFunction =
        readValues[DEVICE_FEATURE_CATEGORIES.THERMOSTAT][DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE];

      expect(mappingFunction(thermostatValue)).to.equal(21.5);
    });

    it('should correctly transform SWITCH.BINARY value from Netatmo to Gladys', () => {
      const binarySwitchValueTrue = true;
      const binarySwitchValueFalse = false;
      const numberSwitchValueTrue = 1;
      const numberSwitchValueFalse = 0;
      const mappingFunction = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY];

      expect(mappingFunction(binarySwitchValueTrue)).to.eq(1);
      expect(mappingFunction(binarySwitchValueFalse)).to.eq(0);
      expect(mappingFunction(numberSwitchValueTrue)).to.eq(1);
      expect(mappingFunction(numberSwitchValueFalse)).to.eq(0);
    });

    it('should correctly transform BATTERY.INTEGER value from Netatmo to Gladys', () => {
      const valueFromDevice = 60.5;
      const mappingFunction = readValues[DEVICE_FEATURE_CATEGORIES.BATTERY][DEVICE_FEATURE_TYPES.BATTERY.INTEGER];

      expect(mappingFunction(valueFromDevice)).to.equal(60);
    });

    it('should correctly transform TEMPERATURE_SENSOR.DECIMAL value from Netatmo to Gladys', () => {
      const valueFromDevice = 20.5;
      const mappingFunction =
        readValues[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.DECIMAL];

      expect(mappingFunction(valueFromDevice)).to.equal(20.5);
    });

    it('should correctly transform SIGNAL.QUALITY value from Netatmo to Gladys', () => {
      const valueFromDevice = 76;
      const valueFromDeviceFloat = 76.5;
      const mappingFunction = readValues[DEVICE_FEATURE_CATEGORIES.SIGNAL][DEVICE_FEATURE_TYPES.SIGNAL.QUALITY];

      expect(mappingFunction(valueFromDevice)).to.equal(76);
      expect(mappingFunction(valueFromDeviceFloat)).to.equal(76);
    });

    it('should correctly transform OPENING_SENSOR.BINARY value from Netatmo to Gladys', () => {
      const binarySwitchValueTrue = true;
      const binarySwitchValueFalse = false;
      const numberSwitchValueTrue = 1;
      const numberSwitchValueFalse = 0;
      const mappingFunction = readValues[DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.BINARY];

      expect(mappingFunction(binarySwitchValueTrue)).to.eq(1);
      expect(mappingFunction(binarySwitchValueFalse)).to.eq(0);
      expect(mappingFunction(numberSwitchValueTrue)).to.eq(1);
      expect(mappingFunction(numberSwitchValueFalse)).to.eq(0);
    });

    it('should correctly transform SPEED_SENSOR.INTEGER value from Netatmo to Gladys', () => {
      const valueFromDevice = 10;
      const valueFromDeviceFloat = 10.5;
      const mappingFunction =
        readValues[DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR][DEVICE_FEATURE_TYPES.SPEED_SENSOR.INTEGER];

      expect(mappingFunction(valueFromDevice)).to.equal(10);
      expect(mappingFunction(valueFromDeviceFloat)).to.equal(10);
    });

    it('should correctly transform ANGLE_SENSOR.INTEGER value from Netatmo to Gladys', () => {
      const valueFromDevice = 10;
      const valueFromDeviceFloat = 10.5;
      const mappingFunction = readValues[DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.INTEGER];

      expect(mappingFunction(valueFromDevice)).to.equal(10);
      expect(mappingFunction(valueFromDeviceFloat)).to.equal(10);
    });

    it('should correctly transform PRECIPITATION_SENSOR.DECIMAL value from Netatmo to Gladys', () => {
      const valueFromDevice = 1;
      const valueFromDeviceFloat = 1.5;
      const mappingFunction =
        readValues[DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.DECIMAL];

      expect(mappingFunction(valueFromDevice)).to.equal(1);
      expect(mappingFunction(valueFromDeviceFloat)).to.equal(1.5);
    });
  });
});
