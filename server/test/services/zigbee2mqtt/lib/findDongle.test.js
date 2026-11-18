const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { getDriverPathToStore } = require('../../../../services/zigbee2mqtt/lib/findDongle');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const LINK = 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_d65fba180f86ec11bfdf571719c2d21c-if00-port0';

describe('zigbee2mqtt getDriverPathToStore', () => {
  const ZBDONGLE_P = 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P';
  const dongleP = { path: '/dev/ttyUSB0', pnpId: LINK, vendorId: '10c4', productId: 'ea60' };

  it('should store the only dongle of its family by its link', () => {
    const dongle = { port: dongleP, stablePath: `/dev/serial/by-id/${LINK}`, ports: [dongleP, { path: '/dev/ttyS0' }] };
    expect(getDriverPathToStore(dongle, '/dev/ttyUSB0', ZBDONGLE_P)).to.equal(`/dev/serial/by-id/${LINK}`);
  });

  it('should keep a port that another dongle of the same family may have taken', () => {
    const otherDongle = {
      ...dongleP,
      path: '/dev/ttyUSB1',
      pnpId: 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_2-if00-port0',
    };
    const dongle = { port: dongleP, stablePath: `/dev/serial/by-id/${LINK}`, ports: [dongleP, otherDongle] };
    expect(getDriverPathToStore(dongle, '/dev/ttyUSB0', ZBDONGLE_P)).to.equal('/dev/ttyUSB0');
  });

  it('should keep a port taken by an adapter of another kind', () => {
    const teleinfo = { path: '/dev/ttyUSB0', pnpId: 'usb-FTDI_FT232R_USB_UART_A1B2C3D4-if00-port0' };
    const dongle = { port: teleinfo, stablePath: `/dev/serial/by-id/${teleinfo.pnpId}`, ports: [teleinfo] };
    expect(getDriverPathToStore(dongle, '/dev/ttyUSB0', ZBDONGLE_P)).to.equal('/dev/ttyUSB0');
  });

  it('should keep the link it was found by', () => {
    // Two identical adapters without serial number: the port would be its stable path
    const dongle = { port: dongleP, stablePath: '/dev/ttyUSB0', ports: [dongleP] };
    expect(getDriverPathToStore(dongle, `/dev/serial/by-id/${LINK}`, ZBDONGLE_P)).to.equal(`/dev/serial/by-id/${LINK}`);
  });

  it('should store the new link of a dongle found by its serial number', () => {
    const dongle = { port: dongleP, stablePath: `/dev/serial/by-id/${LINK}`, ports: [dongleP] };
    expect(
      getDriverPathToStore(
        dongle,
        '/dev/serial/by-id/usb-Renamed_d65fba180f86ec11bfdf571719c2d21c-if00-port0',
        ZBDONGLE_P,
      ),
    ).to.equal(`/dev/serial/by-id/${LINK}`);
  });
});

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
      ports: [{ path: '/dev/ttyS0' }, { path: '/dev/ttyUSB1', pnpId: LINK }],
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
