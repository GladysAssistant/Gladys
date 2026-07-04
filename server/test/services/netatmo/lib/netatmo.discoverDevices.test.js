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

  it('should discover a Security camera device', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(null);
    netatmoHandler.loadDevices = sinon.stub().returns([
      {
        id: '70:ee:50:aa:bb:cc',
        type: 'NACamera',
        name: 'Camera Hall',
        home: '5e1xxxxxxxxxxxxxxxxx',
        monitoring: 'on',
        wifi_strength: 60,
        categoryAPI: 'Security',
      },
    ]);

    const discoveredDevices = await netatmoHandler.discoverDevices();

    expect(discoveredDevices.length).to.equal(1);
    expect(discoveredDevices[0].external_id).to.equal('netatmo:70:ee:50:aa:bb:cc');
    expect(discoveredDevices[0].model).to.equal('NACamera');
    const monitoringFeature = discoveredDevices[0].features.find(
      (feature) => feature.external_id === 'netatmo:70:ee:50:aa:bb:cc:monitoring',
    );
    expect(monitoringFeature).to.not.equal(undefined);
    expect(monitoringFeature.read_only).to.equal(false);
  });

  it('should merge already created devices and flag the updatable ones', async () => {
    netatmoHandler.status = 'connected';
    const buildNetatmoDevice = (id, name) => ({
      id,
      type: 'NACamera',
      name,
      home: 'h1',
      monitoring: 'on',
      categoryAPI: 'Security',
    });
    netatmoHandler.loadDevices = sinon
      .stub()
      .returns([
        buildNetatmoDevice('11:11', 'Cam new'),
        buildNetatmoDevice('22:22', 'Cam unchanged'),
        buildNetatmoDevice('33:33', 'Cam outdated'),
      ]);
    // build the existing devices from the real conversion so the test stays valid
    // when new camera features are added in later PRs
    const buildExistingDevice = (id, name, featureFilter = () => true) => {
      const converted = netatmoHandler.convertDeviceSecurity(buildNetatmoDevice(id, name));
      return {
        ...converted,
        id: `uuid-${id}`,
        name: `Renamed ${id}`,
        room_id: 'room-1',
        created_at: '2026-01-01T00:00:00.000Z',
        features: converted.features
          .filter(featureFilter)
          .map((feature) => ({ ...feature, id: `feature-${feature.external_id}` })),
      };
    };
    const existingUnchanged = buildExistingDevice('22:22', 'Cam unchanged');
    const existingOutdated = buildExistingDevice(
      '33:33',
      'Cam outdated',
      (feature) => feature.external_id === 'netatmo:33:33:wifi_strength',
    );
    netatmoHandler.gladys.stateManager.get = sinon.stub().callsFake((type, externalId) => {
      if (externalId === existingUnchanged.external_id) {
        return existingUnchanged;
      }
      if (externalId === existingOutdated.external_id) {
        return existingOutdated;
      }
      return null;
    });

    const discoveredDevices = await netatmoHandler.discoverDevices();

    expect(discoveredDevices.length).to.equal(3);
    const newDevice = discoveredDevices.find((device) => device.external_id === 'netatmo:11:11');
    expect(newDevice.created_at).to.equal(undefined);
    expect(newDevice.updatable).to.equal(undefined);
    const unchangedDevice = discoveredDevices.find((device) => device.external_id === 'netatmo:22:22');
    expect(unchangedDevice.updatable).to.equal(false);
    expect(unchangedDevice.name).to.equal('Renamed 22:22');
    expect(unchangedDevice.created_at).to.equal('2026-01-01T00:00:00.000Z');
    const outdatedDevice = discoveredDevices.find((device) => device.external_id === 'netatmo:33:33');
    expect(outdatedDevice.updatable).to.equal(true);
    expect(outdatedDevice.name).to.equal('Renamed 33:33');
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

  it('should preserve RECONNECTING status after loadDevices triggered handleApiAuthError (no devices)', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.loadDevices = sinon.stub().callsFake(async () => {
      netatmoHandler.status = 'reconnecting';
      return [];
    });

    const discoveredDevices = await netatmoHandler.discoverDevices();

    expect(discoveredDevices).to.deep.equal([]);
    expect(netatmoHandler.status).to.equal('reconnecting');
  });

  it('should preserve RECONNECTING status after loadDevices triggered handleApiAuthError (devices)', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(null);
    netatmoHandler.loadDevices = sinon.stub().callsFake(async () => {
      netatmoHandler.status = 'reconnecting';
      return devicesMock;
    });

    await netatmoHandler.discoverDevices();

    expect(netatmoHandler.status).to.equal('reconnecting');
  });
});
