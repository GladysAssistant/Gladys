const { expect } = require('chai');
const EventEmitter = require('events');
const { fake, stub, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const ZwaveService = proxyquire('../../../services/zwave/index', {
  'zwave-js': {
    Driver: stub().callsFake(() => {
      return {
        on: stub().returns(null),
        start: stub().resolves(null),
        destroy: stub().resolves(null),
        enableErrorReporting: fake.returns(null),
      };
    }),
  },
});

const ZWAVE_SERVICE_ID = 'ZWAVE_SERVICE_ID';

const gladys = {
  event: new EventEmitter(),
  variable: {
    getValue: (name) => Promise.resolve(name === 'ZWAVE_DRIVER_PATH' ? 'test' : null),
  },
  config: {
    servicesFolder: fake.returns('/tmp'),
  },
};

describe('zwaveService', () => {
  const zwaveService = ZwaveService(gladys, ZWAVE_SERVICE_ID);
  it('should have controllers', () => {
    expect(zwaveService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  /* it('should start service', async () => {
    await zwaveService.start();
    assert.calledThrice(zwaveService.device.driver.on);
    expect(zwaveService.device.connected).to.equal(true);
  });
  it('should stop service', async () => {
    await zwaveService.stop();
    expect(zwaveService.device.connected).to.equal(false);
  });
});
