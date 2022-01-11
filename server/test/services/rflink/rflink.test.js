const { expect } = require('chai');
const { assert, fake, stub } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('./SerialPortMock.test');

const RflinkService = proxyquire('../../../services/rflink/index', {
  serialport: SerialPortMock,
});

describe('RFlinkService', () => {
  let gladys;
  let rflinkService;
  const serviceId = '6d1bd783-ab5c-4d90-8551-6bc5fcd02212';
  beforeEach(() => {
    gladys = {
      event: new EventEmitter(),
      variable: {
        getValue: stub(),
      },
    };
    gladys.variable.getValue.withArgs('RFLINK_PATH', serviceId).returns('/usb/tty');
    gladys.variable.getValue.withArgs('CURRENT_MILIGHT_GATEWAY', serviceId).returns(null);
    rflinkService = RflinkService(gladys, serviceId);
  });

  it('should have controllers', () => {
    expect(rflinkService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });

  it('should start service', async () => {
    expect(rflinkService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
    expect(rflinkService)
      .to.have.property('device')
      .and.be.instanceOf(Object);
    await rflinkService.start();
    assert.calledTwice(gladys.variable.getValue);
    expect(rflinkService.device.connected).to.be.equal(true);
  });

  it('should not start service because RFLINK_PATH is not found', async () => {
    gladys.variable.getValue = fake.returns(undefined);
    expect(rflinkService.start()).to.be.rejectedWith(/RFLINK_PATH_NOT_FOUND/);
  });

  it('should not start service because rfLinkManager is not defined', async () => {
    rflinkService.rfLinkManager = undefined;
    expect(rflinkService.start()).to.be.rejectedWith(/RFLINK_GATEWAY_ERROR/);
  });

  it('should not start service because rfLinkManager is not defined', async () => {
    rflinkService.rfLinkManager = {
      connect: fake.throws('Error'),
    };
    try {
      await rflinkService.start();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
    }
  });

  it('should start service and set default value to miligh gateway', async () => {
    await rflinkService.start();
    expect(rflinkService.device.currentMilightGateway).to.be.equal('F746');
  });

  it('should stop service', async () => {
    expect(rflinkService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
    await rflinkService.stop();
    expect(rflinkService.device.connected).to.be.equal(false);
  });
});
