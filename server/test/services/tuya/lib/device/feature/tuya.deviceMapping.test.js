const { expect } = require('chai');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  COVER_STATE,
  AC_MODE,
  AC_FAN_SPEED,
} = require('../../../../../../utils/constants');
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
    describe('air conditioning', () => {
      it('binary', () => {
        const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY
        ](1);
        expect(result).to.eq(true);
      });
      it('mode as string number', () => {
        const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE
        ]('2');
        expect(result).to.eq('heat');
      });
      it('mode as string keyword', () => {
        const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE
        ]('cooling');
        expect(result).to.eq('cold');
      });
      it('mode as numeric', () => {
        const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE
        ](AC_MODE.DRYING);
        expect(result).to.eq('wet');
      });
      it('target temperature scaling', () => {
        const writer =
          writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
            DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE
          ];
        expect(writer(null, { max: 30 })).to.equal(null);
        expect(writer('abc', { max: 30 })).to.equal(null);
        expect(writer(20, { max: 30 })).to.equal(200);
        expect(writer(20, { max: 300 })).to.equal(20);
        expect(writer(20, { scale: 1, max: 300 })).to.equal(200);
      });
      it('fan speed mapping', () => {
        const writer =
          writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED];
        expect(writer('3')).to.equal('mid');
        expect(writer('turbo')).to.equal('turbo');
        expect(writer(AC_FAN_SPEED.MID_HIGH)).to.equal('mid_high');
      });
      it('eco/drying/cleaning/aux/line/sleep/health', () => {
        const category = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING];
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.ECO](1)).to.equal(true);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.DRYING](1)).to.equal(true);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.CLEANING](1)).to.equal(true);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.AUX_HEAT](1)).to.equal(true);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.LIGHT](1)).to.equal(true);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SLEEP](1)).to.equal(true);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.HEALTH](1)).to.equal(true);
      });
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
    describe('binary', () => {
      it('switch', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.BINARY](true);
        expect(result).to.eq(1);
      });
      it('energy', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.ENERGY]('30');
        expect(result).to.eq(0.3);
      });
      it('current', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.CURRENT]('20');
        expect(result).to.eq(20);
      });
      it('power', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.POWER]('2245');
        expect(result).to.eq(224.5);
      });
      it('voltage', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.SWITCH][DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]('120');
        expect(result).to.eq(12.0);
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
    describe('air conditioning', () => {
      it('mode mapping', () => {
        const reader =
          readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE];
        expect(reader(2)).to.equal(2);
        expect(reader('hot')).to.equal(AC_MODE.HEATING);
        expect(reader('unknown')).to.equal('unknown');
      });
      it('fan speed mapping', () => {
        const reader =
          readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED];
        expect(reader(2)).to.equal(2);
        expect(reader('low_mid')).to.equal(AC_FAN_SPEED.LOW_MID);
        expect(reader('unknown')).to.equal('unknown');
      });
      it('binary and toggles', () => {
        const category = readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING];
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY](true)).to.equal(1);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.ECO](true)).to.equal(1);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.DRYING](true)).to.equal(1);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.CLEANING](true)).to.equal(1);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.AUX_HEAT](true)).to.equal(1);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.LIGHT](true)).to.equal(1);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SLEEP](true)).to.equal(1);
        expect(category[DEVICE_FEATURE_TYPES.AIR_CONDITIONING.HEALTH](true)).to.equal(1);
      });
    });
    describe('temperature sensor scaling', () => {
      it('should handle null and invalid values', () => {
        const reader = readValues[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.DECIMAL];
        expect(reader(null, { max: 30 })).to.equal(null);
        expect(reader('abc', { max: 30 })).to.equal(null);
      });
      it('should scale with heuristics and scale factor', () => {
        const reader = readValues[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.DECIMAL];
        expect(reader(50, { max: 30 })).to.equal(5);
        expect(reader(20, { max: 30 })).to.equal(20);
        expect(reader(123, { scale: 2 })).to.equal(1.23);
        expect(reader(20, { scale: 'bad', max: 300 })).to.equal(20);
      });
    });
    describe('duration', () => {
      it('integer', () => {
        const reader = readValues[DEVICE_FEATURE_CATEGORIES.DURATION][DEVICE_FEATURE_TYPES.DURATION.INTEGER];
        expect(reader(null)).to.equal(null);
        expect(reader('abc')).to.equal(null);
        expect(reader('42')).to.equal(42);
      });
      it('decimal', () => {
        const reader = readValues[DEVICE_FEATURE_CATEGORIES.DURATION][DEVICE_FEATURE_TYPES.DURATION.DECIMAL];
        expect(reader(null)).to.equal(null);
        expect(reader('abc')).to.equal(null);
        expect(reader('42.5')).to.equal(42.5);
      });
    });
  });
});
