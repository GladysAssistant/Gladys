const { expect } = require('chai');
const { PILOT_WIRE_MODE } = require('../../utils/constants');
const { supportedPilotWireOrder, defaultTempRange } = require('../../utils/thermostatConstants');

describe('thermostatConstants.defaultTempRange', () => {
  it('should give the default range in Celsius', () => {
    expect(defaultTempRange('C')).to.deep.equal({ min: 5, max: 35 });
    expect(defaultTempRange(undefined)).to.deep.equal({ min: 5, max: 35 });
  });

  it('should give the default range in whole Fahrenheit degrees', () => {
    expect(defaultTempRange('F')).to.deep.equal({ min: 41, max: 95 });
  });
});

const options = (...values) => values.map((value) => ({ value }));

describe('thermostatConstants.supportedPilotWireOrder', () => {
  const fourOrders = options(
    PILOT_WIRE_MODE.OFF,
    PILOT_WIRE_MODE.FROST_PROTECTION,
    PILOT_WIRE_MODE.ECO,
    PILOT_WIRE_MODE.COMFORT,
  );

  it('should send any order to a module that declares none', () => {
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.COMFORT_2, [])).to.equal(PILOT_WIRE_MODE.COMFORT_2);
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.COMFORT_2, undefined)).to.equal(PILOT_WIRE_MODE.COMFORT_2);
  });

  it('should send an order the module declares as it is', () => {
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.ECO, fourOrders)).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should send comfort for a derived comfort the module does not take', () => {
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.COMFORT_1, fourOrders)).to.equal(PILOT_WIRE_MODE.COMFORT);
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.COMFORT_2, fourOrders)).to.equal(PILOT_WIRE_MODE.COMFORT);
  });

  it('should send nothing the module does not take', () => {
    const noEco = options(PILOT_WIRE_MODE.OFF, PILOT_WIRE_MODE.FROST_PROTECTION);
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.ECO, noEco)).to.equal(null);
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.COMFORT_1, noEco)).to.equal(null);
  });

  it('should send off for frost protection the module does not take', () => {
    const noFrost = options(PILOT_WIRE_MODE.OFF, PILOT_WIRE_MODE.ECO, PILOT_WIRE_MODE.COMFORT);
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.FROST_PROTECTION, noFrost)).to.equal(PILOT_WIRE_MODE.OFF);
    const comfortOnly = options(PILOT_WIRE_MODE.ECO, PILOT_WIRE_MODE.COMFORT);
    expect(supportedPilotWireOrder(PILOT_WIRE_MODE.FROST_PROTECTION, comfortOnly)).to.equal(null);
  });
});
