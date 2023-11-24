const sinon = require('sinon');

const { assert, fake } = sinon;

const SonosHandler = require('../../../../services/sonos/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {};

const devicePlay = fake.resolves(null);
const devicePause = fake.resolves(null);
const devicePrevious = fake.resolves(null);
const deviceNext = fake.resolves(null);
const deviceSetVolume = fake.resolves(null);

const SonosManager = sinon.stub();
SonosManager.prototype.InitializeWithDiscovery = fake.returns(null);
SonosManager.prototype.Devices = [
  {
    this_attribute_should_not_exist: 'test',
    host: '192.168.1.1',
    port: 1400,
    name: 'My sonos',
    uuid: 'test-uuid',
    Play: devicePlay,
    Pause: devicePause,
    Previous: devicePrevious,
    Next: deviceNext,
    SetVolume: deviceSetVolume,
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

describe('SonosHandler.setValue', () => {
  const sonosHandler = new SonosHandler(gladys, sonosLib, serviceId);

  beforeEach(async () => {
    sinon.reset();
    await sonosHandler.init();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should press play on Sonos', async () => {
    const device = {
      name: 'My sonos',
      external_id: 'sonos:test-uuid',
      service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      should_poll: false,
    };
    const deviceFeature = {
      name: 'My sonos - Play',
      external_id: 'sonos:test-uuid:play',
      category: 'music',
      type: 'play',
      min: 1,
      max: 1,
      keep_history: false,
      read_only: false,
      has_feedback: false,
    };
    await sonosHandler.setValue(device, deviceFeature, 1);
    assert.calledOnce(devicePlay);
  });
  it('should press pause on Sonos', async () => {
    const device = {
      name: 'My sonos',
      external_id: 'sonos:test-uuid',
      service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      should_poll: false,
    };
    const deviceFeature = {
      name: 'My sonos - Pause',
      external_id: 'sonos:test-uuid:pause',
      category: 'music',
      type: 'pause',
      min: 1,
      max: 1,
      keep_history: false,
      read_only: false,
      has_feedback: false,
    };
    await sonosHandler.setValue(device, deviceFeature, 1);
    assert.calledOnce(devicePause);
  });
  it('should press next on Sonos', async () => {
    const device = {
      name: 'My sonos',
      external_id: 'sonos:test-uuid',
      service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      should_poll: false,
    };
    const deviceFeature = {
      name: 'My sonos - Next',
      external_id: 'sonos:test-uuid:next',
      category: 'music',
      type: 'next',
      min: 1,
      max: 1,
      keep_history: false,
      read_only: false,
      has_feedback: false,
    };
    await sonosHandler.setValue(device, deviceFeature, 1);
    assert.calledOnce(deviceNext);
  });
  it('should press previous on Sonos', async () => {
    const device = {
      name: 'My sonos',
      external_id: 'sonos:test-uuid',
      service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      should_poll: false,
    };
    const deviceFeature = {
      name: 'My sonos - Previous',
      external_id: 'sonos:test-uuid:previous',
      category: 'music',
      type: 'previous',
      min: 1,
      max: 1,
      keep_history: false,
      read_only: false,
      has_feedback: false,
    };
    await sonosHandler.setValue(device, deviceFeature, 1);
    assert.calledOnce(devicePrevious);
  });
  it('should setVolume on Sonos', async () => {
    const device = {
      name: 'My sonos',
      external_id: 'sonos:test-uuid',
      service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      should_poll: false,
    };
    const deviceFeature = {
      name: 'My sonos - Volume',
      external_id: 'sonos:test-uuid:volume',
      category: 'music',
      type: 'volume',
      min: 0,
      max: 100,
      keep_history: false,
      read_only: false,
      has_feedback: false,
    };
    await sonosHandler.setValue(device, deviceFeature, 46);
    assert.calledWith(deviceSetVolume, 46);
  });
});
