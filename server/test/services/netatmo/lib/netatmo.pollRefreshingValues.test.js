const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const devicesMock = JSON.parse(JSON.stringify(require('../netatmo.loadDevices.mock.test.json')));
const devicesExistsMock = JSON.parse(JSON.stringify(require('../netatmo.discoverDevices.mock.test.json')));
const { EVENTS } = require('../../../../utils/constants');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');
const logger = require('../../../../utils/logger');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  stateManager: {
    get: sinon.stub().resolves(),
  },
};
const serviceId = 'serviceId';

describe('Netatmo pollRefreshingValues', () => {
  let clock;
  let netatmoHandler;

  beforeEach(() => {
    sinon.reset();

    clock = sinon.useFakeTimers();
    netatmoHandler = new NetatmoHandler(gladys, serviceId);
    netatmoHandler.status = 'not_initialized';
    netatmoHandler.configured = true;
    netatmoHandler.connected = true;
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should refresh device values periodically', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.refreshNetatmoValues = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(devicesExistsMock);

    netatmoHandler.pollRefreshingValues();

    clock.tick(120 * 1000);
    clock.restore();
    await new Promise((resolve) => setTimeout(resolve, 50));
    sinon.assert.calledOnce(netatmoHandler.refreshNetatmoValues);
  });

  it('should handle an error during device loading', async () => {
    netatmoHandler.refreshNetatmoValues = sinon.stub().rejects(new Error('Failed to load devices'));
    sinon.stub(logger, 'error');

    netatmoHandler.pollRefreshingValues();

    clock.tick(120 * 1000);
    clock.restore();
    await new Promise((resolve) => setTimeout(resolve, 50));
    sinon.assert.called(netatmoHandler.refreshNetatmoValues);
    sinon.assert.calledOnce(logger.error);

    logger.error.restore();
  });

  it('should refresh device values', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().resolves(devicesMock);
    netatmoHandler.updateValues = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(devicesExistsMock);

    netatmoHandler.refreshNetatmoValues();

    clock.restore();
    await new Promise((resolve) => setTimeout(resolve, 50));
    sinon.assert.calledOnce(netatmoHandler.loadDevices);
    sinon.assert.called(netatmoHandler.updateValues);
  });

  it('should refresh device values without device existing in Gladys', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().resolves(devicesMock);

    await netatmoHandler.refreshNetatmoValues();

    clock.restore();
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

    await netatmoHandler.refreshNetatmoValues();

    clock.restore();
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
