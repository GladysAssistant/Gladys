const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const devicesMock = require('../netatmo.loadDevices.mock.test.json');
const devicesExistsMock = require('../netatmo.discoverDevices.mock.test.json');
const { EVENTS } = require('../../../../utils/constants');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  stateManager: {
    get: sinon.stub().resolves(),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo pollRefreshingValuess', () => {
  let clock;

  beforeEach(() => {
    sinon.reset();

    clock = sinon.useFakeTimers();
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should refresh device values directly', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().resolves(devicesMock);
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(devicesExistsMock);

    await netatmoHandler.pollRefreshingValues();

    sinon.assert.calledOnce(netatmoHandler.loadDevices);
    clock.restore();
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'get devices values' },
    });
    expect(netatmoHandler.status).to.equal('connected');
  });

  it('should refresh device values periodically', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().resolves(devicesMock);
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(devicesExistsMock);

    await netatmoHandler.pollRefreshingValues();

    clock.tick(120 * 1000);
    clock.restore();
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 50));
    sinon.assert.calledTwice(netatmoHandler.loadDevices);
  });

  it('should refresh device values periodically without device existing in Gladys', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().resolves(devicesMock);

    await netatmoHandler.pollRefreshingValues();

    clock.restore();
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 50));
    sinon.assert.called(netatmoHandler.loadDevices);
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'get devices values' },
    });
  });

  it('should handle an error during device loading', async () => {
    netatmoHandler.loadDevices = sinon.stub().rejects(new Error('Failed to load devices'));

    await netatmoHandler.pollRefreshingValues();

    clock.restore();
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 50));
    sinon.assert.called(netatmoHandler.loadDevices);
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(4);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'get devices values' },
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.error-connected',
      payload: { status: 'get_devices_value_fail', statusType: 'connected' },
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'get devices values' },
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'connected' },
    });
  });
});
