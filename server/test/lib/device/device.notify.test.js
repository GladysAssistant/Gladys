const sinon = require('sinon');

const { fake, assert } = sinon;
const { EVENTS } = require('../../../utils/constants');

const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');

const event = {
  emit: fake.returns(null),
  on: fake.returns(null),
};
const messageManager = {};

const job = new Job(event);

describe('Device.notify', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should notify service on device creation', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const service = {
      device: {
        postCreate: fake.returns(null),
        postUpdate: fake.returns(null),
        postDelete: fake.returns(null),
      },
    };

    const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
    stateManager.setState('serviceById', serviceId, service);

    const device = new Device(event, messageManager, stateManager, serviceManager, {}, {}, job);
    const newDevice = {
      service_id: serviceId,
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    };

    device.notify(newDevice, EVENTS.DEVICE.CREATE);

    assert.calledWith(event.emit, EVENTS.DEVICE.CREATE, newDevice);
    assert.calledWith(service.device.postCreate, newDevice);
    assert.notCalled(service.device.postUpdate);
    assert.notCalled(service.device.postDelete);
  });

  it('should notify service on device errorneous creation', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const service = {
      device: {
        postCreate: fake.rejects(null),
        postUpdate: fake.returns(null),
        postDelete: fake.returns(null),
      },
    };

    const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
    stateManager.setState('serviceById', serviceId, service);

    const device = new Device(event, messageManager, stateManager, serviceManager, {}, {}, job);
    const newDevice = {
      service_id: serviceId,
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    };

    device.notify(newDevice, EVENTS.DEVICE.CREATE);

    assert.calledWith(event.emit, EVENTS.DEVICE.CREATE, newDevice);
    assert.calledWith(service.device.postCreate, newDevice);
    assert.notCalled(service.device.postUpdate);
    assert.notCalled(service.device.postDelete);
  });

  it('should notify service on device update', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const service = {
      device: {
        postCreate: fake.returns(null),
        postUpdate: fake.returns(null),
        postDelete: fake.returns(null),
      },
    };

    const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
    stateManager.setState('serviceById', serviceId, service);

    const device = new Device(event, messageManager, stateManager, serviceManager, {}, {}, job);
    const newDevice = {
      service_id: serviceId,
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    };

    device.notify(newDevice, EVENTS.DEVICE.UPDATE);

    assert.calledWith(event.emit, EVENTS.DEVICE.UPDATE, newDevice);
    assert.notCalled(service.device.postCreate);
    assert.calledWith(service.device.postUpdate, newDevice);
    assert.notCalled(service.device.postDelete);
  });

  it('should notify service on device deletion', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const service = {
      device: {
        postCreate: fake.returns(null),
        postUpdate: fake.returns(null),
        postDelete: fake.returns(null),
      },
    };

    const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
    stateManager.setState('serviceById', serviceId, service);

    const device = new Device(event, messageManager, stateManager, serviceManager, {}, {}, job);
    const newDevice = {
      service_id: serviceId,
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    };

    device.notify(newDevice, EVENTS.DEVICE.DELETE);

    assert.calledWith(event.emit, EVENTS.DEVICE.DELETE, newDevice);
    assert.calledWith(service.device.postDelete, newDevice);
    assert.notCalled(service.device.postCreate);
    assert.notCalled(service.device.postUpdate);
  });

  it('should notify service on device creation, but no service', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);

    const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';

    const device = new Device(event, messageManager, stateManager, serviceManager, {}, {}, job);
    const newDevice = {
      service_id: serviceId,
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    };

    device.notify(newDevice, EVENTS.DEVICE.CREATE);

    assert.calledWith(event.emit, EVENTS.DEVICE.CREATE, newDevice);
  });

  it('should notify service on device creation, but no service function', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const service = {};

    const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
    stateManager.setState('serviceById', serviceId, service);

    const device = new Device(event, messageManager, stateManager, serviceManager, {}, {}, job);
    const newDevice = {
      service_id: serviceId,
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    };

    device.notify(newDevice, EVENTS.DEVICE.CREATE);

    assert.calledWith(event.emit, EVENTS.DEVICE.CREATE, newDevice);
  });

  it('should notify service on device unknown event', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const service = {};

    const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
    stateManager.setState('serviceById', serviceId, service);

    const device = new Device(event, messageManager, stateManager, serviceManager, {}, {}, job);
    const newDevice = {
      service_id: serviceId,
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    };

    device.notify(newDevice, 'UNKNOWN_EVENT');

    assert.notCalled(event.emit);
  });
});
