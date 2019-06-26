const EventEmitter = require('events');
const { expect, assert } = require('chai');
const { fake } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device.get', () => {
  it('should get devices', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getLocalServiceByName: fake.resolves({
        id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      }),
    };
    const device = new Device(event, {}, stateManager, service);
    const devices = await device.get();
    expect(devices).to.be.instanceOf(Array);
  });
  it('should get devices filtered by service', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getLocalServiceByName: fake.resolves({
        id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      }),
    };
    const device = new Device(event, {}, stateManager, service);
    const devices = await device.get({
      service: 'test-service',
    });
    expect(devices).to.be.instanceOf(Array);
  });
  it('should get devices filtered by service and name', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getLocalServiceByName: fake.resolves({
        id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      }),
    };
    const device = new Device(event, {}, stateManager, service);
    const devices = await device.get({
      service: 'test-service',
      search: 'this name does not exist',
    });
    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(0);
  });
  it('should throw not found error', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getLocalServiceByName: fake.resolves(null),
    };
    const device = new Device(event, {}, stateManager, service);
    const promise = device.get({
      service: 'not-found-service',
    });
    return assert.isRejected(promise);
  });
});
