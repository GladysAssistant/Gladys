const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { EVENTS } = require('../../../utils/constants');

// Every service built by a test is tracked here so afterEach can stop it: start()
// arms a real 60-second setInterval whenever no fake clock is installed, and a
// timer left behind keeps the Node event loop alive after the suite is done.
const builtServices = [];

const buildService = ({ applySchedulesFails = false } = {}) => {
  const handler = {
    applySchedules: applySchedulesFails ? fake.rejects(new Error('boom')) : fake.resolves(null),
    onDeviceNewState: fake.resolves(null),
    applyTimer: null,
  };
  const controllers = { 'get /api/v1/service/thermostat/device': {} };
  const ThermostatService = proxyquire('../../../services/thermostat/index', {
    './lib': function ThermostatHandlerStub() {
      return handler;
    },
    './api/thermostat.controller': () => controllers,
    '../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });
  const gladys = {
    event: {
      on: fake.returns(null),
      removeListener: fake.returns(null),
    },
  };
  const service = ThermostatService(gladys, 'service-id');
  builtServices.push(service);
  return { service, gladys, handler, controllers };
};

describe('ThermostatService', () => {
  afterEach(async () => {
    // Stop before restoring the sandbox: a fake clock still installed here lets
    // stop() clear its own interval instead of leaving a real one armed.
    await Promise.all(builtServices.splice(0).map((service) => service.stop()));
    sinon.restore();
  });

  it('should expose start, stop, the handler and the controllers', () => {
    const { service, handler, controllers } = buildService();

    expect(service).to.have.property('start');
    expect(service).to.have.property('stop');
    expect(service.device).to.equal(handler);
    expect(service.controllers).to.equal(controllers);
  });

  it('should apply schedules immediately on start', async () => {
    const { service, handler } = buildService();

    await service.start();

    assert.calledOnce(handler.applySchedules);
  });

  it('should listen to device new states', async () => {
    const { service, gladys } = buildService();

    await service.start();

    assert.calledWith(gladys.event.on, EVENTS.DEVICE.NEW_STATE);
  });

  it('should forward a device new state to the handler', async () => {
    const { service, gladys, handler } = buildService();

    await service.start();
    const listener = gladys.event.on.firstCall.args[1];
    const event = { device_feature_external_id: 'window', state: 0 };
    listener(event);

    assert.calledWith(handler.onDeviceNewState, event);
  });

  it('should apply schedules every minute', async () => {
    const clock = sinon.useFakeTimers();
    const { service, handler } = buildService();

    await service.start();
    handler.applySchedules.resetHistory();
    await clock.tickAsync(60 * 1000);

    assert.calledOnce(handler.applySchedules);
  });

  it('should not let a failing startup pass prevent Gladys from starting', async () => {
    const { service, handler } = buildService({ applySchedulesFails: true });

    await service.start();
    // let the detached startup promise settle
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    assert.calledOnce(handler.applySchedules);
  });

  it('should clear the interval, the listener and the pending apply timer on stop', async () => {
    const clock = sinon.useFakeTimers();
    const { service, gladys, handler } = buildService();

    await service.start();
    handler.applyTimer = setTimeout(() => {}, 10000);
    handler.applySchedules.resetHistory();
    await service.stop();
    await clock.tickAsync(60 * 1000);

    assert.calledWith(gladys.event.removeListener, EVENTS.DEVICE.NEW_STATE);
    assert.notCalled(handler.applySchedules);
    expect(handler.applyTimer).to.equal(null);
  });

  it('should be safe to stop a service that was never started', async () => {
    const { service, gladys } = buildService();

    await service.stop();

    assert.notCalled(gladys.event.removeListener);
  });

  it('should not leave two regulation loops behind a second start', async () => {
    const clock = sinon.useFakeTimers();
    const { service, handler } = buildService();

    await service.start();
    await service.start();
    handler.applySchedules.resetHistory();
    await clock.tickAsync(60 * 1000);

    // One interval, not two: a duplicated loop would actuate the heaters twice.
    assert.calledOnce(handler.applySchedules);
  });

  it('should drop the previous listener when started twice', async () => {
    const { service, gladys } = buildService();

    await service.start();
    const firstListener = gladys.event.on.firstCall.args[1];
    await service.start();

    assert.calledWith(gladys.event.removeListener, EVENTS.DEVICE.NEW_STATE, firstListener);
    expect(gladys.event.on.callCount).to.equal(2);
  });

  it('should stop cleanly after a restart', async () => {
    const clock = sinon.useFakeTimers();
    const { service, handler } = buildService();

    await service.start();
    await service.start();
    await service.stop();
    handler.applySchedules.resetHistory();
    await clock.tickAsync(60 * 1000);

    assert.notCalled(handler.applySchedules);
  });
});
