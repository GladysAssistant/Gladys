const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const { buildService } = require('../../../../services/homekit/lib/buildService');
const { mappings } = require('../../../../services/homekit/lib/deviceMappings');
const {
  buildValidHeaterCoolerStates,
  buildThresholdProps,
} = require('../../../../services/homekit/lib/buildHeaterCoolerService');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  DEVICE_FEATURE_UNITS,
  AC_MODE,
  EVENTS,
} = require('../../../../utils/constants');

// What HAP gives the characteristics before the service sets its own props.
const HEATER_COOLER_CHARACTERISTIC_PROPS = {
  Active: { validValues: [0, 1] },
  TargetHeaterCoolerState: { validValues: [0, 1, 2] },
  CurrentTemperature: { minValue: -270, maxValue: 100 },
  HeatingThresholdTemperature: { minValue: 0, maxValue: 25 },
  CoolingThresholdTemperature: { minValue: 10, maxValue: 35 },
};

/**
 * @description Build a HomeKit stub exposing a HeaterCooler service. Each characteristic records
 * its GET/SET handlers so tests can trigger them directly, and setProps changes its props the way
 * HAP does, since the reads are clamped to them.
 * @returns {object} An object holding the fake hap library and the stubbed characteristics.
 * @example
 * const { hap, characteristics } = buildHeaterCoolerHapStub();
 */
function buildHeaterCoolerHapStub() {
  const names = [
    'Active',
    'CurrentHeaterCoolerState',
    'TargetHeaterCoolerState',
    'CurrentTemperature',
    'HeatingThresholdTemperature',
    'CoolingThresholdTemperature',
  ];

  const Characteristic = { TemperatureDisplayUnits: { name: 'TemperatureDisplayUnits', CELSIUS: 0 } };
  const characteristics = {
    TemperatureDisplayUnits: { handlers: {}, props: {}, setProps: stub() },
  };

  names.forEach((name) => {
    Characteristic[name] = { name };
    const characteristic = {
      handlers: {},
      props: { ...(HEATER_COOLER_CHARACTERISTIC_PROPS[name] || {}) },
    };
    characteristic.setProps = stub().callsFake((props) => Object.assign(characteristic.props, props));
    characteristics[name] = characteristic;
  });

  Object.values(characteristics).forEach((characteristic) => {
    characteristic.on = (event, handler) => {
      characteristic.handlers[event] = handler;
      return characteristic;
    };
  });

  const HeaterCooler = stub().returns({
    getCharacteristic: (type) => characteristics[type.name],
    updateCharacteristic: stub(),
  });

  return {
    characteristics,
    hap: {
      Characteristic,
      CharacteristicEventTypes: { GET: 'get', SET: 'set' },
      Perms: { PAIRED_READ: 'PAIRED_READ', PAIRED_WRITE: 'PAIRED_WRITE' },
      Service: { HeaterCooler },
    },
  };
}

/**
 * @description Call the GET handler of a stubbed characteristic and return the value it reports.
 * @param {object} characteristic - Stubbed characteristic holding the handlers.
 * @returns {Promise} The value passed to the HomeKit callback.
 * @example
 * const value = await readCharacteristic(characteristics.Active);
 */
async function readCharacteristic(characteristic) {
  let read;
  await characteristic.handlers.get((error, value) => {
    read = value;
  });
  return read;
}

const POWER = {
  name: 'Marche',
  selector: 'clim-power',
  category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
  type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
  min: 0,
  max: 1,
};
const MODE = {
  name: 'Mode',
  selector: 'clim-mode',
  category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
  type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
  min: AC_MODE.AUTO,
  max: AC_MODE.FAN,
};
const SETPOINT = {
  name: 'Consigne',
  selector: 'clim-setpoint',
  category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
  type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
  unit: DEVICE_FEATURE_UNITS.CELSIUS,
  min: 16,
  max: 31,
};
const TEMPERATURE = {
  name: 'Température',
  selector: 'clim-temp',
  category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
  type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  unit: DEVICE_FEATURE_UNITS.CELSIUS,
};

describe('Heater cooler valid target states', () => {
  it('should derive the states from the AC modes the device declares, without any off', () => {
    // a heat pump declaring auto, cooling and heating: off is not a state, Active carries it
    expect(buildValidHeaterCoolerStates({ modeFeature: { min: AC_MODE.AUTO, max: AC_MODE.HEATING } })).to.eql([
      0,
      1,
      2,
    ]);
    // a cooling only air conditioner: auto and cooling
    expect(buildValidHeaterCoolerStates({ modeFeature: { min: AC_MODE.AUTO, max: AC_MODE.COOLING } })).to.eql([0, 2]);
  });

  it('should follow supported_options rather than the min/max range', () => {
    // a Matter cooling-only air conditioner: cool, dry and fan, so auto stays for dry and fan but
    // heat, which sits inside the 1..4 range, is not offered
    const coolingOnly = {
      min: 1,
      max: 4,
      supported_options: [{ value: AC_MODE.COOLING }, { value: AC_MODE.DRYING }, { value: AC_MODE.FAN }],
    };
    expect(buildValidHeaterCoolerStates({ modeFeature: coolingOnly })).to.eql([0, 2]);
  });

  it('should fall back on the min/max range when the options list is empty', () => {
    expect(
      buildValidHeaterCoolerStates({
        modeFeature: { min: AC_MODE.AUTO, max: AC_MODE.COOLING, supported_options: [] },
      }),
    ).to.eql([0, 2]);
  });

  it('should return no state at all when the device declares only unknown modes', () => {
    expect(buildValidHeaterCoolerStates({ modeFeature: { supported_options: [{ value: 99 }] } })).to.eql([]);
  });

  it('should only offer cool on a device with a setpoint and no mode', () => {
    expect(buildValidHeaterCoolerStates({ setpointFeature: SETPOINT })).to.eql([2]);
  });

  it('should only offer auto on a device with nothing but an on/off command', () => {
    expect(buildValidHeaterCoolerStates({})).to.eql([0]);
  });
});

describe('Heater cooler threshold bounds', () => {
  it('should give both thresholds the range the setpoint declares', () => {
    expect(buildThresholdProps({ min: 16, max: 31 })).to.eql({ minValue: 16, maxValue: 31 });
    // 60.8 °F to 87.8 °F
    expect(buildThresholdProps({ min: 60.8, max: 87.8, unit: DEVICE_FEATURE_UNITS.FAHRENHEIT })).to.eql({
      minValue: 16,
      maxValue: 31,
    });
  });

  it('should keep the range inside what a setpoint can be', () => {
    // Matter declares -100..200 on its setpoints
    expect(buildThresholdProps({ min: -100, max: 200 })).to.eql({ minValue: 10, maxValue: 38 });
    expect(buildThresholdProps({ min: 5, max: 30 })).to.eql({ minValue: 10, maxValue: 30 });
  });

  it('should fall back on the default range when the setpoint declares none, or an empty one', () => {
    expect(buildThresholdProps({})).to.eql({ minValue: 10, maxValue: 38 });
    expect(buildThresholdProps({ min: 20 })).to.eql({ minValue: 20, maxValue: 38 });
    expect(buildThresholdProps({ min: 25, max: 25 })).to.eql({ minValue: 10, maxValue: 38 });
    expect(buildThresholdProps({ min: 200, max: 300 })).to.eql({ minValue: 10, maxValue: 38 });
  });
});

describe('Build heater cooler service', () => {
  const homekitHandler = {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    buildService,
    gladys: {
      event: {},
      stateManager: {},
    },
  };
  const device = { name: 'Clim', selector: 'clim' };

  afterEach(() => {
    sinon.reset();
  });

  it('should build a heater cooler for an air conditioner', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'clim-mode')
      .returns({ last_value: AC_MODE.COOLING });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 24 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    const features = [POWER, MODE, SETPOINT];

    const service = await homekitHandler.buildService(
      device,
      features,
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    expect(hap.Service.HeaterCooler.args[0][0]).to.equal('Clim');
    expect(service).to.equal(hap.Service.HeaterCooler.returnValues[0]);

    // every mode, and no off: the device is switched off through Active
    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [0, 1, 2] });
    expect(characteristics.Active.setProps.callCount).to.equal(0);
    expect(await readCharacteristic(characteristics.Active)).to.equal(1);
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(2);
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(3);
    expect(await readCharacteristic(characteristics.TemperatureDisplayUnits)).to.equal(0);
    // no temperature sensor on the device, the setpoint is the closest reading available
    expect(await readCharacteristic(characteristics.CurrentTemperature)).to.equal(24);
    // the single setpoint stands behind both thresholds, with the range the device declares
    expect(characteristics.CoolingThresholdTemperature.setProps.args[0][0]).to.eql({ minValue: 16, maxValue: 31 });
    expect(characteristics.HeatingThresholdTemperature.setProps.args[0][0]).to.eql({ minValue: 16, maxValue: 31 });
    expect(await readCharacteristic(characteristics.CoolingThresholdTemperature)).to.equal(24);
    expect(await readCharacteristic(characteristics.HeatingThresholdTemperature)).to.equal(24);

    const cb = stub();
    await characteristics.HeatingThresholdTemperature.handlers.set(22.5, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 22.5,
      device: device.selector,
      device_feature: SETPOINT.selector,
    });
    await characteristics.CoolingThresholdTemperature.handlers.set(26, cb);
    expect(homekitHandler.gladys.event.emit.args[1][1].value).to.equal(26);
    expect(homekitHandler.gladys.event.emit.args[1][1].device_feature).to.equal(SETPOINT.selector);

    // a mode change writes the mode alone, HomeKit writes Active itself when it means both
    homekitHandler.gladys.event.emit = stub();
    await characteristics.TargetHeaterCoolerState.handlers.set(1, cb);
    expect(homekitHandler.gladys.event.emit.args).to.eql([
      [
        EVENTS.ACTION.TRIGGERED,
        {
          type: ACTIONS.DEVICE.SET_VALUE,
          status: ACTIONS_STATUS.PENDING,
          value: AC_MODE.HEATING,
          device: device.selector,
          device_feature: MODE.selector,
        },
      ],
    ]);

    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'clim-mode')
      .returns({ last_value: AC_MODE.HEATING });
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(1);
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(2);

    // switching off only writes the binary feature, Gladys has no "off" AC mode
    homekitHandler.gladys.event.emit = stub();
    await characteristics.Active.handlers.set(0, cb);
    expect(homekitHandler.gladys.event.emit.args.map(([, action]) => [action.device_feature, action.value])).to.eql([
      ['clim-power', 0],
    ]);

    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 0 });
    expect(await readCharacteristic(characteristics.Active)).to.equal(0);
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(0);
    // the mode is still reported while off, so the Home app shows which one it will run in
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(1);
  });

  it('should turn the device on in the mode it was in, not in auto', async () => {
    // "Hey Siri, turn on the air conditioning" on a Thermostat used to pick the auto mode, and an
    // air conditioner in auto decides for itself — it heated a home in summer. On a HeaterCooler
    // the same request is a write on Active, and nothing else.
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 0 });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'clim-mode')
      .returns({ last_value: AC_MODE.COOLING });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 24 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    await homekitHandler.buildService(
      device,
      [POWER, MODE, SETPOINT],
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    const cb = stub();
    await characteristics.Active.handlers.set(1, cb);

    expect(homekitHandler.gladys.event.emit.args.map(([, action]) => [action.device_feature, action.value])).to.eql([
      ['clim-power', 1],
    ]);
  });

  it('should not write an auto mode the air conditioner never declared', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: AC_MODE.COOLING });
    homekitHandler.gladys.event.emit = stub();
    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    // a Matter cooling-only air conditioner: cool, dry and fan, no auto
    const features = [
      POWER,
      {
        ...MODE,
        supported_options: [{ value: AC_MODE.COOLING }, { value: AC_MODE.DRYING }, { value: AC_MODE.FAN }],
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    // dry and fan are reported to HomeKit as auto, so auto stays selectable
    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [0, 2] });

    const cb = stub();
    await characteristics.TargetHeaterCoolerState.handlers.set(0, cb);

    // the mode is left alone rather than written to an auto it never declared and could not honour
    expect(homekitHandler.gladys.event.emit.callCount).to.equal(0);

    // a mode it does declare is written
    await characteristics.TargetHeaterCoolerState.handlers.set(2, cb);

    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal('clim-mode');
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(AC_MODE.COOLING);
  });

  it('should still offer the modes when the device declares an empty options list', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 1 });
    homekitHandler.gladys.event.emit = stub();
    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    // loaded from the database, a feature with no declared option carries an empty list, not a
    // missing one: the modes must still be deduced from the min/max range
    const features = [
      { ...POWER, supported_options: [] },
      { ...MODE, max: AC_MODE.COOLING, supported_options: [] },
      { ...SETPOINT, supported_options: [] },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [0, 2] });

    const cb = stub();
    await characteristics.TargetHeaterCoolerState.handlers.set(2, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal('clim-mode');
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(AC_MODE.COOLING);
  });

  it('should leave the target state unconstrained when no mode maps to HomeKit', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 0 });
    homekitHandler.gladys.event.emit = stub();
    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    // an integration declaring only modes HomeKit has no equivalent for would produce an empty
    // validValues list, which HAP rejects: setProps must be skipped rather than called with []
    const features = [{ ...MODE, supported_options: [{ value: 99 }] }];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(characteristics.TargetHeaterCoolerState.setProps.callCount).to.equal(0);
  });

  it('should report idle in the dry and fan modes, and auto as their target', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'clim-mode')
      .returns({ last_value: AC_MODE.DRYING });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 24 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 28 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    await homekitHandler.buildService(
      device,
      [POWER, MODE, SETPOINT, TEMPERATURE],
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(0);
    // the room is warmer than the setpoint, but a device drying is not cooling
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(1);

    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: AC_MODE.FAN });
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(0);
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(1);
  });

  it('should deduce heating or cooling from the room temperature in auto', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: AC_MODE.AUTO });
    // 75.2 °F is 24 °C
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 75.2 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 21 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    const setpoint = { ...SETPOINT, unit: DEVICE_FEATURE_UNITS.FAHRENHEIT, min: 60.8, max: 87.8 };

    await homekitHandler.buildService(
      device,
      [MODE, setpoint, TEMPERATURE],
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    // the room temperature comes from the sensor, in Celsius, not from the setpoint
    expect(await readCharacteristic(characteristics.CurrentTemperature)).to.equal(21);
    expect(await readCharacteristic(characteristics.CoolingThresholdTemperature)).to.be.closeTo(24, 0.001);
    expect(characteristics.CoolingThresholdTemperature.setProps.args[0][0].minValue).to.be.closeTo(16, 0.001);
    expect(characteristics.CoolingThresholdTemperature.setProps.args[0][0].maxValue).to.be.closeTo(31, 0.001);
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(0);
    // colder than the setpoint: heating
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(2);

    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 27 });
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(3);

    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 24 });
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(1);

    // a write goes back to the feature in its own unit
    const cb = stub();
    await characteristics.CoolingThresholdTemperature.handlers.set(25, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(77);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal(SETPOINT.selector);
  });

  it('should not report a cooling-only air conditioner as heating, nor give it a heating slider', async () => {
    // A device that cannot heat sitting below its setpoint is idle. Reporting it as heating would
    // announce a capability HomeKit was told, through the valid target states, that it does not
    // have — and the heating threshold behind it would be a slider the device cannot honour.
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: AC_MODE.AUTO });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 24 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 21 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    // a MELCloud air conditioner offering auto and cool, but no heat
    const mode = { ...MODE, supported_options: [{ value: AC_MODE.AUTO }, { value: AC_MODE.COOLING }] };

    await homekitHandler.buildService(
      device,
      [POWER, mode, SETPOINT, TEMPERATURE],
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [0, 2] });
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(0);
    // colder than the setpoint, and unable to heat: idle, not heating
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(1);
    // warmer than the setpoint, and able to cool: cooling
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 27 });
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(3);

    // the one setpoint stands behind the cooling threshold alone
    expect(characteristics.CoolingThresholdTemperature.setProps.args[0][0]).to.eql({ minValue: 16, maxValue: 31 });
    expect(await readCharacteristic(characteristics.CoolingThresholdTemperature)).to.equal(24);
    expect(characteristics.HeatingThresholdTemperature.handlers.get).to.equal(undefined);
    expect(characteristics.HeatingThresholdTemperature.setProps.callCount).to.equal(0);
  });

  it('should not report a heating-only air conditioner as cooling, nor give it a cooling slider', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    // a mode value the AC_MODE mapping does not know about, which reads as auto
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: 99 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 20 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 24 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    const mode = { ...MODE, supported_options: [{ value: AC_MODE.HEATING }] };

    await homekitHandler.buildService(
      device,
      [POWER, mode, SETPOINT, TEMPERATURE],
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [1] });
    // warmer than the setpoint, and unable to cool: idle, not cooling
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(1);

    expect(await readCharacteristic(characteristics.HeatingThresholdTemperature)).to.equal(20);
    expect(characteristics.CoolingThresholdTemperature.handlers.get).to.equal(undefined);
    expect(characteristics.CoolingThresholdTemperature.setProps.callCount).to.equal(0);
  });

  it('should still expose the setpoint of a device declaring neither heat nor cool', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: AC_MODE.AUTO });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 22 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    // auto, dry and fan only: nothing maps to heat or cool, and the setpoint must stay reachable
    const mode = {
      ...MODE,
      supported_options: [{ value: AC_MODE.AUTO }, { value: AC_MODE.DRYING }, { value: AC_MODE.FAN }],
    };

    await homekitHandler.buildService(
      device,
      [POWER, mode, SETPOINT],
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [0] });
    // an air conditioning setpoint is a cooling one
    expect(await readCharacteristic(characteristics.CoolingThresholdTemperature)).to.equal(22);
    expect(characteristics.HeatingThresholdTemperature.handlers.get).to.equal(undefined);

    const cb = stub();
    await characteristics.CoolingThresholdTemperature.handlers.set(23, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal(SETPOINT.selector);
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(23);
  });

  it('should clamp the readings to the bounds the thresholds were given', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: AC_MODE.AUTO });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 28 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 150 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    // Matter declares -100..200 on its setpoint. The device declares heat, so it gets the heating
    // threshold, whose HAP default range is the one that has to be widened.
    await homekitHandler.buildService(
      device,
      [MODE, { ...SETPOINT, min: -100, max: 200 }, TEMPERATURE],
      mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    );

    expect(characteristics.HeatingThresholdTemperature.setProps.args[0][0]).to.eql({ minValue: 10, maxValue: 38 });
    // 28 °C sits above the 25 °C HAP gives a heating threshold by default, and is reported as is
    expect(await readCharacteristic(characteristics.HeatingThresholdTemperature)).to.equal(28);
    // a sensor reporting out of range must not take the bridge down
    expect(await readCharacteristic(characteristics.CurrentTemperature)).to.equal(100);
  });

  it('should only offer cool on a device with a setpoint and no mode', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 24 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    await homekitHandler.buildService(device, [SETPOINT], mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [2] });
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(2);
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(3);
    // the setpoint is a cooling one, and the device never declared it could heat: no heating slider
    expect(await readCharacteristic(characteristics.CoolingThresholdTemperature)).to.equal(24);
    expect(characteristics.HeatingThresholdTemperature.handlers.get).to.equal(undefined);
    expect(characteristics.HeatingThresholdTemperature.setProps.callCount).to.equal(0);
    // no on/off command: the device is always on, and HomeKit is told it cannot be switched off
    expect(characteristics.Active.setProps.args[0][0]).to.eql({ validValues: [1] });
    expect(await readCharacteristic(characteristics.Active)).to.equal(1);

    const cb = stub();
    await characteristics.Active.handlers.set(0, cb);
    await characteristics.TargetHeaterCoolerState.handlers.set(2, cb);
    // nothing to write either way
    expect(homekitHandler.gladys.event.emit.callCount).to.equal(0);
  });

  it('should build a heater cooler without any temperature feature', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    // a mode value the AC_MODE mapping does not know about
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: 99 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    await homekitHandler.buildService(device, [POWER, MODE], mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    // nothing carries a temperature: CurrentTemperature and the thresholds are left unbound
    expect(characteristics.CurrentTemperature.handlers.get).to.equal(undefined);
    expect(characteristics.CoolingThresholdTemperature.handlers.get).to.equal(undefined);
    expect(characteristics.HeatingThresholdTemperature.handlers.get).to.equal(undefined);
    // an unknown AC mode falls back to auto
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(0);
    // in auto without any temperature to compare, an air conditioner is assumed to be cooling
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(3);
  });

  it('should only offer auto on a device with nothing but an on/off command', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 0 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildHeaterCoolerHapStub();
    homekitHandler.hap = hap;

    await homekitHandler.buildService(device, [POWER], mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(characteristics.TargetHeaterCoolerState.setProps.args[0][0]).to.eql({ validValues: [0] });
    expect(await readCharacteristic(characteristics.TargetHeaterCoolerState)).to.equal(0);
    expect(await readCharacteristic(characteristics.Active)).to.equal(0);
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(0);

    // switched on, it declared neither heat nor cool: it runs, and it says nothing more than that
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 1 });
    expect(await readCharacteristic(characteristics.CurrentHeaterCoolerState)).to.equal(1);

    const cb = stub();
    await characteristics.Active.handlers.set(1, cb);
    expect(homekitHandler.gladys.event.emit.args.map(([, action]) => [action.device_feature, action.value])).to.eql([
      ['clim-power', 1],
    ]);
  });
});
