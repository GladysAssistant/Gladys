const sinon = require('sinon');

const { assert, fake } = sinon;

const SonosHandler = require('../../../../services/sonos/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

const SonosManager = sinon.stub();
SonosManager.prototype.InitializeWithDiscovery = fake.returns(null);
SonosManager.prototype.Devices = [
  {
    this_attribute_should_not_exist: 'test',
    host: '192.168.1.1',
    port: 1400,
    name: 'My sonos',
    uuid: 'test-uuid',
    AVTransportService: {
      Events: {
        removeAllListeners: fake.returns(null),
        on: fake.returns(null),
      },
    },
    Events: {
      removeAllListeners: fake.returns(null),
      on: fake.returns(null),
    },
  },
];

const sonosLib = {
  SonosManager,
  ServiceEvents: {
    ServiceEvent: 'test',
  },
  SonosEvents: {
    Volume: 'test',
  },
};

describe('SonosHandler.onVolumeEvent', () => {
  const sonosHandler = new SonosHandler(gladys, sonosLib, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should propagate new volume state to Gladys', async () => {
    await sonosHandler.init();
    assert.calledOnce(sonosHandler.manager.InitializeWithDiscovery);
    await sonosHandler.onVolumeEvent('test-uuid', 10);
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'sonos:test-uuid:volume',
      state: 10,
    });
  });
});
