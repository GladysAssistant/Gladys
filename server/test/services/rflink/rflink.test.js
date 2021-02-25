const { expect } = require('chai');
const { fake, stub } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('./SerialPortMock.test');

const RflinkService = proxyquire('../../../services/rflink/index', {
  serialport: SerialPortMock,
});

describe('RFlinkService', () => {
  let gladys;
  let rflinkService;

  before(() => {
    gladys = {
      service: {
        getLocalServiceByName: stub().resolves({
          id: '6d1bd783-ab5c-4d90-8551-6bc5fcd02212',
        }),
      },
      event: new EventEmitter(),
      variable: {
        getValue: fake.resolves('RFLINK_PATH'),
      },
    };
    rflinkService = RflinkService(gladys);
  });

  it('should have controllers', () => {
    expect(rflinkService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });

  it('should start service', async () => {
    await rflinkService.start();
    expect(rflinkService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });

  it('should stop service', async () => {
    await rflinkService.stop();
    expect(rflinkService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
});
