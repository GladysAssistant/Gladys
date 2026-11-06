const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const db = require('../../../models');
const { SERVICE_STATUS, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

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
    expect(service.getStartupState()).to.deep.equal({
      in_progress: false,
      total: 1,
      done: 1,
      current: null,
      waiting: [],
    });
  });

  it('should publish the startup progress of the services', async () => {
    // Three services: past the first one, Promise.map starts them from the end of the list,
    // so the progress must follow the service actually started, not its index
    const externalServices = ['ext-fake-integration-1', 'ext-fake-integration-2'].map((name, index) => ({
      name,
      label: `Fake integration ${index + 1}`,
      impl: { name },
    }));
    const event = { emit: fake.returns(null) };
    service = new Service(services, stateManager, event);
    const stateWhenStarted = {};
    const recordState = (name) =>
      fake(async () => {
        stateWhenStarted[name] = service.getStartupState();
      });
    serviceImpl.start = recordState(serviceName);
    await Promise.all(
      externalServices.map(async ({ name, label, impl }) => {
        impl.start = recordState(name);
        stateManager.setState('service', name, impl);
        await db.Service.create({
          name,
          selector: name,
          version: '1.0.0',
          status: SERVICE_STATUS.RUNNING,
          type: 'external',
          manifest: { name: label },
        });
      }),
    );

    try {
      await service.startAll();
    } finally {
      await db.Service.destroy({ where: { name: externalServices.map(({ name }) => name) } });
    }

    const payloads = event.emit.getCalls().map((call) => {
      expect(call.args[0]).to.equal(EVENTS.WEBSOCKET.SEND_ALL);
      expect(call.args[1].type).to.equal(WEBSOCKET_MESSAGE_TYPES.SYSTEM.SERVICES_STARTUP);
      return call.args[1].payload;
    });
    const allServices = [
      { name: serviceName, label: null },
      ...externalServices.map(({ name, label }) => ({ name, label })),
    ];
    // announced, then one payload per service, then the end
    expect(payloads).to.have.lengthOf(5);
    expect(payloads[0]).to.deep.equal({ in_progress: true, total: 3, done: 0, current: null, waiting: allServices });
    const progress = payloads.slice(1, 4);
    progress.forEach((payload, index) => {
      expect(payload.in_progress).to.equal(true);
      expect(payload.total).to.equal(3);
      expect(payload.done).to.equal(index);
      // the integration announced as starting is the one being started, and is no longer waiting
      expect(stateWhenStarted[payload.current.name]).to.deep.equal(payload);
      expect(payload.waiting).to.have.lengthOf(2 - index);
      expect(payload.waiting.map(({ name }) => name)).to.not.include(payload.current.name);
    });
    expect(progress.map(({ current }) => current)).to.have.deep.members(allServices);
    expect(payloads[4]).to.deep.equal({ in_progress: false, total: 3, done: 3, current: null, waiting: [] });
  });

  it('should end the startup even if starting the services failed', async () => {
    const event = { emit: fake.returns(null) };
    service = new Service(services, stateManager, event);
    service.start = fake.rejects(new Error('database error'));

    let error;
    try {
      await service.startAll();
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(Error);
    assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SYSTEM.SERVICES_STARTUP,
      payload: { in_progress: true, total: 1, done: 0, current: { name: serviceName, label: null }, waiting: [] },
    });
    expect(service.getStartupState()).to.deep.equal({
      in_progress: false,
      total: 1,
      done: 1,
      current: null,
      waiting: [],
    });
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
