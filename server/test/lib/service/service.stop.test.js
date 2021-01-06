const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const db = require('../../../models');
const { SERVICE_STATUS } = require('../../../utils/constants');

const services = {};
const serviceName = 'fake-service';

describe('service.stop', () => {
  let serviceImpl;
  let stateManager;
  let service;

  beforeEach(async () => {
    serviceImpl = {
      selector: serviceName,
      name: serviceName,
      version: '0.1.0',
      status: SERVICE_STATUS.UNKNOWN,
    };

    stateManager = new StateManager();
    stateManager.setState('service', serviceName, serviceImpl);
    service = new Service(services, stateManager);

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

  it('should stop a service, and not change status', async () => {
    serviceImpl.stop = fake.resolves(null);

    const result = await service.stop(serviceName);

    const serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });

    expect(serviceInDb.status).eq(SERVICE_STATUS.UNKNOWN);
    expect(result.status).eq(SERVICE_STATUS.UNKNOWN);
    assert.calledOnce(serviceImpl.stop);
  });

  it('should fail stoping a service, change status to STOPPED', async () => {
    serviceImpl.stop = fake.rejects(null);

    const result = await service.stop(serviceName, null, true);

    const serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });

    expect(serviceInDb.status).eq(SERVICE_STATUS.STOPPED);
    expect(result.status).eq(SERVICE_STATUS.STOPPED);
    assert.calledOnce(serviceImpl.stop);
  });

  it('should not stop service, and not change status', async () => {
    serviceImpl.stop = fake.resolves(null);

    let serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });
    serviceInDb.update({ status: SERVICE_STATUS.LOADING });

    const result = await service.stop(serviceName);

    serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });

    expect(serviceInDb.status).eq(SERVICE_STATUS.LOADING);
    expect(result.status).eq(SERVICE_STATUS.LOADING);
    assert.calledOnce(serviceImpl.stop);
  });
});
