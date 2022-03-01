const EventEmitter = require('events');
const sinon = require('sinon');

const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const db = require('../../../models');

const event = new EventEmitter();
const serviceName = 'fake-service';

describe('Device', () => {
  let serviceImpl;
  let stateManager;

  beforeEach(async () => {
    serviceImpl = {
      id: 3030383,
      selector: serviceName,
      name: serviceName,
      version: '0.1.0',
    };

    stateManager = new StateManager();
    stateManager.setState('service', serviceName, serviceImpl);

    await db.Service.create(serviceImpl);
  });

  afterEach(async () => {
    const serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });

    await serviceInDb.destroy();

    sinon.reset();
  });

  it('should destroy device', async () => {
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager);
    await device.create({
      name: 'test-device-destroyByServiceId',
      external_id: 'test-device-new-destroyByServiceId',
      service_id: serviceImpl.id,
      selector: 'test-device-destroyByServiceId',
    });

    await device.destroyByServiceId(serviceImpl.id);
  });
});
