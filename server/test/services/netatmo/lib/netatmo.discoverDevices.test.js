const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const EventEmitter = require('events');
const { discoverDevices } = require('../../../../services/netatmo/lib/netatmo.discoverDevices');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const devicesMock = require('../netatmo.loadDevices.mock.test.json');
const { EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

describe('Netatmo Discover devices', () => {
  let eventEmitter;
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.gladys = {
      stateManager: {
        get: sinon.stub().resolves(),
      },
      event: eventEmitter,
    };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should discover devices successfully', async () => {
    NetatmoHandlerMock.status = 'connected';
    NetatmoHandlerMock.gladys.stateManager.get = sinon.stub().returns(null);

    const discoveredDevices = await discoverDevices(NetatmoHandlerMock);

    expect(discoveredDevices.length).to.equal(devicesMock.length);
    expect(discoveredDevices[0].external_id).to.equal(`netatmo:${devicesMock[0].id}`);
    expect(discoveredDevices[1].external_id).to.equal(`netatmo:${devicesMock[1].id}`);
    expect(NetatmoHandlerMock.discoveredDevices).to.deep.equal(discoveredDevices);
    expect(NetatmoHandlerMock.status).to.equal('connected');
    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'discovering' },
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
  });

  it('should throw an error if not connected', async () => {
    try {
      await discoverDevices(NetatmoHandlerMock);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Unable to discover Netatmo devices until service is not well configured');
      expect(NetatmoHandlerMock.status).to.equal('not_initialized');
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'not_initialized' },
        }),
      ).to.equal(true);
    }
  });

  it('should handle an error during device loading', async () => {
    NetatmoHandlerMock.status = 'connected';
    NetatmoHandlerMock.loadDevices = sinon.stub().rejects(new Error('Failed to load'));

    const discoveredDevices = await discoverDevices(NetatmoHandlerMock);

    expect(discoveredDevices).to.deep.equal([]);
    expect(NetatmoHandlerMock.discoveredDevices).to.deep.equal([]);
    expect(NetatmoHandlerMock.status).to.equal('connected');
    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
  });

  it('should handle no devices found', async () => {
    NetatmoHandlerMock.status = 'connected';
    NetatmoHandlerMock.loadDevices = sinon.stub().resolves([]);

    const discoveredDevices = await discoverDevices(NetatmoHandlerMock);

    expect(discoveredDevices).to.deep.equal([]);
    expect(NetatmoHandlerMock.discoveredDevices).to.deep.equal([]);
    expect(NetatmoHandlerMock.status).to.equal('connected');
    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
  });
});
