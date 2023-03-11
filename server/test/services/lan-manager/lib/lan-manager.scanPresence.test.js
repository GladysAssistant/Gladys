const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake, stub } = sinon;

const scanMock = stub();
const LANManager = proxyquire('../../../../services/lan-manager/lib', {
  './lan-manager.scan': { scan: scanMock },
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

describe('LANManager scanPresence', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, null);
    manager.discoveredDevices = [
      {
        mac: 'AA:BB:CC:DD',
      },
    ];

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

    scanMock.resolves([]);
    await manager.scanPresence();

    assert.calledOnceWithExactly(gladys.device.get, {
      service: 'lan-manager',
      device_feature_category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    });
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

    scanMock.resolves([{ mac: 'aabbccdd' }]);

    await manager.scanPresence();

    assert.calledOnceWithExactly(gladys.device.get, {
      service: 'lan-manager',
      device_feature_category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    });
    assert.calledOnce(gladys.event.emit);
  });
});
