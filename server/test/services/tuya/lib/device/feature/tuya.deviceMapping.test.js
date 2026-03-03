const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, COVER_STATE } = require('../../../../../../utils/constants');
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
    describe('curtain state', () => {
      it('open', () => {
        const result = writeValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.STATE](
          COVER_STATE.OPEN,
        );
        expect(result).to.eq('open');
      });
      it('close', () => {
        const result = writeValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.STATE](
          COVER_STATE.CLOSE,
        );
        expect(result).to.eq('close');
      });
      it('stop', () => {
        const result = writeValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.STATE](
          COVER_STATE.STOP,
        );
        expect(result).to.eq('stop');
      });
    });
    it('custain position', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.POSITION]('30');
      expect(result).to.eq(30);
    });
  });

  describe('read value', () => {
    it('light binary', () => {
      const result = readValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BINARY](true);
      expect(result).to.eq(1);
    });
    it('light binary string', () => {
      const result = readValues[DEVICE_FEATURE_CATEGORIES.LIGHT][DEVICE_FEATURE_TYPES.LIGHT.BINARY]('true');
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
    describe('binary', () => {
      it('switch', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY](true);
        expect(result).to.eq(1);
      });
      it('switch number', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY](1);
        expect(result).to.eq(1);
      });
      it('switch string false', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY]('false');
        expect(result).to.eq(0);
      });
      it('switch string on', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY]('ON');
        expect(result).to.eq(1);
      });
      it('energy', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.ENERGY]('30');
        expect(result).to.eq(0.3);
      });
      it('energy with explicit scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.ENERGY]('30', {
          scale: 1,
        });
        expect(result).to.eq(3);
      });
      it('current', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.CURRENT]('20');
        expect(result).to.eq(20);
      });
      it('current with explicit scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.CURRENT]('205', {
          scale: 1,
        });
        expect(result).to.eq(20.5);
      });
      it('power', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.POWER]('2245');
        expect(result).to.eq(224.5);
      });
      it('power with explicit scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.POWER]('2245', {
          scale: 2,
        });
        expect(result).to.eq(22.45);
      });
      it('voltage', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]('120');
        expect(result).to.eq(12.0);
      });
      it('voltage with explicit scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]('2352', {
          scale: 1,
        });
        expect(result).to.eq(235.2);
      });
      it('switch power invalid value returns NaN', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.POWER]('not-a-number');
        expect(Number.isNaN(result)).to.equal(true);
      });
    });
    describe('energy sensor', () => {
      it('energy sensor power invalid value returns NaN', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR][DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER](
          'not-a-number',
        );
        expect(Number.isNaN(result)).to.equal(true);
      });
      it('power with scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR][
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER
        ]('706', { scale: 1 });
        expect(result).to.eq(70.6);
      });
      it('energy with scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR][
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY
        ]('149241', { scale: 2 });
        expect(result).to.eq(1492.41);
      });
      it('voltage with scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR][
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE
        ]('2301', { scale: 1 });
        expect(result).to.eq(230.1);
      });
      it('current without scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR][
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT
        ]('123', { scale: 0 });
        expect(result).to.eq(123);
      });
      it('production index with scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR][
          DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX
        ]('43222', { scale: 2 });
        expect(result).to.eq(432.22);
      });
    });
    describe('curtain state', () => {
      it('open', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.STATE]('open');
        expect(result).to.eq(COVER_STATE.OPEN);
      });
      it('close', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.STATE]('close');
        expect(result).to.eq(COVER_STATE.CLOSE);
      });
      it('stop', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.STATE]('STOP');
        expect(result).to.eq(COVER_STATE.STOP);
      });
      it('curtain position', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.CURTAIN][DEVICE_FEATURE_TYPES.CURTAIN.POSITION](30);
        expect(result).to.eq(30);
      });
    });
  });
});
