const EventEmitter = require('events');
const { expect } = require('chai');
const { fake } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe.only('Device.getFeatureStates', () => {
  it('should getFeatureStates ', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getLocalServiceByName: fake.resolves({
        id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      }),
    };
    const device = new Device(event, {}, stateManager, service);
    const devices = await device.getFeatureStates({
      device_selector: 'test-device',
      device_feature_selector: 'test-temperature-sensor',
    });

    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1);

    expect(devices[0].features)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1);

    expect(devices[0].features[0].device_feature_states)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(10000);
  });
});
