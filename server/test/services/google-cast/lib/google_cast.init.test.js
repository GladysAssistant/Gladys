const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const GoogleCastHandler = require('../../../../services/google-cast/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {};

const fakeBrowser = {
  stop: fake.returns(null),
  on: (event, cb) => {
    if (event === 'up') {
      cb({
        name: 'nest-mini',
        referer: {
          address: '192.168.1.1',
        },
        port: 8999,
      });
    }
  },
};

const googleCastLib = {};

const bonjourLib = {
  find: fake.returns(fakeBrowser),
};

describe('GoogleCastHandler.init', () => {
  const googleCastHandler = new GoogleCastHandler(gladys, googleCastLib, bonjourLib, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init googleCast & scan network', async () => {
    googleCastHandler.scanTimeout = 1;
    await googleCastHandler.init();
    expect(googleCastHandler.devices).deep.equal([
      {
        name: 'nest-mini',
        external_id: 'google-cast:nest-mini',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
        features: [
          {
            name: 'nest-mini - Play Notification',
            external_id: 'google-cast:nest-mini:play-notification',
            category: 'music',
            type: 'play_notification',
            min: 1,
            max: 1,
            keep_history: false,
            read_only: false,
            has_feedback: false,
          },
        ],
      },
    ]);
  });
});
