/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { BadParameters } = require('../../../../utils/coreErrors');
const { DEVICE_PARAM_NAME } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { updateDiscoveredDeviceAfterLocalPoll } = require('../../../../services/tuya/lib/tuya.localPoll');

const attachEventHandlers = (instance) => {
  instance.on = sinon.stub();
  instance.once = sinon.stub();
  instance.removeListener = sinon.stub();
};

describe('TuyaHandler.localPoll', () => {
  it('should throw if missing parameters', async () => {
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: function TuyAPIStub() {},
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });
    try {
      await localPoll({});
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('Missing local connection parameters');
      return;
    }
    throw new Error('Expected error');
  });

  it('should return dps on success', async () => {
    const connect = sinon.stub().resolves();
    const get = sinon.stub().resolves({ dps: { 1: true } });
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
      attachEventHandlers(this);
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });
    const result = await localPoll({
      deviceId: 'device',
      ip: '1.1.1.1',
      localKey: 'key',
      protocolVersion: '3.3',
    });
    expect(result).to.deep.equal({ dps: { 1: true } });
    expect(connect.calledOnce).to.equal(true);
    expect(get.calledOnce).to.equal(true);
    expect(disconnect.calledOnce).to.equal(true);
  });

  it('should throw on invalid response', async () => {
    const connect = sinon.stub().resolves();
    const get = sinon.stub().resolves('parse data error');
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
      attachEventHandlers(this);
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });
    try {
      await localPoll({
        deviceId: 'device',
        ip: '1.1.1.1',
        localKey: 'key',
        protocolVersion: '3.3',
      });
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('Invalid local poll response');
      return;
    }
    throw new Error('Expected error');
  });

  it('should try multiple attempts for protocol 3.5', async () => {
    const connect = sinon.stub().resolves();
    const get = sinon
      .stub()
      .onFirstCall()
      .rejects(new Error('fail'))
      .onSecondCall()
      .resolves({ dps: { 1: true } });
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      throw new Error('tuyapi should not be used for protocol 3.5');
    }
    function TuyAPINewGenStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
      attachEventHandlers(this);
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': TuyAPINewGenStub,
    });
    const result = await localPoll({
      deviceId: 'device',
      ip: '1.1.1.1',
      localKey: 'key',
      protocolVersion: '3.5',
      timeoutMs: 1000,
    });
    expect(result).to.deep.equal({ dps: { 1: true } });
    expect(get.calledTwice).to.equal(true);
  });

  it('should throw on object without dps', async () => {
    const connect = sinon.stub().resolves();
    const get = sinon.stub().resolves({ ok: true });
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
      attachEventHandlers(this);
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });
    try {
      await localPoll({
        deviceId: 'device',
        ip: '1.1.1.1',
        localKey: 'key',
        protocolVersion: '3.3',
      });
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('Invalid local poll response');
      return;
    }
    throw new Error('Expected error');
  });

  it('should timeout', async () => {
    const clock = sinon.useFakeTimers();
    try {
      const connect = sinon.stub().resolves();
      const get = sinon.stub().returns(new Promise(() => {}));
      const disconnect = sinon.stub().resolves();
      const TuyAPIStub = function TuyAPIStub() {
        this.connect = connect;
        this.get = get;
        this.disconnect = disconnect;
        attachEventHandlers(this);
      };
      const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
        tuyapi: TuyAPIStub,
        '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
      });
      const promise = localPoll({
        deviceId: 'device',
        ip: '1.1.1.1',
        localKey: 'key',
        protocolVersion: '3.3',
        timeoutMs: 1000,
      });
      // Attach handler immediately to avoid PromiseRejectionHandledWarning with fake timers.
      const errorPromise = (async () => {
        try {
          await promise;
          return null;
        } catch (error) {
          return error;
        }
      })();
      await clock.tickAsync(1100);
      const error = await errorPromise;
      expect(error).to.be.instanceOf(BadParameters);
      expect(error.message).to.equal('Local poll timeout');
    } finally {
      clock.restore();
    }
  });

  it('should sanitize too-low timeoutMs before timing out', async () => {
    const clock = sinon.useFakeTimers();
    try {
      const connect = sinon.stub().resolves();
      const get = sinon.stub().returns(new Promise(() => {}));
      const disconnect = sinon.stub().resolves();
      const TuyAPIStub = function TuyAPIStub() {
        this.connect = connect;
        this.get = get;
        this.disconnect = disconnect;
        attachEventHandlers(this);
      };
      const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
        tuyapi: TuyAPIStub,
        '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
      });
      const promise = localPoll({
        deviceId: 'device',
        ip: '1.1.1.1',
        localKey: 'key',
        protocolVersion: '3.3',
        timeoutMs: 10,
      });
      const errorPromise = (async () => {
        try {
          await promise;
          return null;
        } catch (error) {
          return error;
        }
      })();
      await clock.tickAsync(400);
      expect(await Promise.race([errorPromise, Promise.resolve('pending')])).to.equal('pending');
      await clock.tickAsync(100);
      const error = await errorPromise;
      expect(error).to.be.instanceOf(BadParameters);
      expect(error.message).to.equal('Local poll timeout');
    } finally {
      clock.restore();
    }
  });

  it('should reject on socket error listener', async () => {
    const connect = sinon.stub().resolves();
    const get = sinon.stub().returns(new Promise(() => {}));
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
      this.on = sinon.stub();
      this.once = sinon.stub().callsFake((event, cb) => {
        if (event === 'error') {
          cb(new Error('boom'));
        }
      });
      this.removeListener = sinon.stub();
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

    try {
      await localPoll({
        deviceId: 'device',
        ip: '1.1.1.1',
        localKey: 'key',
        protocolVersion: '3.3',
      });
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('Local poll socket error');
      return;
    }
    throw new Error('Expected error');
  });

  it('should log last socket error when different from thrown error', async () => {
    const connect = sinon.stub().rejects(new Error('connect failed'));
    const get = sinon.stub();
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
      this.once = sinon.stub();
      this.removeListener = sinon.stub();
      this.on = sinon.stub().callsFake((event, cb) => {
        if (event === 'error') {
          cb(new Error('socket boom'));
        }
      });
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

    try {
      await localPoll({
        deviceId: 'device',
        ip: '1.1.1.1',
        localKey: 'key',
        protocolVersion: '3.3',
      });
    } catch (e) {
      expect(e.message).to.equal('connect failed');
      return;
    }
    throw new Error('Expected error');
  });

  it('should stop cleanup when already resolved', async () => {
    const connect = sinon.stub().resolves();
    const get = sinon.stub().resolves({ dps: { 1: true } });
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
      this.on = sinon.stub();
      this.once = sinon.stub();
      this.removeListener = sinon.stub().throws(new Error('removeListener error'));
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
      '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
    });

    try {
      await localPoll({
        deviceId: 'device',
        ip: '1.1.1.1',
        localKey: 'key',
        protocolVersion: '3.3',
      });
    } catch (e) {
      expect(e.message).to.equal('removeListener error');
      return;
    }
    throw new Error('Expected error');
  });
});

describe('TuyaHandler.updateDiscoveredDeviceAfterLocalPoll', () => {
  it('should return null when payload is missing deviceId', () => {
    const result = updateDiscoveredDeviceAfterLocalPoll({ discoveredDevices: [] }, {});
    expect(result).to.equal(null);
  });

  it('should return null when discovered devices is not an array', () => {
    const result = updateDiscoveredDeviceAfterLocalPoll({ discoveredDevices: null }, { deviceId: 'device' });
    expect(result).to.equal(null);
  });

  it('should return null when device is not found', () => {
    const tuyaManager = { discoveredDevices: [{ external_id: 'tuya:other' }] };
    const result = updateDiscoveredDeviceAfterLocalPoll(tuyaManager, { deviceId: 'device' });
    expect(result).to.equal(null);
  });

  it('should update discovered device with local poll data', () => {
    const tuyaManager = {
      discoveredDevices: [
        {
          external_id: 'tuya:device1',
          params: [],
          product_id: 'pid',
          product_key: 'pkey',
        },
      ],
    };

    const updated = updateDiscoveredDeviceAfterLocalPoll(tuyaManager, {
      deviceId: 'device1',
      ip: '1.1.1.1',
      protocolVersion: '3.3',
      localKey: 'key',
    });

    expect(updated.local_override).to.equal(true);
    expect(updated.ip).to.equal('1.1.1.1');
    const { params } = updated;
    const findParam = (name) => params.find((param) => param.name === name);
    expect(findParam(DEVICE_PARAM_NAME.IP_ADDRESS).value).to.equal('1.1.1.1');
    expect(findParam(DEVICE_PARAM_NAME.PROTOCOL_VERSION).value).to.equal('3.3');
    expect(findParam(DEVICE_PARAM_NAME.LOCAL_KEY).value).to.equal('key');
    expect(findParam(DEVICE_PARAM_NAME.LOCAL_OVERRIDE).value).to.equal(true);
    expect(findParam(DEVICE_PARAM_NAME.PRODUCT_ID).value).to.equal('pid');
    expect(findParam(DEVICE_PARAM_NAME.PRODUCT_KEY).value).to.equal('pkey');
  });

  it('should merge when gladys stateManager exists', () => {
    const tuyaManager = {
      discoveredDevices: [
        {
          external_id: 'tuya:device1',
          params: [],
          features: [],
        },
      ],
      gladys: {
        stateManager: {
          get: sinon.stub().returns({
            external_id: 'tuya:device1',
            params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: '1' }],
            features: [],
          }),
        },
      },
    };

    const updated = updateDiscoveredDeviceAfterLocalPoll(tuyaManager, {
      deviceId: 'device1',
      ip: '1.1.1.1',
      protocolVersion: '3.3',
    });

    expect(updated).to.have.property('updatable');
    expect(updated.local_override).to.equal(true);
  });
});
