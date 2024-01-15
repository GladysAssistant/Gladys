const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const devicesMock = require('../netatmo.loadDevices.mock.test.json');
const discoverDevicesMock = require('../netatmo.discoverDevices.mock.test.json');
const { EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
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

describe('Netatmo Discover devices', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should discover devices successfully', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(null);
    netatmoHandler.loadDevices = sinon.stub().returns(devicesMock);

    const discoveredDevices = await netatmoHandler.discoverDevices();

    expect(discoveredDevices.length).to.equal(devicesMock.length);
    expect(discoveredDevices[0].external_id).to.equal(`netatmo:${devicesMock[0].id}`);
    expect(discoveredDevices[1].external_id).to.equal(`netatmo:${devicesMock[1].id}`);
    expect(discoverDevicesMock[0]).to.deep.equal(discoveredDevices[0]);
    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'discovering' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
  });

  it('should throw an error if not connected', async () => {
    try {
      await netatmoHandler.discoverDevices();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Unable to discover Netatmo devices until service is not well configured');
      expect(netatmoHandler.status).to.equal('not_initialized');
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'not_initialized' },
        }),
      ).to.equal(true);
    }
  });

  it('should handle an error during device loading', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().rejects(new Error('Failed to load'));

    const discoveredDevices = await netatmoHandler.discoverDevices();

    expect(discoveredDevices).to.deep.equal([]);
    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
  });

  it('should handle no devices found', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().resolves([]);

    const discoveredDevices = await netatmoHandler.discoverDevices();

    expect(discoveredDevices).to.deep.equal([]);
    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
  });
});
