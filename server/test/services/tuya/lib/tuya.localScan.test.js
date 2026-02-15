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
          bind: () => {},
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
      'device-id': {
        ip: '1.1.1.1',
        version: '3.3',
        productKey: 'product-key',
      },
    });
  });
});
