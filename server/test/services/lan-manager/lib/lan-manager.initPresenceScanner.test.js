const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const scanMock = fake.returns(null);
const LANManager = proxyquire('../../../../services/lan-manager/lib', {
  './lan-manager.scanPresence': { scanPresence: scanMock },
});

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('LANManager initPresenceScanner', () => {
  let manager;
  let clock;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, null);
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('stop scanner', () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    manager.presenceScanner = {
      status: 'disabled',
      timer,
    };

    manager.initPresenceScanner();

    expect(manager.presenceScanner.timer).eq(undefined);
    assert.notCalled(scanMock);
    assert.calledOnce(clock.clearInterval);
  });

  it('stop scanner (not configured)', () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    manager.configured = false;
    manager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
      timer,
    };

    manager.initPresenceScanner();

    expect(manager.presenceScanner.timer).eq(undefined);
    assert.notCalled(scanMock);
    assert.calledOnce(clock.clearInterval);

    clock.tick(6000);

    assert.notCalled(scanMock);
  });

  it('restart scanner (configured)', () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    manager.configured = true;
    manager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
      timer,
    };

    manager.initPresenceScanner();

    expect(manager.presenceScanner.timer).not.eq(undefined);
    assert.notCalled(scanMock);
    assert.calledOnce(clock.clearInterval);

    clock.tick(6000);

    assert.callCount(scanMock, 1);
  });

  it('start scanner', () => {
    manager.configured = true;
    manager.scanning = true;
    manager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
    };

    manager.initPresenceScanner();

    expect(manager.presenceScanner.timer).not.eq(undefined);
    assert.notCalled(scanMock);

    clock.tick(6000);

    assert.callCount(scanMock, 1);
  });
});
