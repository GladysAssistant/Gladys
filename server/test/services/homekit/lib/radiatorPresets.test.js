const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { EventEmitter } = require('events');
const hap = require('../../../../services/homekit/node_modules/@homebridge/hap-nodejs');
const StateManager = require('../../../../lib/state');
const { buildAccessory } = require('../../../../services/homekit/lib/buildAccessory');
const { buildService } = require('../../../../services/homekit/lib/buildService');
const { sendState } = require('../../../../services/homekit/lib/sendState');
const { EVENTS, DEVICE_FEATURE_UNITS, AC_MODE } = require('../../../../utils/constants');
const { mappings } = require('../../../../services/homekit/lib/deviceMappings');

/**
 * @description Build the four independently writable presets and measured sensor seen in the field.
 * @param {Array} [sensorValues] - Main and optional extra sensor values.
 * @returns {object} A real HAP accessory, its Gladys state and the features behind its cards.
 * @example
 * const radiator = makeRadiator([18.5, 4]);
 */
function makeRadiator(sensorValues = [18.5]) {
  const stateManager = new StateManager();
  const event = new EventEmitter();
  const handler = { hap, gladys: { stateManager, event }, buildService, notifyTimeouts: {} };
  const presets = [
    { selector: 'comfort', name: 'Comfort', last_value: 21, min: 5, max: 30 },
    { selector: 'eco', name: 'Eco', last_value: 17, min: 5, max: 30 },
    { selector: 'frost', name: 'Frost protection', last_value: 7, min: 5, max: 15 },
    { selector: 'target', name: 'Current setpoint', last_value: 19.5, min: 5, max: 30 },
  ].map((feature) => ({
    ...feature,
    category: 'thermostat',
    type: 'target-temperature',
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    setpoint_step: 0.5,
  }));
  const sensors = sensorValues.map((lastValue, index) => ({
    selector: `sensor-${index}`,
    name: `Measured temperature ${index}`,
    category: 'temperature-sensor',
    type: 'decimal',
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    last_value: lastValue,
  }));
  const device = {
    id: '4f4585a4-e79c-43e1-93ca-29d9588a7609',
    name: 'Radiator',
    selector: 'radiator',
    features: [...presets, ...sensors],
  };
  device.features.forEach((feature) => stateManager.setState('deviceFeature', feature.selector, feature));
  const accessory = buildAccessory.call(handler, device);
  const services = accessory.services.filter((service) => service.UUID === hap.Service.Thermostat.UUID);
  return { handler, accessory, services, presets, sensors, stateManager, event };
}

describe('HomeKit radiator preset cards', () => {
  afterEach(() => sinon.restore());

  it('should keep four independent cards with the same measured temperature and their own targets', async () => {
    const { services } = makeRadiator();
    expect(services.map((service) => service.subtype)).to.eql([
      'thermostat 1',
      'thermostat 2',
      'thermostat 3',
      'thermostat 4',
    ]);
    const readings = await Promise.all(
      services.map((service) => service.getCharacteristic(hap.Characteristic.CurrentTemperature).handleGetRequest()),
    );
    expect(readings).to.eql([18.5, 18.5, 18.5, 18.5]);
    const targets = await Promise.all(
      services.map((service) => service.getCharacteristic(hap.Characteristic.TargetTemperature).handleGetRequest()),
    );
    expect(targets).to.eql([21, 17, 7, 19.5]);
  });

  it('should preserve the frost range, step and write destination through real HAP requests', async () => {
    const { services, event } = makeRadiator();
    const emit = sinon.spy(event, 'emit');
    const target = services[2].getCharacteristic(hap.Characteristic.TargetTemperature);
    expect(target.props).to.include({ minValue: 5, maxValue: 15, minStep: 0.5 });
    expect(await target.handleGetRequest()).to.equal(7);
    await target.handleSetRequest(6.5);
    expect(emit.callCount).to.equal(1);
    expect(emit.firstCall.args[0]).to.equal(EVENTS.ACTION.TRIGGERED);
    expect(emit.firstCall.args[1]).to.include({ device: 'radiator', device_feature: 'frost', value: 6.5 });
  });

  it('should push a measured temperature change to all four cards without changing the targets', async () => {
    const { handler, accessory, services, sensors, stateManager } = makeRadiator();
    await Promise.all(
      services.map((service) => service.getCharacteristic(hap.Characteristic.TargetTemperature).handleGetRequest()),
    );
    stateManager.setState('deviceFeature', sensors[0].selector, { last_value: 20.5 });
    sendState.call(handler, accessory, sensors[0], { last_value: 20.5 });
    expect(services.map((service) => service.getCharacteristic(hap.Characteristic.CurrentTemperature).value)).to.eql([
      20.5,
      20.5,
      20.5,
      20.5,
    ]);
    expect(services.map((service) => service.getCharacteristic(hap.Characteristic.TargetTemperature).value)).to.eql([
      21,
      17,
      7,
      19.5,
    ]);
  });

  it('should push a preset change only to its own card', async () => {
    const { handler, accessory, services, presets, stateManager } = makeRadiator();
    await Promise.all(
      services.map((service) => service.getCharacteristic(hap.Characteristic.TargetTemperature).handleGetRequest()),
    );
    stateManager.setState('deviceFeature', presets[1].selector, { last_value: 16.5 });
    sendState.call(handler, accessory, presets[1], { last_value: 16.5 });
    expect(services.map((service) => service.getCharacteristic(hap.Characteristic.TargetTemperature).value)).to.eql([
      21,
      16.5,
      7,
      19.5,
    ]);
  });

  it('should keep an extra sensor independent from the temperature shared by the four cards', async () => {
    const { handler, accessory, services, sensors, stateManager } = makeRadiator([18.5, 4]);
    await Promise.all(
      services.map((service) => service.getCharacteristic(hap.Characteristic.CurrentTemperature).handleGetRequest()),
    );
    stateManager.setState('deviceFeature', sensors[1].selector, { last_value: 5 });
    sendState.call(handler, accessory, sensors[1], { last_value: 5 });
    expect(
      accessory.getService(hap.Service.TemperatureSensor).getCharacteristic(hap.Characteristic.CurrentTemperature)
        .value,
    ).to.equal(5);
    expect(services.map((service) => service.getCharacteristic(hap.Characteristic.CurrentTemperature).value)).to.eql([
      18.5,
      18.5,
      18.5,
      18.5,
    ]);
  });

  it('should recover every card when the measured sensor returns after an unavailable period', async () => {
    const { services, sensors, stateManager } = makeRadiator();
    stateManager.deleteState('deviceFeature', sensors[0].selector);
    const errors = await Promise.all(
      services.map(async (service) => {
        try {
          await service.getCharacteristic(hap.Characteristic.CurrentTemperature).handleGetRequest();
          return undefined;
        } catch (error) {
          return error;
        }
      }),
    );
    expect(errors).to.eql(Array(4).fill(hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE));
    stateManager.setState('deviceFeature', sensors[0].selector, { ...sensors[0], last_value: 19 });
    expect(
      await Promise.all(
        services.map((service) => service.getCharacteristic(hap.Characteristic.CurrentTemperature).handleGetRequest()),
      ),
    ).to.eql([19, 19, 19, 19]);
  });

  it('should read and write a Fahrenheit frost setpoint in the units declared by the radiator', async () => {
    const stateManager = new StateManager();
    const event = new EventEmitter();
    const emit = sinon.spy(event, 'emit');
    const handler = { hap, gladys: { stateManager, event } };
    const feature = {
      selector: 'frost-fahrenheit',
      name: 'Frost protection',
      category: 'thermostat',
      type: 'target-temperature',
      unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
      min: 41,
      max: 59,
      setpoint_step: 0.9,
      last_value: 44.6,
    };
    stateManager.setState('deviceFeature', feature.selector, feature);
    const service = buildService.call(
      handler,
      { name: 'Radiator', selector: 'radiator' },
      [feature],
      mappings.thermostat,
    );
    const target = service.getCharacteristic(hap.Characteristic.TargetTemperature);
    expect(target.props).to.include({ minValue: 5, maxValue: 15, minStep: 0.5 });
    expect(await target.handleGetRequest()).to.equal(7);
    await target.handleSetRequest(6.5);
    expect(emit.firstCall.args[1].value).to.be.closeTo(43.7, 0.000001);
    expect(emit.firstCall.args[1].device_feature).to.equal(feature.selector);
  });

  it('should limit writes to the active setpoint when heating and cooling use different ranges', async () => {
    const stateManager = new StateManager();
    const event = new EventEmitter();
    const emit = sinon.spy(event, 'emit');
    const handler = { hap, gladys: { stateManager, event } };
    const features = [
      {
        selector: 'heating',
        category: 'thermostat',
        type: 'target-temperature',
        min: 5,
        max: 25,
        last_value: 20,
      },
      {
        selector: 'cooling',
        category: 'air-conditioning',
        type: 'target-temperature',
        min: 16,
        max: 30,
        last_value: 24,
      },
      {
        selector: 'mode',
        category: 'air-conditioning',
        type: 'mode',
        min: AC_MODE.AUTO,
        max: AC_MODE.HEATING,
        last_value: AC_MODE.HEATING,
      },
    ];
    features.forEach((feature) => stateManager.setState('deviceFeature', feature.selector, feature));
    const service = buildService.call(
      handler,
      { name: 'Heat pump', selector: 'heat-pump' },
      features,
      mappings.thermostat,
    );
    const target = service.getCharacteristic(hap.Characteristic.TargetTemperature);
    expect(target.props).to.include({ minValue: 5, maxValue: 30 });
    await target.handleSetRequest(29);
    expect(emit.lastCall.args[1]).to.include({ device_feature: 'heating', value: 25 });
    stateManager.setState('deviceFeature', 'mode', { last_value: AC_MODE.COOLING });
    await target.handleSetRequest(5);
    expect(emit.lastCall.args[1]).to.include({ device_feature: 'cooling', value: 16 });
  });
});
