const { expect, assert } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const GoogleCastHandler = require('../../../../services/google-cast/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {};

const fakeBrowser = {
  start: () => {},
  stop: () => {},
  on: (event, cb) => {
    if (event === 'serviceUp') {
      cb({
        name: 'nest-mini',
        addresses: ['192.168.1.1'],
        port: 8999,
      });
    }
  },
};

const googleCastLib = {};

const mdnsLib = {
  createBrowser: fake.returns(fakeBrowser),
  tcp: fake.returns(null),
};

describe('GoogleCastHandler.scan', () => {
  const googleCastHandler = new GoogleCastHandler(gladys, googleCastLib, mdnsLib, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should can network', async () => {
    googleCastHandler.scanTimeout = 1;
    const devices = await googleCastHandler.scan();
    expect(devices).deep.equal([
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
  it('should can network and reject', async () => {
    const fakeBrowserWithError = {
      start: () => {},
      stop: () => {},
      on: (event, cb) => {
        if (event === 'error') {
          cb({});
        }
      },
    };

    const mdnsLibWithError = {
      createBrowser: fake.returns(fakeBrowserWithError),
      tcp: fake.returns(null),
    };
    const googleCastHandlerWithError = new GoogleCastHandler(gladys, googleCastLib, mdnsLibWithError, serviceId);
    googleCastHandlerWithError.scanTimeout = 1;
    const promise = googleCastHandlerWithError.scan();
    await assert.isRejected(promise);
  });
});
