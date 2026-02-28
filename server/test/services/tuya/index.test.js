const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { STATUS } = require('../../../services/tuya/lib/utils/tuya.constants');

const { assert, fake } = sinon;

const TuyaHandlerMock = sinon.stub();
TuyaHandlerMock.prototype.init = fake(function init() {
  this.status = STATUS.CONNECTED;
});
TuyaHandlerMock.prototype.loadDevices = fake.returns(null);
TuyaHandlerMock.prototype.disconnect = fake.returns(null);

const TuyaService = proxyquire('../../../services/tuya/index', { './lib': TuyaHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaService', () => {
  let tuyaService;
  let intervalCallback;
  let setIntervalStub;
  let clearIntervalStub;

  beforeEach(() => {
    sinon.resetHistory();
    intervalCallback = null;
    setIntervalStub = sinon.stub(global, 'setInterval').callsFake((cb) => {
      intervalCallback = cb;
      return 123;
    });
    clearIntervalStub = sinon.stub(global, 'clearInterval');
    tuyaService = TuyaService(gladys, serviceId);
  });

  afterEach(() => {
    setIntervalStub.restore();
    clearIntervalStub.restore();
    sinon.resetHistory();
  });

  it('should start service', async () => {
    await tuyaService.start();
    assert.calledOnce(tuyaService.device.init);
    assert.calledOnce(tuyaService.device.loadDevices);
    assert.notCalled(tuyaService.device.disconnect);
  });

  it('should stop service', async () => {
    await tuyaService.start();
    await tuyaService.stop();
    assert.calledOnce(tuyaService.device.disconnect);
    assert.calledOnce(clearIntervalStub);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await tuyaService.isUsed();
    expect(used).to.equal(false);
  });

  it('isUsed: should return true, service is used', async () => {
    tuyaService.device.status = STATUS.CONNECTED;
    tuyaService.device.connector = {};
    const used = await tuyaService.isUsed();
    expect(used).to.equal(true);
  });

  it('should attempt auto-reconnect when disconnected', async () => {
    tuyaService.device.getStatus = fake.resolves({ configured: true, manual_disconnect: false });
    tuyaService.device.getConfiguration = fake.resolves({ config: 'ok' });
    tuyaService.device.connect = fake.resolves();

    await tuyaService.start();
    tuyaService.device.status = STATUS.ERROR;
    tuyaService.device.autoReconnectAllowed = true;

    await intervalCallback();

    assert.calledOnce(tuyaService.device.getStatus);
    assert.calledOnce(tuyaService.device.getConfiguration);
    assert.calledOnce(tuyaService.device.connect);
  });

  it('should not auto-reconnect when not configured or manually disconnected', async () => {
    tuyaService.device.getStatus = fake.resolves({ configured: false, manual_disconnect: true });
    tuyaService.device.getConfiguration = fake.resolves({ config: 'ok' });
    tuyaService.device.connect = fake.resolves();

    await tuyaService.start();
    tuyaService.device.status = STATUS.ERROR;
    tuyaService.device.autoReconnectAllowed = true;

    await intervalCallback();

    assert.calledOnce(tuyaService.device.getStatus);
    assert.notCalled(tuyaService.device.getConfiguration);
    assert.notCalled(tuyaService.device.connect);
  });

  it('should not auto-reconnect when autoReconnectAllowed is false', async () => {
    tuyaService.device.getStatus = fake.resolves({ configured: true, manual_disconnect: false });
    tuyaService.device.getConfiguration = fake.resolves({ config: 'ok' });
    tuyaService.device.connect = fake.resolves();

    await tuyaService.start();
    tuyaService.device.status = STATUS.ERROR;
    tuyaService.device.autoReconnectAllowed = false;

    await intervalCallback();

    assert.notCalled(tuyaService.device.getStatus);
    assert.notCalled(tuyaService.device.getConfiguration);
    assert.notCalled(tuyaService.device.connect);
  });

  it('should not auto-reconnect when already connecting', async () => {
    tuyaService.device.getStatus = fake.resolves({ configured: true, manual_disconnect: false });
    tuyaService.device.getConfiguration = fake.resolves({ config: 'ok' });
    tuyaService.device.connect = fake.resolves();

    await tuyaService.start();
    tuyaService.device.status = STATUS.CONNECTING;
    tuyaService.device.autoReconnectAllowed = true;

    await intervalCallback();

    assert.calledOnce(tuyaService.device.getStatus);
    assert.notCalled(tuyaService.device.getConfiguration);
    assert.notCalled(tuyaService.device.connect);
  });

  it('should schedule quick reconnects on start when disconnected and allowed', async () => {
    tuyaService.device.init = fake(function init() {
      this.status = STATUS.ERROR;
      this.autoReconnectAllowed = true;
    });
    tuyaService.device.getStatus = fake.resolves({ configured: false, manual_disconnect: false });

    await tuyaService.start();

    assert.calledOnce(tuyaService.device.getStatus);
    assert.notCalled(tuyaService.device.loadDevices);
  });

  it('should skip quick reconnect when already in progress', async () => {
    let resolveStatus;
    const pendingStatus = new Promise((resolve) => {
      resolveStatus = resolve;
    });

    tuyaService.device.getStatus = fake.returns(pendingStatus);
    tuyaService.device.getConfiguration = fake.resolves({ config: 'ok' });
    tuyaService.device.connect = fake.resolves();

    await tuyaService.start();
    tuyaService.device.status = STATUS.ERROR;
    tuyaService.device.autoReconnectAllowed = true;

    const firstCall = intervalCallback();
    await intervalCallback();

    assert.calledOnce(tuyaService.device.getStatus);

    resolveStatus({ configured: false, manual_disconnect: false });
    await firstCall;
  });

  it('should clear pending quick reconnect timeouts', async () => {
    const setTimeoutStub = sinon.stub(global, 'setTimeout').callsFake(() => 456);
    const clearTimeoutStub = sinon.stub(global, 'clearTimeout');

    try {
      tuyaService.device.init = fake(function init() {
        this.status = STATUS.CONNECTED;
        this.autoReconnectAllowed = true;
      });
      tuyaService.device.getStatus = fake.resolves({ configured: true, manual_disconnect: false });
      tuyaService.device.getConfiguration = fake.resolves({ config: 'ok' });
      tuyaService.device.connect = fake.resolves();

      await tuyaService.start();
      tuyaService.device.status = STATUS.ERROR;
      tuyaService.device.autoReconnectAllowed = true;

      await intervalCallback();
      await tuyaService.stop();

      assert.calledOnce(setTimeoutStub);
      assert.calledWith(clearTimeoutStub, 456);
    } finally {
      setTimeoutStub.restore();
      clearTimeoutStub.restore();
    }
  });

  it('should handle auto-reconnect errors', async () => {
    tuyaService.device.getStatus = fake.rejects(new Error('status failure'));
    tuyaService.device.getConfiguration = fake.resolves({ config: 'ok' });
    tuyaService.device.connect = fake.resolves();

    await tuyaService.start();
    tuyaService.device.status = STATUS.ERROR;
    tuyaService.device.autoReconnectAllowed = true;

    await intervalCallback();

    assert.calledOnce(tuyaService.device.getStatus);
    assert.notCalled(tuyaService.device.getConfiguration);
    assert.notCalled(tuyaService.device.connect);
  });
});
