/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { BadParameters } = require('../../../../utils/coreErrors');

describe('TuyaHandler.localPoll', () => {
  it('should throw if missing parameters', async () => {
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: function TuyAPIStub() {},
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
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
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
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
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
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
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
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
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
    const connect = sinon.stub().resolves();
    const get = sinon.stub().returns(new Promise(() => {}));
    const disconnect = sinon.stub().resolves();
    function TuyAPIStub() {
      this.connect = connect;
      this.get = get;
      this.disconnect = disconnect;
    }
    const { localPoll } = proxyquire('../../../../services/tuya/lib/tuya.localPoll', {
      tuyapi: TuyAPIStub,
    });
    const promise = localPoll({
      deviceId: 'device',
      ip: '1.1.1.1',
      localKey: 'key',
      protocolVersion: '3.3',
      timeoutMs: 1000,
    });
    await clock.tickAsync(1100);
    try {
      await promise;
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('Local poll timeout');
      clock.restore();
      return;
    }
    clock.restore();
    throw new Error('Expected error');
  });
});
