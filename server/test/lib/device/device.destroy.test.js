const EventEmitter = require('events');
const { assert } = require('chai');
const { fake, assert: sinonAssert } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');
const { EVENTS } = require('../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.destroy', () => {
  it('should destroy device', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    device.devicesByPollFrequency[60000] = [
      {
        selector: 'test-device',
      },
    ];
    await device.destroy('test-device');
  });
  it('should destroy device that has too much states', async () => {
    const eventFake = {
      emit: fake.returns(0),
      on: fake.returns(0),
    };
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(eventFake, {}, stateManager, serviceManager, {}, {}, job);
    device.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE = 2;
    device.devicesByPollFrequency[60000] = [
      {
        selector: 'test-device',
      },
    ];
    await db.DeviceFeatureState.create({
      value: 10,
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    });
    await db.DeviceFeatureState.create({
      value: 10,
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    });
    await db.DeviceFeatureStateAggregate.create({
      value: 10,
      type: 'daily',
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    });
    const promise = device.destroy('test-device');
    await assert.isRejected(promise, '3 states in DB. Too much states!');
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'ce9dc798-b09f-4e51-8c16-311cdebf97cd',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'bb1af3b9-f87d-4d9c-b5be-958cd9d28900',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'f07c5b27-9301-4482-a059-9f91329d30e7',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      '3b5b4870-145d-4584-bf0e-d97fdcf908b5',
    );
  });
  it('should return device not found', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    const promise = device.destroy('doesnotexist');
    return assert.isRejected(promise);
  });
});
