const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const db = require('../../../models');

const services = {};
const serviceName = 'fake-service';

describe('service.getUsage', () => {
  let serviceImpl;
  let stateManager;
  let service;

  beforeEach(async () => {
    serviceImpl = {
      selector: serviceName,
      name: serviceName,
      version: '0.1.0',
    };

    stateManager = new StateManager();
    stateManager.setState('service', serviceName, serviceImpl);
    service = new Service(services, stateManager);

    await db.Service.create(serviceImpl);
  });

  afterEach(async () => {
    sinon.reset();
  });

  it('should return that service is not used', async () => {
    serviceImpl.isUsed = fake.resolves(false);

    const result = await service.getUsage();

    expect(result).to.deep.equal({
      'fake-service': false,
    });
    assert.calledOnce(serviceImpl.isUsed);
  });

  it('should return that service is used', async () => {
    serviceImpl.isUsed = fake.resolves(true);

    const result = await service.getUsage();

    expect(result).to.deep.equal({
      'fake-service': true,
    });
    assert.calledOnce(serviceImpl.isUsed);
  });
  it('should return empty, service has not a isUsed function', async () => {
    const result = await service.getUsage();

    expect(result).to.deep.equal({});
  });
  it('should return empty, service isUsed is crashing', async () => {
    serviceImpl.isUsed = fake.rejects('ERROR');

    const result = await service.getUsage();

    expect(result).to.deep.equal({});
    assert.calledOnce(serviceImpl.isUsed);
  });
});
