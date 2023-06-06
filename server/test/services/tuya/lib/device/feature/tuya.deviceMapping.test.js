const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../../utils/constants');
const { writeValues, readValues } = require('../../../../../../services/tuya/lib/device/tuya.deviceMapping');

describe('Tuya device mapping', () => {
  describe('write value', () => {
    it('light binary', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BINARY](1);
      expect(result).to.eq(true);
    });
    it('light brightness', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]('50');
      expect(result).to.eq(50);
    });
    it('light temperature', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]('50');
      expect(result).to.eq(950);
    });
    it('light color', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.COLOR](300);
      expect(result).deep.eq({ h: 239, s: 1000, v: 173 });
    });
    it('switch binary', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY](1);
      expect(result).to.eq(true);
    });
  });

  describe('read value', () => {
    it('light binary', () => {
      const result = readValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BINARY](true);
      expect(result).to.eq(1);
    });
    it('light brightness', () => {
      const result = readValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS](50);
      expect(result).to.eq(50);
    });
    it('light temperature', () => {
      const result = readValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]('50');
      expect(result).to.eq(950);
    });
    it('light color', () => {
      const result = readValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.COLOR](
        '{ "h": 239, "s": 1000, "v": 173 }',
      );
      expect(result).to.eq(300);
    });
    it('switch binary', () => {
      const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY](true);
      expect(result).to.eq(1);
    });
  });
});
