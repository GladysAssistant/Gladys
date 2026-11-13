const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const LINK = 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_d65fba180f86ec11bfdf571719c2d21c-if00-port0';

describe('zigbee2mqtt findDongle', () => {
  let manager;
  let usb;
  let access;

  beforeEach(() => {
    usb = { list: sinon.fake.resolves([{ path: '/dev/ttyS0' }, { path: '/dev/ttyUSB1', pnpId: LINK }]) };
    const gladys = {
      job: { wrapper: (type, func) => func },
      service: { getService: sinon.fake.returns(usb) },
    };
    manager = new Zigbee2mqttManager(gladys, {}, serviceId);
    access = sinon.stub(fs.promises, 'access').resolves();
  });

  afterEach(() => {
    access.restore();
  });

  it('should find the dongle stored by its link, with the path to store', async () => {
    const dongle = await manager.findDongle(`/dev/serial/by-id/${LINK}`);
    expect(dongle).to.deep.equal({
      port: { path: '/dev/ttyUSB1', pnpId: LINK },
      stablePath: `/dev/serial/by-id/${LINK}`,
    });
  });

  it('should find the dongle stored by its port, with its link as the path to store', async () => {
    const dongle = await manager.findDongle('/dev/ttyUSB1');
    expect(dongle.stablePath).to.equal(`/dev/serial/by-id/${LINK}`);
  });

  it('should find nothing when the dongle is not plugged in', async () => {
    expect(await manager.findDongle('/dev/ttyUSB0')).to.equal(null);
  });

  it('should fail clearly when the usb service is not available', async () => {
    manager.gladys.service.getService = sinon.fake.returns(undefined);
    const promise = manager.findDongle('/dev/ttyUSB0');
    await expect(promise).to.be.rejectedWith(ServiceNotConfiguredError, 'USB service is not available');
  });
});
