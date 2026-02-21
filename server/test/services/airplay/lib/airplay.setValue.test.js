const sinon = require('sinon');
const { assert } = require('chai');

const { fake } = sinon;

const AirplayHandler = require('../../../../services/airplay/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {};

const sendPcm = sinon.stub().returns(null);
const stopSender = sinon.stub().returns(null);

const airplaySender = (options, callback) => {
  const senderInstance = { sendPcm, stop: stopSender };
  process.nextTick(() => callback({ event: 'device', message: 'ready' }));
  return senderInstance;
};

const childProcessMock = {
  spawn: (command, args, options) => {
    return {
      kill: () => {},
      stdout: {
        on: (type, cb) => {
          if (type === 'data') {
            cb(Buffer.from('audio-chunk'));
          }
        },
      },
      stderr: {
        on: (type, cb) => {
          if (type === 'data') {
            cb('some stderr output');
          }
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
  const airplayHandler = new AirplayHandler(gladys, airplaySender, bonjourLib, childProcessMock, serviceId);

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
    await new Promise((resolve) => setImmediate(resolve));
    sinon.assert.calledOnce(sendPcm);
  });
  it('should talk on speaker with custom volume', async () => {
    airplayHandler.scanTimeout = 1;
    const devices = await airplayHandler.scan();
    const device = devices[0];
    await airplayHandler.setValue(device, device.features[0], 'http://play-url.com', { volume: 30 });
    await new Promise((resolve) => setImmediate(resolve));
    sinon.assert.calledOnce(sendPcm);
  });
  it('should return device not found', async () => {
    airplayHandler.scanTimeout = 1;
    const device = {
      external_id: 'airplay:toto',
    };
    const promise = airplayHandler.setValue(device, {}, 'http://play-url.com', { volume: 30 });
    await assert.isRejected(promise, 'Device not found on network');
  });
});
