const { expect, assert } = require('chai');

const db = require('../../../models');
const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const { SERVICE_TYPES } = require('../../../utils/constants');

const services = {
  example: () => ({
    start: async () => Promise.resolve(),
  }),
  // a messaging channel is any service exposing message.sendToUser: that is
  // the only interface forwardToChannels relies on
  'test-service': () => ({
    start: async () => Promise.resolve(),
    message: {
      sendToUser: async () => Promise.resolve(),
    },
  }),
  // a core messaging service that is loaded but not configured: it keeps its
  // sendToUser method (start() only threw a ServiceNotConfiguredError, which
  // leaves the service RUNNING), so only isUsed() tells it apart
  'not-configured-service': () => ({
    start: async () => Promise.resolve(),
    isUsed: async () => false,
    message: {
      sendToUser: async () => Promise.resolve(),
    },
  }),
  'configured-service': () => ({
    start: async () => Promise.resolve(),
    isUsed: async () => true,
    message: {
      sendToUser: async () => Promise.resolve(),
    },
  }),
  'broken-service': () => ({
    start: async () => Promise.resolve(),
    isUsed: async () => {
      throw new Error('boom');
    },
    message: {
      sendToUser: async () => Promise.resolve(),
    },
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
    // the global beforeEach reseeds the database before every test, so the
    // has_message_feature flag written by a previous load() is gone: reload
    // here to make this test self-contained
    await service.load(gladys);
    const messageServices = await service.getMessageServices();
    expect(messageServices).to.be.instanceOf(Array);
    // the selector needs the technical name to store in the action, plus the
    // status so a stopped channel can be flagged in the UI
    const messagingService = messageServices.find((s) => s.name === 'test-service');
    expect(messagingService).to.not.equal(undefined);
    expect(messagingService).to.have.property('name', 'test-service');
    expect(messagingService).to.have.property('status');
    // a core service has no manifest: the front translates its technical name
    expect(messagingService).to.have.property('manifest_name', null);
    // `label` would only ever repeat manifest_name or name: the front derives it
    expect(messagingService).to.not.have.property('label');
    // "example" has no message interface: it could not deliver anything
    expect(messageServices.map((s) => s.name)).to.not.include('example');
  });
  it('should not return a core messaging service that is not configured', async () => {
    await service.load(gladys);
    const messageServices = await service.getMessageServices();
    const names = messageServices.map((s) => s.name);
    // the selector must only offer channels the user configured: an unused
    // core service would silently drop the message
    expect(names).to.not.include('not-configured-service');
    expect(names).to.include('configured-service');
    // no isUsed hook: nothing to check the service against, so it is kept
    expect(names).to.include('test-service');
  });
  it('should not return a core messaging service whose isUsed hook fails', async () => {
    await service.load(gladys);
    const messageServices = await service.getMessageServices();
    expect(messageServices.map((s) => s.name)).to.not.include('broken-service');
  });
  it('should return an external messaging integration even when its isUsed hook fails', async () => {
    await service.load(gladys);
    // an installed external integration is configured by definition, and it is
    // proxied: it must never be filtered out on an isUsed() hook, even when a
    // proxy object happens to expose one that throws
    const externalServiceInDb = await db.Service.create({
      name: 'external-message-service',
      selector: 'external-message-service',
      version: '0.1.0',
      has_message_feature: true,
      type: SERVICE_TYPES.EXTERNAL,
      manifest: { name: 'External Messenger' },
    });
    const externalService = {
      isUsed: async () => {
        throw new Error('an external integration exposes no usable isUsed hook');
      },
      message: {
        sendToUser: async () => Promise.resolve(),
      },
    };
    stateManager.setState('service', 'external-message-service', externalService);

    const messageServices = await service.getMessageServices();
    const external = messageServices.find((s) => s.name === 'external-message-service');
    expect(external).to.not.equal(undefined);
    // the front tells a native channel from an external one on `type`, and
    // displays the manifest name of an external integration
    expect(external).to.have.property('type', SERVICE_TYPES.EXTERNAL);
    expect(external).to.have.property('manifest_name', 'External Messenger');
    // a core service carries the other side of that contract
    const coreService = messageServices.find((s) => s.name === 'test-service');
    expect(coreService).to.have.property('type', SERVICE_TYPES.INTERNAL);

    stateManager.setState('service', 'external-message-service', null);
    await externalServiceInDb.destroy();
  });
  it('should not return a messaging service that is not loaded in the stateManager', async () => {
    await service.load(gladys);
    // flagged in database by a previous run, but the service is gone from the
    // instance: it could not deliver anything
    const orphanServiceInDb = await db.Service.create({
      name: 'orphan-message-service',
      selector: 'orphan-message-service',
      version: '0.1.0',
      has_message_feature: true,
    });

    const messageServices = await service.getMessageServices();
    expect(messageServices.map((s) => s.name)).to.not.include('orphan-message-service');

    await orphanServiceInDb.destroy();
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
