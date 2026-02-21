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
          if (type === 'end') {
            cb();
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
      on: () => {},
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

  it('should talk on speaker', async () => {
    airplayHandler.scanTimeout = 1;
    const devices = await airplayHandler.scan();
    const device = devices[0];
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout'] });
    await airplayHandler.setValue(device, device.features[0], 'http://play-url.com');
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    clock.tick(7000);
    sinon.assert.calledOnce(sendPcm);
    sinon.assert.calledOnce(stopSender);
    clock.restore();
  });
  it('should talk on speaker with custom volume', async () => {
    airplayHandler.scanTimeout = 1;
    const devices = await airplayHandler.scan();
    const device = devices[0];
    await airplayHandler.setValue(device, device.features[0], 'http://play-url.com', { volume: 30 });
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    sinon.assert.calledOnce(sendPcm);
  });
  it('should stop sender when ffmpeg fails to start (execvp error)', async () => {
    const childProcessWithExecvpError = {
      spawn: () => ({
        kill: () => {},
        stdout: {
          on: () => {},
        },
        stderr: {
          on: (type, cb) => {
            if (type === 'data') {
              cb('execvp() failed: No such file or directory');
            }
          },
          setEncoding: () => {},
        },
        on: () => {},
      }),
    };

    const airplayHandlerWithExecvpError = new AirplayHandler(
      gladys,
      airplaySender,
      bonjourLib,
      childProcessWithExecvpError,
      serviceId,
    );
    airplayHandlerWithExecvpError.scanTimeout = 1;
    const devices = await airplayHandlerWithExecvpError.scan();
    const device = devices[0];
    await airplayHandlerWithExecvpError.setValue(device, device.features[0], 'http://play-url.com');
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    sinon.assert.calledOnce(stopSender);
    sinon.assert.notCalled(sendPcm);
  });
  it('should kill decode process on buffer end event', async () => {
    const killStub = sinon.stub();

    const childProcessWithKill = {
      spawn: () => ({
        kill: killStub,
        stdout: {
          on: () => {},
        },
        stderr: {
          on: () => {},
          setEncoding: () => {},
        },
        on: () => {},
      }),
    };

    const airplaySenderWithBufferEnd = (options, callback) => {
      const senderInstance = { sendPcm, stop: stopSender };
      process.nextTick(async () => {
        await callback({ event: 'device', message: 'ready' });
        await callback({ event: 'buffer', message: 'end' });
      });
      return senderInstance;
    };

    const airplayHandlerWithBufferEnd = new AirplayHandler(
      gladys,
      airplaySenderWithBufferEnd,
      bonjourLib,
      childProcessWithKill,
      serviceId,
    );
    airplayHandlerWithBufferEnd.scanTimeout = 1;
    const devices = await airplayHandlerWithBufferEnd.scan();
    const device = devices[0];
    await airplayHandlerWithBufferEnd.setValue(device, device.features[0], 'http://play-url.com');
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    sinon.assert.calledOnce(killStub);
  });
  it('should stop sender when ffmpeg process emits an error', async () => {
    const childProcessWithError = {
      spawn: () => ({
        kill: () => {},
        stdout: {
          on: () => {},
        },
        stderr: {
          on: () => {},
          setEncoding: () => {},
        },
        on: (type, cb) => {
          if (type === 'error') {
            cb(new Error('spawn ffmpeg ENOENT'));
          }
        },
      }),
    };

    const airplayHandlerWithError = new AirplayHandler(
      gladys,
      airplaySender,
      bonjourLib,
      childProcessWithError,
      serviceId,
    );
    airplayHandlerWithError.scanTimeout = 1;
    const devices = await airplayHandlerWithError.scan();
    const device = devices[0];
    await airplayHandlerWithError.setValue(device, device.features[0], 'http://play-url.com');
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    sinon.assert.calledOnce(stopSender);
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
