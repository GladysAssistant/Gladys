const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const scanPresenceMock = fake.resolves(null);
const LANManager = proxyquire('../../../../services/lan-manager/lib', {
  './lan-manager.scanPresence': { scanPresence: scanPresenceMock },
});

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';
const lanDiscovery = {};

describe('LANManager initPresenceScanner', () => {
  let manager;
  let clock;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, lanDiscovery);
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('stop scanner', async () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    manager.presenceScanner = {
      status: 'disabled',
      timer,
    };

    manager.initPresenceScanner();

    expect(manager.presenceScanner.timer).eq(undefined);
    assert.notCalled(scanPresenceMock);
    assert.calledOnce(clock.clearInterval);
  });

  it('restart scanner', async () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    manager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
      timer,
    };

    manager.initPresenceScanner();

    expect(manager.presenceScanner.timer).not.eq(undefined);
    assert.calledOnce(scanPresenceMock);
    assert.calledOnce(clock.clearInterval);

    clock.tick(6000);

    assert.callCount(scanPresenceMock, 2);
  });

  it('start scanner', async () => {
    manager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
    };

    manager.initPresenceScanner();

    expect(manager.presenceScanner.timer).not.eq(undefined);
    assert.calledOnce(scanPresenceMock);

    clock.tick(6000);

    assert.callCount(scanPresenceMock, 2);
  });
});
