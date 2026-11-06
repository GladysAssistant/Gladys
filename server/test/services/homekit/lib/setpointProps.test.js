const { expect } = require('chai');
const { buildSetpointProps } = require('../../../../services/homekit/lib/buildThermostatService');
const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');

const DEFAULT_PROPS = { minValue: 10, maxValue: 38 };

describe('HomeKit setpoint bounds', () => {
  it('should retain a Celsius frost setpoint below the default ten degree limit', () => {
    expect(buildSetpointProps([{ min: 5, max: 15, setpoint_step: 0.5 }], DEFAULT_PROPS)).to.eql({
      minValue: 5,
      maxValue: 15,
      minStep: 0.5,
    });
  });

  it('should convert absolute bounds and relative steps from Fahrenheit', () => {
    expect(
      buildSetpointProps(
        [{ min: 41, max: 59, setpoint_step: 0.9, unit: DEVICE_FEATURE_UNITS.FAHRENHEIT }],
        DEFAULT_PROPS,
      ),
    ).to.eql({ minValue: 5, maxValue: 15, minStep: 0.5 });
  });

  it('should convert Kelvin bounds without applying an absolute offset to the step', () => {
    const props = buildSetpointProps(
      [{ min: 278.15, max: 288.15, setpoint_step: 0.5, unit: DEVICE_FEATURE_UNITS.KELVIN }],
      DEFAULT_PROPS,
    );
    expect(props.minValue).to.be.closeTo(5, 0.000001);
    expect(props.maxValue).to.be.closeTo(15, 0.000001);
    expect(props.minStep).to.equal(0.5);
  });

  it('should leave characteristic defaults unchanged when bounds are missing or invalid', () => {
    expect(buildSetpointProps([{}], DEFAULT_PROPS)).to.eql({});
    expect(buildSetpointProps([{ min: 20, max: 5, setpoint_step: 0.5 }], DEFAULT_PROPS)).to.eql({});
    expect(buildSetpointProps([{ min: NaN, max: Infinity, setpoint_step: 0 }], DEFAULT_PROPS)).to.eql({});
    expect(buildSetpointProps([{ setpoint_step: -1 }, { setpoint_step: 0.00000001 }], DEFAULT_PROPS)).to.eql({});
  });

  it('should apply a single bound only when it remains compatible with the other default', () => {
    expect(buildSetpointProps([{ min: 5 }], DEFAULT_PROPS)).to.eql({ minValue: 5 });
    expect(buildSetpointProps([{ max: 15 }], DEFAULT_PROPS)).to.eql({ maxValue: 15 });
    expect(buildSetpointProps([{ min: 40 }], DEFAULT_PROPS)).to.eql({});
    expect(buildSetpointProps([{ max: 5 }], DEFAULT_PROPS)).to.eql({});
    expect(buildSetpointProps([{ min: 7, max: 7 }], DEFAULT_PROPS)).to.eql({ minValue: 7, maxValue: 7 });
  });

  it('should expose the combined range when one target is backed by heating and cooling setpoints', () => {
    expect(
      buildSetpointProps(
        [
          { min: 5, max: 25, setpoint_step: 0.5 },
          { min: 16, max: 30 },
        ],
        DEFAULT_PROPS,
      ),
    ).to.eql({ minValue: 5, maxValue: 30, minStep: 0.5 });
  });
});
