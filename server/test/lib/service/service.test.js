const { expect, assert } = require('chai');

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');

const services = {
  example: () => ({
    start: async () => Promise.resolve(),
  }),
};

const gladys = {
  version: '0.1.0',
};

describe('service', () => {
  const stateManager = new StateManager();
  const service = new Service(services, stateManager);
  it('should start a service', async () => {
    await service.load(gladys);
    await service.start('example');
  });
  it('should return the example service', async () => {
    expect(service.getService('example')).to.be.instanceOf(Object).and.to.be.not.null; // eslint-disable-line
  });
  it('should return null a service', async () => {
    expect(service.getService('DONOTEXIST')).to.be.null; // eslint-disable-line
  });
  it('should return service with message capabilities', async () => {
    const messageServices = await service.getMessageServices();
    expect(messageServices).to.be.instanceOf(Array);
  });
  it('should return service by name', async () => {
    const testService = await service.getByName('test-service');
    expect(testService).to.have.property('name', 'test-service');
  });
  it('should throw service not found', async () => {
    const promise = service.getByName('not-found');
    return assert.isRejected(promise, 'SERVICE_NOT_FOUND');
  });
});
