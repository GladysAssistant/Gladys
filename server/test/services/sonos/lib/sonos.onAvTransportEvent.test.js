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

describe('SonosHandler.onAvTransportEvent', () => {
  const sonosHandler = new SonosHandler(gladys, sonosLib, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should propagate new playing playback state to Gladys', async () => {
    await sonosHandler.init();
    assert.calledOnce(sonosHandler.manager.InitializeWithDiscovery);
    await sonosHandler.onAvTransportEvent('test-uuid', { TransportState: 'PLAYING' });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'sonos:test-uuid:playback-state',
      state: 1,
    });
  });
  it('should propagate new paused playback state to Gladys', async () => {
    await sonosHandler.init();
    assert.calledOnce(sonosHandler.manager.InitializeWithDiscovery);
    await sonosHandler.onAvTransportEvent('test-uuid', {
      TransportState: 'PAUSED_PLAYBACK',
    });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'sonos:test-uuid:playback-state',
      state: 0,
    });
  });
});
