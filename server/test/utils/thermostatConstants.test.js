const { expect } = require('chai');
const { PILOT_WIRE_MODE } = require('../../utils/constants');
const {
  supportedPilotWireOrder,
  supportedStandbyOrder,
  parsePilotWireStandbyOrder,
  defaultTempRange,
  DEFAULT_PILOT_WIRE_SWITCH_STATES,
  isPilotWireSwitchStates,
  parsePilotWireSwitchStates,
  pilotWireOrderOfSwitches,
} = require('../../utils/thermostatConstants');

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

// A pilot wire driven by two switches (C.1.2).
describe('thermostatConstants - pilot wire on two switches', () => {
  const stored = (states) => (name) => (states[name] === undefined ? null : states[name]);

  it('should accept a table giving each order its own state', () => {
    expect(isPilotWireSwitchStates(DEFAULT_PILOT_WIRE_SWITCH_STATES)).to.equal(true);
  });

  it('should refuse two orders on the same state, a missing one and a malformed one', () => {
    const { OFF, FROST_PROTECTION, ECO, COMFORT } = PILOT_WIRE_MODE;
    expect(isPilotWireSwitchStates({ [OFF]: '10', [FROST_PROTECTION]: '10', [ECO]: '11', [COMFORT]: '00' })).to.equal(
      false,
    );
    expect(isPilotWireSwitchStates({ [OFF]: '10', [ECO]: '11', [COMFORT]: '00' })).to.equal(false);
    expect(isPilotWireSwitchStates({ [OFF]: '10', [FROST_PROTECTION]: '2', [ECO]: '11', [COMFORT]: '00' })).to.equal(
      false,
    );
    expect(isPilotWireSwitchStates(null)).to.equal(false);
  });

  it('should read the stored states when each order has its own', () => {
    const states = parsePilotWireSwitchStates(
      stored({
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_COMFORT: '11',
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_ECO: '00',
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_FROST_PROTECTION: '10',
        THERMOSTAT_PILOT_WIRE_SWITCH_STATES_OFF: '01',
      }),
    );

    expect(states[PILOT_WIRE_MODE.COMFORT]).to.equal('11');
    expect(states[PILOT_WIRE_MODE.OFF]).to.equal('01');
  });

  it('should fall back on the default table as a whole', () => {
    // One state stored among defaults could send two orders the same way.
    expect(parsePilotWireSwitchStates(stored({ THERMOSTAT_PILOT_WIRE_SWITCH_STATES_COMFORT: '11' }))).to.equal(
      DEFAULT_PILOT_WIRE_SWITCH_STATES,
    );
    expect(parsePilotWireSwitchStates(stored({}))).to.equal(DEFAULT_PILOT_WIRE_SWITCH_STATES);
  });

  it('should name the order the two switches carry', () => {
    const states = DEFAULT_PILOT_WIRE_SWITCH_STATES;
    expect(pilotWireOrderOfSwitches(states, 0, 0)).to.equal(PILOT_WIRE_MODE.COMFORT);
    expect(pilotWireOrderOfSwitches(states, 1, 1)).to.equal(PILOT_WIRE_MODE.ECO);
    expect(pilotWireOrderOfSwitches(states, 0, 1)).to.equal(PILOT_WIRE_MODE.FROST_PROTECTION);
    expect(pilotWireOrderOfSwitches(states, 1, 0)).to.equal(PILOT_WIRE_MODE.OFF);
  });

  it('should name no order while a switch has no state', () => {
    expect(pilotWireOrderOfSwitches(DEFAULT_PILOT_WIRE_SWITCH_STATES, null, 1)).to.equal(null);
    expect(pilotWireOrderOfSwitches(DEFAULT_PILOT_WIRE_SWITCH_STATES, 1, undefined)).to.equal(null);
  });
});
