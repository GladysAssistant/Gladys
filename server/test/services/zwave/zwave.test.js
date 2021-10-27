const { expect } = require('chai');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const ZwaveMock = require('./ZwaveMock.test');

const ZwaveService = proxyquire('../../../services/zwave/index', {
  'openzwave-shared': ZwaveMock,
});

const gladys = {
  event: new EventEmitter(),
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe('zwaveService', () => {
  const zwaveService = ZwaveService(gladys, 'be86c4db-489f-466c-aeea-1e262c4ee720');
  it('should have controllers', () => {
    expect(zwaveService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await zwaveService.start();
  });
  it('should stop service', async () => {
    await zwaveService.stop();
  });
});
