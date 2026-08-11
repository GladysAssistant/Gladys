const dgram = require('dgram');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { BadParameters, ForbiddenError } = require('../../../utils/coreErrors');
const { buildSupervisor } = require('./testUtils.test');

const externalIntegrationService = {
  manifest: {
    network_wake: true,
  },
};

const bindUdpSocket = (socket) =>
  new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.bind(0, '127.0.0.1', resolve);
  });

const waitForUdpMessage = (socket) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Wake-on-LAN packet not received')), 1000);

    socket.once('message', (message, remoteInfo) => {
      clearTimeout(timeout);
      resolve({
        message,
        remoteInfo,
      });
    });
  });

const getFreeUdpPort = async () => {
  const socket = dgram.createSocket('udp4');

  await bindUdpSocket(socket);

  const { port } = socket.address();

  await new Promise((resolve) => {
    socket.close(resolve);
  });

  return port;
};

describe('externalIntegration.wakeOnLan', () => {
  it('should send a valid Wake-on-LAN magic packet', async () => {
    const { externalIntegration } = buildSupervisor();

    const receiver = dgram.createSocket('udp4');

    await bindUdpSocket(receiver);

    const receivedPromise = waitForUdpMessage(receiver);

    await externalIntegration.wakeOnLan(externalIntegrationService, {
      mac: '64:e4:d5:b4:12:66',
      address: '127.0.0.1',
      port: receiver.address().port,
    });

    const { message } = await receivedPromise;

    await new Promise((resolve) => {
      receiver.close(resolve);
    });

    const expectedMac = Buffer.from([0x64, 0xe4, 0xd5, 0xb4, 0x12, 0x66]);

    // 6 bytes FF + 16 × 6 bytes MAC = 102 bytes
    expect(message).to.have.lengthOf(102);

    expect(message.subarray(0, 6)).to.deep.equal(Buffer.alloc(6, 0xff));

    Array.from({ length: 16 }).forEach((_, index) => {
      const start = 6 + index * 6;

      expect(message.subarray(start, start + 6)).to.deep.equal(expectedMac);
    });
  });

  it('should use the requested UDP source port', async () => {
    const { externalIntegration } = buildSupervisor();

    const receiver = dgram.createSocket('udp4');

    await bindUdpSocket(receiver);

    const sourcePort = await getFreeUdpPort();

    const receivedPromise = waitForUdpMessage(receiver);

    await externalIntegration.wakeOnLan(externalIntegrationService, {
      mac: '64:e4:d5:b4:12:66',
      address: '127.0.0.1',
      port: receiver.address().port,
      sourcePort,
    });

    const { remoteInfo } = await receivedPromise;

    await new Promise((resolve) => {
      receiver.close(resolve);
    });

    expect(remoteInfo.port).to.equal(sourcePort);
  });

  it('should accept different MAC address formats', async () => {
    const { externalIntegration } = buildSupervisor();

    const macAddresses = ['64:e4:d5:b4:12:66', '64-e4-d5-b4-12-66', '64E4D5B41266'];

    await Promise.all(
      macAddresses.map(async (mac) => {
        const receiver = dgram.createSocket('udp4');

        await bindUdpSocket(receiver);

        const receivedPromise = waitForUdpMessage(receiver);

        await externalIntegration.wakeOnLan(externalIntegrationService, {
          mac,
          address: '127.0.0.1',
          port: receiver.address().port,
        });

        const { message } = await receivedPromise;

        await new Promise((resolve) => {
          receiver.close(resolve);
        });

        expect(message).to.have.lengthOf(102);
      }),
    );
  });

  it('should reject an invalid MAC address', async () => {
    const { externalIntegration } = buildSupervisor();

    let error;

    try {
      await externalIntegration.wakeOnLan(externalIntegrationService, {
        mac: 'invalid',
        address: '127.0.0.1',
      });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(BadParameters);
  });

  it('should reject an invalid IPv4 address', async () => {
    const { externalIntegration } = buildSupervisor();

    let error;

    try {
      await externalIntegration.wakeOnLan(externalIntegrationService, {
        mac: '64:e4:d5:b4:12:66',
        address: 'invalid-ip',
      });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(BadParameters);
  });

  it('should reject an invalid destination port', async () => {
    const { externalIntegration } = buildSupervisor();

    const invalidPorts = [0, -1, 65536, 1.5, '9'];

    await Promise.all(
      invalidPorts.map(async (port) => {
        let error;

        try {
          await externalIntegration.wakeOnLan(externalIntegrationService, {
            mac: '64:e4:d5:b4:12:66',
            address: '127.0.0.1',
            port,
          });
        } catch (e) {
          error = e;
        }

        expect(error).to.be.instanceOf(Error);
      }),
    );
  });

  it('should reject an invalid source port', async () => {
    const { externalIntegration } = buildSupervisor();

    const invalidSourcePorts = [-1, 65536, 1.5, '9'];

    await Promise.all(
      invalidSourcePorts.map(async (sourcePort) => {
        let error;

        try {
          await externalIntegration.wakeOnLan(externalIntegrationService, {
            mac: '64:e4:d5:b4:12:66',
            address: '127.0.0.1',
            sourcePort,
          });
        } catch (e) {
          error = e;
        }

        expect(error).to.be.instanceOf(Error);
      }),
    );
  });

  it('should reject an invalid options object', async () => {
    const { externalIntegration } = buildSupervisor();

    const invalidOptions = [undefined, null, [], {}];

    await Promise.all(
      invalidOptions.map(async (options) => {
        let error;

        try {
          await externalIntegration.wakeOnLan(externalIntegrationService, options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.instanceOf(Error);
      }),
    );
  });
  it('should reject Wake-on-LAN when network_wake permission is missing', async () => {
    const { externalIntegration } = buildSupervisor();

    const unauthorizedExternalIntegrationService = {
      manifest: {
        network_wake: false,
      },
    };

    let error;

    try {
      await externalIntegration.wakeOnLan(unauthorizedExternalIntegrationService, {
        mac: '64:e4:d5:b4:12:66',
        address: '127.0.0.1',
      });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(ForbiddenError);
  });
  it('should reject Wake-on-LAN when network_wake permission is not declared', async () => {
    const { externalIntegration } = buildSupervisor();

    const externalIntegrationServiceWithoutNetworkWake = {
      manifest: {},
    };

    let error;

    try {
      await externalIntegration.wakeOnLan(externalIntegrationServiceWithoutNetworkWake, {
        mac: '64:e4:d5:b4:12:66',
        address: '127.0.0.1',
      });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(ForbiddenError);
  });
  it('should reject when socket.send returns an error', async () => {
    const { externalIntegration } = buildSupervisor();

    const expectedError = new Error('send failed');

    const socket = {
      once: sinon.stub(),
      bind: sinon.stub().callsFake((sourcePort, callback) => callback()),
      setBroadcast: sinon.stub(),
      send: sinon.stub().callsFake((payload, port, address, callback) => callback(expectedError)),
      close: sinon.stub().callsFake((callback) => callback()),
    };

    const createSocketStub = sinon.stub(dgram, 'createSocket').returns(socket);

    let error;

    try {
      await externalIntegration.wakeOnLan(externalIntegrationService, {
        mac: '64:e4:d5:b4:12:66',
        address: '127.0.0.1',
      });
    } catch (e) {
      error = e;
    } finally {
      createSocketStub.restore();
    }

    expect(error).to.equal(expectedError);
  });
  it('should reject when setBroadcast throws an error', async () => {
    const { externalIntegration } = buildSupervisor();

    const expectedError = new Error('setBroadcast failed');

    const socket = {
      once: sinon.stub(),
      bind: sinon.stub().callsFake((sourcePort, callback) => callback()),
      setBroadcast: sinon.stub().throws(expectedError),
      send: sinon.stub(),
      close: sinon.stub().callsFake((callback) => callback()),
    };

    const createSocketStub = sinon.stub(dgram, 'createSocket').returns(socket);

    let error;

    try {
      await externalIntegration.wakeOnLan(externalIntegrationService, {
        mac: '64:e4:d5:b4:12:66',
        address: '127.0.0.1',
      });
    } catch (e) {
      error = e;
    } finally {
      createSocketStub.restore();
    }

    expect(error).to.equal(expectedError);
  });

  it('should ignore a socket error after the packet was sent', async () => {
    const { externalIntegration } = buildSupervisor();

    let socketErrorHandler;

    const socket = {
      once: sinon.stub().callsFake((event, callback) => {
        if (event === 'error') {
          socketErrorHandler = callback;
        }
      }),
      bind: sinon.stub().callsFake((sourcePort, callback) => {
        callback();
      }),
      setBroadcast: sinon.stub(),
      send: sinon.stub().callsFake((payload, port, address, callback) => {
        callback();
        socketErrorHandler(new Error('late socket error'));
      }),
      close: sinon.stub().callsFake((callback) => {
        callback();
      }),
    };

    sinon.stub(dgram, 'createSocket').returns(socket);

    await externalIntegration.wakeOnLan(externalIntegrationService, {
      mac: '64:e4:d5:b4:12:66',
      address: '127.0.0.1',
    });

    sinon.restore();
  });

  it('should reject missing or null MAC with BadParameters', async () => {
    const { externalIntegration } = buildSupervisor();
    const invalidOptions = [{}, { mac: null }];

    await Promise.all(
      invalidOptions.map(async (options) => {
        let error;

        try {
          await externalIntegration.wakeOnLan(externalIntegrationService, options);
        } catch (e) {
          error = e;
        }

        expect(error).to.be.instanceOf(BadParameters);
      }),
    );
  });
  it('should ignore the send callback after a socket error', async () => {
    const { externalIntegration } = buildSupervisor();

    const expectedError = new Error('socket error');

    let socketErrorHandler;
    let closeCallback;

    const socket = {
      once: sinon.stub().callsFake((event, callback) => {
        if (event === 'error') {
          socketErrorHandler = callback;
        }
      }),
      bind: sinon.stub().callsFake((sourcePort, callback) => {
        callback();
      }),
      setBroadcast: sinon.stub(),
      send: sinon.stub().callsFake((payload, port, address, callback) => {
        socketErrorHandler(expectedError);
        callback();
        closeCallback();
      }),
      close: sinon.stub().callsFake((callback) => {
        closeCallback = callback;
      }),
    };

    sinon.stub(dgram, 'createSocket').returns(socket);

    let error;

    try {
      await externalIntegration.wakeOnLan(externalIntegrationService, {
        mac: '64:e4:d5:b4:12:66',
        address: '127.0.0.1',
      });
    } catch (e) {
      error = e;
    } finally {
      sinon.restore();
    }

    expect(error).to.equal(expectedError);
  });
});
