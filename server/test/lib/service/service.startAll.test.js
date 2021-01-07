const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const db = require('../../../models');
const { SERVICE_STATUS } = require('../../../utils/constants');

const services = {};
const serviceName = 'fake-service';

describe('service.startAll', () => {
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

  it('should start all services success (status === UNKNOWN)', async () => {
    serviceImpl.start = fake.resolves(null);

    await service.startAll();

    const serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });
    expect(serviceInDb.status).eq(SERVICE_STATUS.RUNNING);
    assert.calledOnce(serviceImpl.start);
  });

  it('should start all services error (status === UNKNOWN)', async () => {
    serviceImpl.start = fake.rejects(null);

    await service.startAll();

    const serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });
    expect(serviceInDb.status).eq(SERVICE_STATUS.ERROR);
    assert.calledOnce(serviceImpl.start);
  });

  it('should not start service (as status === STOPPED)', async () => {
    serviceImpl.start = fake.resolves(null);

    const serviceUpdate = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });
    await serviceUpdate.update({ status: SERVICE_STATUS.STOPPED });

    await service.startAll();

    const serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });
    expect(serviceInDb.status).eq(SERVICE_STATUS.STOPPED);
    assert.notCalled(serviceImpl.start);
  });

  it('should not start service (as status === LOADING)', async () => {
    serviceImpl.start = fake.resolves(null);

    const serviceUpdate = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });
    await serviceUpdate.update({ status: SERVICE_STATUS.LOADING });

    await service.startAll();

    const serviceInDb = await db.Service.findOne({
      where: {
        name: serviceName,
      },
    });
    expect(serviceInDb.status).eq(SERVICE_STATUS.RUNNING);
    assert.calledOnce(serviceImpl.start);
  });
});
