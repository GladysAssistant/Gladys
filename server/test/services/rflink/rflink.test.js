const sinon = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('./SerialPortMock.test');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { assert, fake, stub } = sinon;

const rflinkConnectFailMock = fake.throws('Error');
const RFLinkHandler = proxyquire('../../../services/rflink/lib', {
  './commands/rflink.connect.js': { connect: rflinkConnectFailMock },
});

const RflinkService = proxyquire('../../../services/rflink/index', {
  serialport: SerialPortMock,
  './lib': RFLinkHandler,
});

describe('RFLinkService', () => {
  let gladys;
  let rflinkService;
  const serviceId = '6d1bd783-ab5c-4d90-8551-6bc5fcd02212';
  beforeEach(() => {
    sinon.reset();
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
  });

  it('should throw an error, service not configured and not start service because RFLINK_PATH is not found', async () => {
    gladys.variable.getValue = fake.returns(undefined);
    expect(rflinkService.start()).to.be.rejectedWith(/RFLINK_PATH_NOT_FOUND/);
    try {
      await rflinkService.start();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }
  });

  it('should throw an error and not start service because rfLinkManager is not defined', async () => {
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

  it('should start service and get the value of miligh gateway', async () => {
    gladys.variable.getValue.withArgs('CURRENT_MILIGHT_GATEWAY', serviceId).returns('BB8');
    await rflinkService.start();
    expect(rflinkService.device.currentMilightGateway).to.be.equal('BB8');
  });

  it('should stop service', async () => {
    expect(rflinkService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
    await rflinkService.stop();
    expect(rflinkService.device.connected).to.be.equal(false);
  });
});
