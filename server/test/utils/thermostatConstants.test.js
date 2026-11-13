const { expect } = require('chai');
const { AC_MODE, DEVICE_FEATURE_CATEGORIES, PILOT_WIRE_MODE, THERMOSTAT_MODE } = require('../../utils/constants');
const {
  supportedPilotWireOrder,
  supportedStandbyOrder,
  parsePilotWireStandbyOrder,
  useOfMode,
} = require('../../utils/thermostatConstants');

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

describe('thermostatConstants.supportedStandbyOrder', () => {
  it('should send the standby order chosen to a module that takes it, or declares nothing', () => {
    expect(supportedStandbyOrder(PILOT_WIRE_MODE.ECO, options(PILOT_WIRE_MODE.ECO, PILOT_WIRE_MODE.COMFORT))).to.equal(
      PILOT_WIRE_MODE.ECO,
    );
    expect(supportedStandbyOrder(PILOT_WIRE_MODE.ECO, [])).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should fall back on frost protection, then off, never on nothing a module takes', () => {
    expect(
      supportedStandbyOrder(PILOT_WIRE_MODE.ECO, options(PILOT_WIRE_MODE.FROST_PROTECTION, PILOT_WIRE_MODE.COMFORT)),
    ).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION);
    expect(supportedStandbyOrder(PILOT_WIRE_MODE.ECO, options(PILOT_WIRE_MODE.OFF, PILOT_WIRE_MODE.COMFORT))).to.equal(
      PILOT_WIRE_MODE.OFF,
    );
    expect(supportedStandbyOrder(PILOT_WIRE_MODE.ECO, options(PILOT_WIRE_MODE.COMFORT))).to.equal(null);
  });

  it('should fall back on eco on a module that takes neither frost protection nor off', () => {
    const ecoAndComfort = options(PILOT_WIRE_MODE.ECO, PILOT_WIRE_MODE.COMFORT);
    expect(supportedStandbyOrder(PILOT_WIRE_MODE.FROST_PROTECTION, ecoAndComfort)).to.equal(PILOT_WIRE_MODE.ECO);
    expect(supportedStandbyOrder(PILOT_WIRE_MODE.OFF, ecoAndComfort)).to.equal(PILOT_WIRE_MODE.ECO);
  });
});

describe('thermostatConstants.parsePilotWireStandbyOrder', () => {
  it('should read a stored standby order, as text or as a number', () => {
    expect(parsePilotWireStandbyOrder('2')).to.equal(PILOT_WIRE_MODE.ECO);
    expect(parsePilotWireStandbyOrder('0')).to.equal(PILOT_WIRE_MODE.OFF);
    expect(parsePilotWireStandbyOrder(PILOT_WIRE_MODE.ECO)).to.equal(PILOT_WIRE_MODE.ECO);
  });

  it('should read anything else as frost protection', () => {
    ['5', '2garbage', '2.5', '-1', '', null, undefined].forEach((value) =>
      expect(parsePilotWireStandbyOrder(value), String(value)).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION),
    );
  });
});

describe('thermostatConstants.useOfMode', () => {
  it('should read a thermostat mode', () => {
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.THERMOSTAT, THERMOSTAT_MODE.HEATING)).to.equal('heating');
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.THERMOSTAT, String(THERMOSTAT_MODE.COOLING))).to.equal('cooling');
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.THERMOSTAT, THERMOSTAT_MODE.OFF)).to.equal(undefined);
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.THERMOSTAT, THERMOSTAT_MODE.AUTO)).to.equal(undefined);
  });

  // Heating is 2 in AC_MODE and 1 in THERMOSTAT_MODE.
  it("should read an air conditioner's mode in its own encoding", () => {
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.HEATING)).to.equal('heating');
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.COOLING)).to.equal('cooling');
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.AUTO)).to.equal(undefined);
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.DRYING)).to.equal(undefined);
  });

  it('should pick no use on a feature of another category', () => {
    expect(useOfMode(DEVICE_FEATURE_CATEGORIES.SWITCH, AC_MODE.COOLING)).to.equal(undefined);
  });
});
