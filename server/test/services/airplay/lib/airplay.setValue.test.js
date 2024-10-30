const sinon = require('sinon');
const { assert } = require('chai');

const { fake } = sinon;

const AirplayHandler = require('../../../../services/airplay/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {};

class airtunes {
  // eslint-disable-next-line class-methods-use-this
  add(ipAddress, options) {
    return {
      on: (event, cb) => {
        cb('ready');
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  on(event, cb) {
    cb('end');
  }

  // eslint-disable-next-line class-methods-use-this
  stopAll(cb) {
    cb();
  }
}

const pipe = sinon.stub().returns(null);
const childProcessMock = {
  spawn: (command, args, options) => {
    return {
      kill: () => {},
      stdout: {
        on: (type, cb) => {
          cb('log log log');
        },
        pipe,
      },
      stderr: {
        on: (type, cb) => {
          cb('execvp() stderr log log');
        },
        setEncoding: () => {},
      },
    };
  },
};

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

const bonjourLib = {
  find: fake.returns(fakeBrowser),
};

describe('AirplayHandler.setValue', () => {
  const airplayHandler = new AirplayHandler(gladys, airtunes, bonjourLib, childProcessMock, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should talk on speaker', async () => {
    airplayHandler.scanTimeout = 1;
    const devices = await airplayHandler.scan();
    const device = devices[0];
    await airplayHandler.setValue(device, device.features[0], 'http://play-url.com');
    sinon.assert.calledOnce(pipe);
  });
  it('should return device not found', async () => {
    airplayHandler.scanTimeout = 1;
    const device = {
      external_id: 'airplay:toto',
    };
    const promise = airplayHandler.setValue(device, {}, 'http://play-url.com');
    await assert.isRejected(promise, 'Device not found on network');
  });
});
