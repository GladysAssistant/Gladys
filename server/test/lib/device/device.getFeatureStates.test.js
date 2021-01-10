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

    // TODO injecter les mesure en debut

    const params = {
      device_feature_selector: ['test-temperature-sensor-2'],
      begin_date: '2020-12-31 22:14:26.590 +00:00',
      end_date: '2021-01-01 22:14:26.590 +00:00',
    };
    // Choose attributes
    params.attributes_device = [];
    params.attributes_device.push('name');
    params.attributes_device.push('selector');
    params.attributes_device_feature = [];
    params.attributes_device_feature.push('id');
    params.attributes_device_feature.push('name');
    params.attributes_device_feature.push('selector');
    params.attributes_device_feature.push('unit');
    params.attributes_device_feature.push('last_value');
    params.attributes_device_feature.push('last_value_changed');
    params.attributes_device_room = [];
    params.attributes_device_room.push('name');
    params.attributes_device_room.push('selector');

    const devices = await device.getFeatureStates(params);

    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1);

    expect(devices[0].features)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1);

    expect(devices[0].features[0].device_feature_states)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(49);
  });
});
