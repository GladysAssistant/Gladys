const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const discoveredDevices = [
  {
    mac: 'AA:BB:CC:DD',
  },
];
const lanManagerScanMock = fake.resolves(discoveredDevices);
const LANManager = proxyquire('../../../../services/lan-manager/lib', {
  './lan-manager.scan.js': { scan: lanManagerScanMock },
});
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  device: {
    get: fake.resolves([]),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';
const lanDiscovery = {};

describe('LANManager scanPresence', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, lanDiscovery);

    gladys.event = {
      emit: fake.returns(true),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('scanPresence no stored devices', async () => {
    await manager.scanPresence();

    assert.calledOnce(gladys.device.get);
    assert.notCalled(lanManagerScanMock);
    assert.notCalled(gladys.event.emit);
  });

  it('scanPresence no presence devices', async () => {
    gladys.device.get = fake.resolves([
      {
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.BATTERY,
          },
        ],
      },
    ]);

    await manager.scanPresence();

    assert.calledOnceWithExactly(gladys.device.get, {
      service: 'lan-manager',
      device_feature_category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    });
    assert.notCalled(lanManagerScanMock);
    assert.notCalled(gladys.event.emit);
  });

  it('scanPresence presence device not discovered', async () => {
    gladys.device.get = fake.resolves([
      {
        features: [
          {
            external_id: 'lan-manager:unknown-uuid',
            category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
          },
        ],
      },
    ]);

    await manager.scanPresence();

    assert.calledOnceWithExactly(gladys.device.get, {
      service: 'lan-manager',
      device_feature_category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    });
    assert.calledOnceWithExactly(lanManagerScanMock);
    assert.notCalled(gladys.event.emit);
  });

  it('manager.scanPresence matching presence device', async () => {
    gladys.device.get = fake.resolves([
      {
        features: [
          {
            external_id: 'lan-manager:aabbccdd',
            category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
          },
        ],
      },
    ]);

    await manager.scanPresence();

    assert.calledOnceWithExactly(gladys.device.get, {
      service: 'lan-manager',
      device_feature_category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    });
    assert.calledOnceWithExactly(lanManagerScanMock);
    assert.calledOnce(gladys.event.emit);
  });
});
