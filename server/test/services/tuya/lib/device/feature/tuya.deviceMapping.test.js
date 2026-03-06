const { expect } = require('chai');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  COVER_STATE,
  OPENING_SENSOR_STATE,
  AC_MODE,
  AC_FAN_SPEED,
  AC_SWING_HORIZONTAL,
  AC_SWING_VERTICAL,
  PILOT_WIRE_MODE,
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
    it('child lock binary', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.CHILD_LOCK][DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY](1);
      expect(result).to.eq(true);
    });
    it('air conditioning binary', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
        DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY
      ](1);
      expect(result).to.eq(true);
    });
    it('thermostat target temperature', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.THERMOSTAT][
        DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE
      ]('21.5', {
        scale: 1,
      });
      expect(result).to.eq(215);
    });
    it('thermostat target temperature invalid value returns NaN', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.THERMOSTAT][
        DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE
      ]('not-a-number', {
        scale: 1,
      });
      expect(Number.isNaN(result)).to.equal(true);
    });
    it('heater pilot wire mode', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.HEATER][DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE](
        PILOT_WIRE_MODE.PROGRAMMING,
      );
      expect(result).to.eq('Programming');
    });
    it('air conditioning mode', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
        DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE
      ](AC_MODE.HEATING);
      expect(result).to.eq('heat');
    });
    it('air conditioning target temperature', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
        DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE
      ]('20', {
        scale: 1,
      });
      expect(result).to.eq(200);
    });
    it('air conditioning fan speed', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
        DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED
      ](AC_FAN_SPEED.TURBO);
      expect(result).to.eq('turbo');
    });
    it('air conditioning horizontal swing', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
        DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL
      ](AC_SWING_HORIZONTAL.OPPOSITE);
      expect(result).to.eq('opposite');
    });
    it('air conditioning vertical swing', () => {
      const result = writeValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
        DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_VERTICAL
      ](AC_SWING_VERTICAL.SWING);
      expect(result).to.eq('15');
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
      it('child lock', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.CHILD_LOCK][DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY]('true');
        expect(result).to.eq(1);
      });
      it('thermostat target temperature with explicit scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.THERMOSTAT][
          DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE
        ]('210', {
          scale: 1,
        });
        expect(result).to.eq(21);
      });
      it('air conditioning binary', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY
        ](true);
        expect(result).to.eq(1);
      });
      it('air conditioning mode', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE
        ]('heat');
        expect(result).to.eq(AC_MODE.HEATING);
      });
      it('air conditioning target temperature with explicit scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE
        ]('200', {
          scale: 1,
        });
        expect(result).to.eq(20);
      });
      it('air conditioning fan speed', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED
        ]('auto');
        expect(result).to.eq(AC_FAN_SPEED.AUTO);
      });
      it('air conditioning horizontal swing', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL
        ]('same');
        expect(result).to.eq(AC_SWING_HORIZONTAL.SAME);
      });
      it('air conditioning vertical swing', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING][
          DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_VERTICAL
        ]('15');
        expect(result).to.eq(AC_SWING_VERTICAL.SWING);
      });
      it('temperature sensor decimal with explicit scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.DECIMAL](
          '152',
          {
            scale: 1,
          },
        );
        expect(result).to.eq(15.2);
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
      it('index today with scale', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR][
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX_TODAY
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
    describe('opening sensor', () => {
      it('maps true to open', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.BINARY](true);
        expect(result).to.eq(OPENING_SENSOR_STATE.OPEN);
      });
      it('maps false to close', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR][DEVICE_FEATURE_TYPES.SENSOR.BINARY](false);
        expect(result).to.eq(OPENING_SENSOR_STATE.CLOSE);
      });
    });
    describe('heater pilot wire mode', () => {
      it('maps programming mode', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.HEATER][DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE](
          'Programming',
        );
        expect(result).to.eq(PILOT_WIRE_MODE.PROGRAMMING);
      });
      it('maps thermostat mode', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.HEATER][DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE](
          'Thermostat',
        );
        expect(result).to.eq(PILOT_WIRE_MODE.THERMOSTAT);
      });
      it('returns null for unknown mode', () => {
        const result = readValues[DEVICE_FEATURE_CATEGORIES.HEATER][DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE](
          'Boost',
        );
        expect(result).to.eq(null);
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
