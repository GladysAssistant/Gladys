const EventEmitter = require('events');
const { expect } = require('chai');

const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const { ConflictError } = require('../../../utils/coreErrors');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.checkNotBeingDestroyed', () => {
  let device;
  beforeEach(() => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
  });

  it('should refuse a device being deleted in the background', () => {
    device.devicesBeingDestroyed.set('device-id', { id: 'device-id', selector: 'device', external_id: 'mqtt:device' });
    expect(() => device.checkNotBeingDestroyed({ id: 'device-id' })).to.throw(
      ConflictError,
      'Device device-id is being deleted',
    );
  });

  it('should refuse a device deleted in the background, which a stale card would create again', () => {
    device.devicesDestroyedInBackground.add('device-id');
    expect(() => device.checkNotBeingDestroyed({ id: 'device-id' })).to.throw(
      ConflictError,
      'Device device-id is being deleted',
    );
  });

  it('should refuse a device being deleted in the background, saved without its id', () => {
    device.devicesBeingDestroyed.set('device-id', { id: 'device-id', selector: 'device', external_id: 'mqtt:device' });
    expect(() => device.checkNotBeingDestroyed({ external_id: 'mqtt:device' })).to.throw(
      ConflictError,
      'Device device-id is being deleted',
    );
    // an id that is not in the database: `create` falls back on the external_id
    expect(() => device.checkNotBeingDestroyed({ id: 'unknown-id', external_id: 'mqtt:device' })).to.throw(
      ConflictError,
      'Device device-id is being deleted',
    );
  });

  it('should let any other device through, with or without an id', () => {
    device.devicesBeingDestroyed.set('device-id', { id: 'device-id', selector: 'device', external_id: 'mqtt:device' });
    device.devicesDestroyedInBackground.add('deleted-device-id');
    device.checkNotBeingDestroyed({ id: 'another-device-id', external_id: 'mqtt:another-device' });
    device.checkNotBeingDestroyed({ name: 'A new device', external_id: 'mqtt:new-device' });
  });
});
