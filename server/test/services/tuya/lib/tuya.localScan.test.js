/* eslint-disable require-jsdoc, jsdoc/require-jsdoc, class-methods-use-this */
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('TuyaHandler.localScan', () => {
  it('should return discovered devices from udp payload', async () => {
    const sockets = [];
    const dgramStub = {
      createSocket: () => {
        const handlers = {};
        const socket = {
          on: (event, cb) => {
            handlers[event] = cb;
          },
          bind: (options, cb) => {
            if (typeof options === 'function') {
              options();
              return;
            }
            if (cb) {
              cb();
            }
          },
          close: () => {},
          handlers,
        };
        sockets.push(socket);
        return socket;
      },
    };

    class MessageParserStub {
      parse() {
        return [
          {
            payload: {
              gwId: 'device-id',
              ip: '1.1.1.1',
              version: '3.3',
              productKey: 'product-key',
            },
          },
        ];
      }
    }

    const { localScan } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {
      dgram: dgramStub,
      'tuyapi/lib/message-parser': { MessageParser: MessageParserStub },
      'tuyapi/lib/config': { UDP_KEY: 'key' },
    });

    const clock = sinon.useFakeTimers();
    const promise = localScan(1);

    // Trigger message on all sockets
    sockets.forEach((socket) => {
      if (socket.handlers.message) {
        socket.handlers.message(Buffer.from('test'));
      }
    });

    await clock.tickAsync(1100);
    const result = await promise;
    clock.restore();

    expect(result).to.deep.equal({
      devices: {
        'device-id': {
          ip: '1.1.1.1',
          version: '3.3',
          productKey: 'product-key',
        },
      },
      portErrors: {},
    });
  });

  it('should ignore invalid payloads and handle socket errors', async () => {
    const sockets = [];
    const dgramStub = {
      createSocket: () => {
        const handlers = {};
        const socket = {
          on: (event, cb) => {
            handlers[event] = cb;
          },
          bind: () => {},
          close: () => {
            throw new Error('close error');
          },
          handlers,
        };
        sockets.push(socket);
        return socket;
      },
    };

    let callIndex = 0;
    class MessageParserStub {
      parse() {
        callIndex += 1;
        if (callIndex === 1) {
          throw new Error('bad payload');
        }
        if (callIndex === 2) {
          return [{ payload: 'invalid' }];
        }
        return [{ payload: { ip: '1.1.1.1' } }];
      }
    }

    const { localScan } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {
      dgram: dgramStub,
      'tuyapi/lib/message-parser': { MessageParser: MessageParserStub },
      'tuyapi/lib/config': { UDP_KEY: 'key' },
    });

    const clock = sinon.useFakeTimers();
    const promise = localScan(1);

    sockets.forEach((socket) => {
      if (socket.handlers.message) {
        socket.handlers.message(Buffer.from('test'));
        socket.handlers.message(Buffer.from('test'));
        socket.handlers.message(Buffer.from('test'));
      }
      if (socket.handlers.error) {
        socket.handlers.error(new Error('boom'));
      }
    });

    await clock.tickAsync(1100);
    const result = await promise;
    clock.restore();

    expect(result).to.deep.equal({
      devices: {},
      portErrors: {
        6666: 'boom',
        6667: 'boom',
        7000: 'boom',
      },
    });
  });

  it('should handle socket address errors on bind', async () => {
    const sockets = [];
    const dgramStub = {
      createSocket: () => {
        const handlers = {};
        const socket = {
          on: (event, cb) => {
            handlers[event] = cb;
          },
          bind: (options, cb) => {
            if (typeof options === 'function') {
              options();
              return;
            }
            if (cb) {
              cb();
            }
          },
          close: () => {},
          address: () => {
            throw new Error('address error');
          },
          handlers,
        };
        sockets.push(socket);
        return socket;
      },
    };

    class MessageParserStub {
      parse() {
        return [{ payload: null }];
      }
    }

    const { localScan } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {
      dgram: dgramStub,
      'tuyapi/lib/message-parser': { MessageParser: MessageParserStub },
      'tuyapi/lib/config': { UDP_KEY: 'key' },
    });

    const clock = sinon.useFakeTimers();
    const promise = localScan(1);
    await clock.tickAsync(1100);
    await promise;
    clock.restore();
  });
});
