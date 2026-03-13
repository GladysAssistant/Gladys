/* eslint-disable require-jsdoc, jsdoc/require-jsdoc, class-methods-use-this */
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { mergeTuyaReport } = require('../../../../services/tuya/lib/utils/tuya.report');

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
      '@demirdeniz/tuyapi-newgen/lib/message-parser': { MessageParser: MessageParserStub },
      '@demirdeniz/tuyapi-newgen/lib/config': { UDP_KEY: 'key' },
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
      '@demirdeniz/tuyapi-newgen/lib/message-parser': { MessageParser: MessageParserStub },
      '@demirdeniz/tuyapi-newgen/lib/config': { UDP_KEY: 'key' },
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

  it('should skip message when all parsers fail', async () => {
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
        throw new Error('invalid packet');
      }
    }

    const { localScan } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {
      dgram: dgramStub,
      '@demirdeniz/tuyapi-newgen/lib/message-parser': { MessageParser: MessageParserStub },
      '@demirdeniz/tuyapi-newgen/lib/config': { UDP_KEY: 'key' },
    });

    const clock = sinon.useFakeTimers();
    const promise = localScan(1);

    sockets.forEach((socket) => {
      if (socket.handlers.message) {
        socket.handlers.message(Buffer.from('bad'));
      }
    });

    await clock.tickAsync(1100);
    const result = await promise;
    clock.restore();

    expect(result).to.deep.equal({
      devices: {},
      portErrors: {},
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
            if (handlers.listening) {
              handlers.listening();
            }
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
      '@demirdeniz/tuyapi-newgen/lib/message-parser': { MessageParser: MessageParserStub },
      '@demirdeniz/tuyapi-newgen/lib/config': { UDP_KEY: 'key' },
    });

    const clock = sinon.useFakeTimers();
    const promise = localScan(1);
    await clock.tickAsync(1100);
    const result = await promise;
    clock.restore();

    expect(result).to.deep.equal({
      devices: {},
      portErrors: {},
    });
  });

  it('should complete local scan when listening address is available', async () => {
    const sockets = [];
    const dgramStub = {
      createSocket: () => {
        const handlers = {};
        const socket = {
          on: (event, cb) => {
            handlers[event] = cb;
          },
          bind: () => {
            if (handlers.listening) {
              handlers.listening();
            }
          },
          close: () => {},
          address: () => ({ address: '0.0.0.0', port: 6666 }),
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
      '@demirdeniz/tuyapi-newgen/lib/message-parser': { MessageParser: MessageParserStub },
      '@demirdeniz/tuyapi-newgen/lib/config': { UDP_KEY: 'key' },
    });

    const clock = sinon.useFakeTimers();
    const promise = localScan(1);
    await clock.tickAsync(1100);
    const result = await promise;
    clock.restore();

    expect(result).to.deep.equal({
      devices: {},
      portErrors: {},
    });
  });
});

describe('TuyaHandler.buildLocalScanResponse', () => {
  it('should return devices and port errors when discovered devices exist', () => {
    const { buildLocalScanResponse } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {});
    const tuyaManager = {
      discoveredDevices: [{ external_id: 'tuya:device1', params: [] }],
    };
    const response = buildLocalScanResponse(tuyaManager, {
      devices: { device1: { ip: '1.1.1.1', version: '3.3', productKey: 'pkey' } },
      portErrors: { 6666: 'boom' },
    });

    expect(response.port_errors).to.deep.equal({ 6666: 'boom' });
    expect(response.local_devices).to.deep.equal({ device1: { ip: '1.1.1.1', version: '3.3', productKey: 'pkey' } });
    expect(response.devices).to.be.an('array');
    expect(response.devices[0].ip).to.equal('1.1.1.1');
    const ipParam = response.devices[0].params.find((param) => param.name === 'IP_ADDRESS');
    expect(ipParam.value).to.equal('1.1.1.1');
    expect(response.devices[0].tuya_report.local.scan).to.deep.equal({
      source: 'udp',
      response: { ip: '1.1.1.1', version: '3.3', productKey: 'pkey' },
    });
  });

  it('should merge devices when gladys stateManager exists', () => {
    const { buildLocalScanResponse } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {});
    const tuyaManager = {
      discoveredDevices: [{ external_id: 'tuya:device1', params: [] }],
      gladys: {
        stateManager: {
          get: sinon.stub().returns({
            external_id: 'tuya:device1',
            params: [{ name: 'LOCAL_OVERRIDE', value: true }],
            features: [],
          }),
        },
      },
    };
    const response = buildLocalScanResponse(tuyaManager, {
      devices: { device1: { ip: '1.1.1.1', version: '3.3' } },
      portErrors: {},
    });

    expect(response.devices[0]).to.have.property('updatable');
    expect(response.devices[0].local_override).to.equal(true);
  });

  it('should return only local devices when no discovered devices array', () => {
    const { buildLocalScanResponse } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {});
    const tuyaManager = { discoveredDevices: null };
    const response = buildLocalScanResponse(tuyaManager, null);

    expect(response).to.deep.equal({ local_devices: {}, port_errors: {} });
  });

  it('should append local-only devices when cloud discovered list is empty', () => {
    const { buildLocalScanResponse } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {
      './device/tuya.convertDevice': {
        convertDevice: sinon.stub().callsFake((device) => ({
          external_id: `tuya:${device.id}`,
          params: [{ name: 'IP_ADDRESS', value: device.ip }],
          tuya_report: mergeTuyaReport(null, device.tuya_report),
        })),
      },
    });
    const tuyaManager = {
      discoveredDevices: [],
      gladys: {
        stateManager: {
          get: sinon.stub().returns(null),
        },
      },
    };

    const response = buildLocalScanResponse(tuyaManager, {
      devices: { device2: { ip: '2.2.2.2', version: '3.3', productKey: 'pkey' } },
      portErrors: {},
    });

    expect(response.devices).to.have.length(1);
    expect(response.devices[0].external_id).to.equal('tuya:device2');
    expect(response.local_devices).to.deep.equal({ device2: { ip: '2.2.2.2', version: '3.3', productKey: 'pkey' } });
    expect(response.devices[0].tuya_report).to.deep.equal({
      schema_version: 2,
      cloud: {
        assembled: {
          specifications: null,
          properties: null,
          thing_model: null,
        },
        raw: {
          device_list_entry: null,
          device_specification: null,
          device_details: null,
          thing_shadow_properties: null,
          thing_model: null,
        },
      },
      local: {
        scan: {
          source: 'udp',
          response: { ip: '2.2.2.2', version: '3.3', productKey: 'pkey' },
        },
      },
    });
  });

  it('should persist local-only devices when discoveredDevices is not an array', () => {
    const { buildLocalScanResponse } = proxyquire('../../../../services/tuya/lib/tuya.localScan', {
      './device/tuya.convertDevice': {
        convertDevice: sinon.stub().callsFake((device) => ({
          external_id: `tuya:${device.id}`,
          params: [{ name: 'IP_ADDRESS', value: device.ip }],
          tuya_report: mergeTuyaReport(null, device.tuya_report),
        })),
      },
    });
    const tuyaManager = {
      discoveredDevices: null,
      gladys: {
        stateManager: {
          get: sinon.stub().returns(null),
        },
      },
    };

    const response = buildLocalScanResponse(tuyaManager, {
      devices: { device2: { ip: '2.2.2.2', version: '3.3', productKey: 'pkey' } },
      portErrors: {},
    });

    expect(response.devices).to.have.length(1);
    expect(tuyaManager.discoveredDevices).to.have.length(1);
    expect(tuyaManager.discoveredDevices[0].external_id).to.equal('tuya:device2');
    expect(tuyaManager.discoveredDevices[0].tuya_report.local.scan).to.deep.equal({
      source: 'udp',
      response: { ip: '2.2.2.2', version: '3.3', productKey: 'pkey' },
    });
  });
});
