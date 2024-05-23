const sinon = require('sinon');
const { assert } = require('chai');

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

const player = {
  session: {
    playerName: 'Nest mini',
  },
  on: (event, cb) => {
    cb({ playerState: 'paused' });
  },
  load: (param1, param2, cb) => {
    cb(null, { playerState: 'playing' });
  },
};

class GoogleCastClient {
  // eslint-disable-next-line class-methods-use-this
  connect(ipAddress, cb) {
    cb();
  }

  // eslint-disable-next-line class-methods-use-this
  launch(receiver, cb) {
    cb(null, player);
  }

  // eslint-disable-next-line class-methods-use-this
  on(event, cb) {
    cb({ message: 'this is an error' });
  }

  // eslint-disable-next-line class-methods-use-this
  close() {}
}

const googleCastLib = {
  Client: GoogleCastClient,
  DefaultMediaReceiver: null,
};

const mdnsLib = {
  createBrowser: fake.returns(fakeBrowser),
  tcp: fake.returns(null),
};

describe('GoogleCastHandler.setValue', () => {
  const googleCastHandler = new GoogleCastHandler(gladys, googleCastLib, mdnsLib, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should talk on speaker', async () => {
    googleCastHandler.scanTimeout = 1;
    const devices = await googleCastHandler.scan();
    const device = devices[0];
    await googleCastHandler.setValue(device, device.features[0], 'http://play-url.com');
  });
  it('should return device not found', async () => {
    googleCastHandler.scanTimeout = 1;
    const device = {
      external_id: 'google_cast:toto',
    };
    const promise = googleCastHandler.setValue(device, {}, 'http://play-url.com');
    await assert.isRejected(promise, 'Device not found on network');
  });
});
