const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { EventEmitter } = require('events');
const hap = require('../../../../services/homekit/node_modules/@homebridge/hap-nodejs');
const StateManager = require('../../../../lib/state');
const { buildService } = require('../../../../services/homekit/lib/buildService');
const { mappings } = require('../../../../services/homekit/lib/deviceMappings');
const { DEVICE_FEATURE_CATEGORIES: CATEGORIES, DEVICE_FEATURE_TYPES: TYPES } = require('../../../../utils/constants');

describe('HomeKit missing feature state', function missingFeatureTests() {
  this.timeout(500);

  afterEach(() => sinon.restore());

  const cases = [
    { category: CATEGORIES.SWITCH, type: TYPES.SWITCH.BINARY, characteristic: 'On' },
    { category: CATEGORIES.OPENING_SENSOR, type: TYPES.SENSOR.BINARY, characteristic: 'ContactSensorState' },
    { category: CATEGORIES.PRESENCE_SENSOR, type: TYPES.SENSOR.BINARY, characteristic: 'OccupancyDetected' },
    {
      category: CATEGORIES.THERMOSTAT,
      type: TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      characteristic: 'CurrentTemperature',
    },
    {
      category: CATEGORIES.THERMOSTAT,
      type: TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      characteristic: 'TargetTemperature',
    },
    {
      category: CATEGORIES.AIR_CONDITIONING,
      type: TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
      characteristic: 'CurrentTemperature',
    },
    {
      category: CATEGORIES.AIR_CONDITIONING,
      type: TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
      characteristic: 'CoolingThresholdTemperature',
    },
  ];

  cases.forEach(({ category, type, characteristic }) => {
    it(`should answer a missing ${characteristic} instead of leaving its callback pending`, async () => {
      const stateManager = new StateManager();
      const handler = { hap, gladys: { stateManager, event: new EventEmitter() } };
      const feature = { selector: 'radiator-setpoint', name: 'Setpoint', category, type, min: 0, max: 100 };
      const service = buildService.call(
        handler,
        { name: 'Radiator', selector: 'radiator' },
        [feature],
        mappings[category],
      );
      const value = service.getCharacteristic(hap.Characteristic[characteristic]);
      const callback = sinon.stub();

      // Reproduce a GET with an absent StateManager entry, exactly as in the field logs.
      await value.listeners(hap.CharacteristicEventTypes.GET)[0](callback);

      expect(callback.callCount).to.equal(1);
      expect(callback.firstCall.args[0]).to.be.instanceOf(Error);
      expect(callback.firstCall.args[0].message).to.include(feature.selector);

      // The real HAP library must receive a communication error promptly, not wait for its timeout.
      let failure;
      try {
        await value.handleGetRequest();
      } catch (error) {
        failure = error;
      }
      expect(failure).to.equal(hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

      // A new state can make the same characteristic readable again without rebuilding the bridge.
      const binary = ['On', 'ContactSensorState', 'OccupancyDetected'].includes(characteristic);
      const restoredState = binary ? 1 : 21;
      stateManager.setState('deviceFeature', feature.selector, { ...feature, last_value: restoredState });
      const restoredValue = await value.handleGetRequest();
      const expected = {
        ContactSensorState: 0,
        On: true,
        OccupancyDetected: 1,
        CurrentTemperature: 21,
        TargetTemperature: 21,
        CoolingThresholdTemperature: 21,
      };
      expect(restoredValue).to.equal(expected[characteristic]);
    });
  });
});
