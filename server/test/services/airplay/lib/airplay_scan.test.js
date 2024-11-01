const { expect, assert } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const AirplayHandler = require('../../../../services/airplay/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {};

const fakeBrowser = {
  stop: fake.returns(null),
  on: (event, cb) => {
    if (event === 'up') {
      cb({
        name: 'homepod-mini',
        referer: {
          address: '192.168.1.1',
        },
        port: 8999,
      });
    }
  },
};

const airtunes = {};
const childProcessLib = {};

const bonjourLib = {
  find: fake.returns(fakeBrowser),
};

describe('AirplayHandler.scan', () => {
  const airplayHandler = new AirplayHandler(gladys, airtunes, bonjourLib, childProcessLib, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should scan network', async () => {
    airplayHandler.scanTimeout = 1;
    const devices = await airplayHandler.scan();
    expect(devices).deep.equal([
      {
        name: 'homepod-mini',
        external_id: 'airplay:homepod-mini',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
        features: [
          {
            name: 'homepod-mini - Play Notification',
            external_id: 'airplay:homepod-mini:play-notification',
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
  it('should scan network and reject', async () => {
    const fakeBrowserWithError = {
      stop: fake.returns(null),
      on: (event, cb) => {
        if (event === 'error') {
          cb({});
        }
      },
    };

    const bonjourLibWithError = {
      find: fake.returns(fakeBrowserWithError),
    };
    const airplayHandlerWithError = new AirplayHandler(
      gladys,
      airtunes,
      bonjourLibWithError,
      childProcessLib,
      serviceId,
    );
    airplayHandlerWithError.scanTimeout = 1;
    const promise = airplayHandlerWithError.scan();
    await assert.isRejected(promise);
  });
});
