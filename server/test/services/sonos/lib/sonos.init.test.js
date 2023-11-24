const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const SonosHandler = require('../../../../services/sonos/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {};

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
        // @ts-ignore
        on: (type, cb) => {
          cb({ TransportState: 'PLAYING' });
        },
      },
    },
    Events: {
      removeAllListeners: fake.returns(null),
      // @ts-ignore
      on: (type, cb) => {
        cb(12);
      },
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

describe('SonosHandler.init', () => {
  const sonosHandler = new SonosHandler(gladys, sonosLib, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init sonos & scan network', async () => {
    sonosHandler.onAvTransportEvent = fake.returns(null);
    sonosHandler.onVolumeEvent = fake.returns(null);
    await sonosHandler.init();
    assert.calledOnce(sonosHandler.manager.InitializeWithDiscovery);
    // @ts-ignore
    assert.calledWith(sonosHandler.onAvTransportEvent, 'test-uuid', {
      TransportState: 'PLAYING',
    });
    // @ts-ignore
    assert.calledWith(sonosHandler.onVolumeEvent, 'test-uuid', 12);
    expect(sonosHandler.devices).deep.equal([
      {
        name: 'My sonos',
        external_id: 'sonos:test-uuid',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
        features: [
          {
            name: 'My sonos - Play',
            external_id: 'sonos:test-uuid:play',
            category: 'music',
            type: 'play',
            min: 1,
            max: 1,
            keep_history: false,
            read_only: false,
            has_feedback: false,
          },
          {
            name: 'My sonos - Pause',
            external_id: 'sonos:test-uuid:pause',
            category: 'music',
            type: 'pause',
            min: 1,
            max: 1,
            keep_history: false,
            read_only: false,
            has_feedback: false,
          },
          {
            name: 'My sonos - Previous',
            external_id: 'sonos:test-uuid:previous',
            category: 'music',
            type: 'previous',
            min: 1,
            max: 1,
            keep_history: false,
            read_only: false,
            has_feedback: false,
          },
          {
            name: 'My sonos - Next',
            external_id: 'sonos:test-uuid:next',
            category: 'music',
            type: 'next',
            min: 1,
            max: 1,
            keep_history: false,
            read_only: false,
            has_feedback: false,
          },
          {
            name: 'My sonos - Volume',
            external_id: 'sonos:test-uuid:volume',
            category: 'music',
            type: 'volume',
            min: 0,
            max: 100,
            keep_history: false,
            read_only: false,
            has_feedback: false,
          },
          {
            name: 'My sonos - PlayBack State',
            external_id: 'sonos:test-uuid:playback-state',
            category: 'music',
            type: 'playback_state',
            min: 0,
            max: 1,
            keep_history: false,
            read_only: true,
            has_feedback: false,
          },
        ],
      },
    ]);
  });
});
