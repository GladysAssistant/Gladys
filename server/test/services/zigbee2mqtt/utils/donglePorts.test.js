const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const {
  findConfiguredPort,
  getStablePath,
  isSameAdapterFamily,
} = require('../../../../services/zigbee2mqtt/utils/donglePorts');

const ZBDONGLE_P_LINK = 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_d65fba180f86ec11bfdf571719c2d21c-if00-port0';
const zbDongleP = {
  path: '/dev/ttyUSB0',
  serialNumber: 'd65fba180f86ec11bfdf571719c2d21c',
  pnpId: ZBDONGLE_P_LINK,
};
// A USB-serial adapter whose serial number is shared by many devices
const teleinfo = {
  path: '/dev/ttyUSB1',
  serialNumber: '0001',
  pnpId: 'usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0',
};

describe('zigbee2mqtt donglePorts', () => {
  describe('findConfiguredPort', () => {
    it('should find nothing without a stored path', () => {
      expect(findConfiguredPort([zbDongleP], null)).to.equal(null);
    });

    it('should find the dongle stored by its port', () => {
      expect(findConfiguredPort([teleinfo, zbDongleP], '/dev/ttyUSB0')).to.equal(zbDongleP);
    });

    it('should not find a port that is no longer there', () => {
      expect(findConfiguredPort([teleinfo], '/dev/ttyUSB0')).to.equal(null);
    });

    it('should find the dongle stored by its /dev/serial/by-id/ link, whatever its port', () => {
      const moved = { ...zbDongleP, path: '/dev/ttyUSB3' };
      expect(findConfiguredPort([teleinfo, moved], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(moved);
    });

    it('should find the dongle by its serial number when its link got another name', () => {
      const renamed = { ...zbDongleP, pnpId: `usb-Silicon_Labs_CP2102N_${zbDongleP.serialNumber}-if00-port0` };
      expect(findConfiguredPort([teleinfo, renamed], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(renamed);
    });

    it('should not take another interface of the same device', () => {
      const otherInterface = { ...zbDongleP, pnpId: ZBDONGLE_P_LINK.replace('-if00-', '-if01-') };
      expect(findConfiguredPort([otherInterface], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(null);
    });

    it('should not take a device by a short serial number, shared by a whole series', () => {
      const storedLink = '/dev/serial/by-id/usb-Silicon_Labs_Zigbee_Stick_0001-if00-port0';
      expect(findConfiguredPort([teleinfo], storedLink)).to.equal(null);
    });

    it('should not take a device when two have the serial number', () => {
      const twin = { ...zbDongleP, path: '/dev/ttyUSB2', pnpId: `usb-Other_${zbDongleP.serialNumber}-if00-port0` };
      const renamed = { ...zbDongleP, pnpId: `usb-Renamed_${zbDongleP.serialNumber}-if00-port0` };
      expect(findConfiguredPort([twin, renamed], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(null);
    });

    it('should not look for a serial number in a link without interface', () => {
      expect(findConfiguredPort([zbDongleP], '/dev/serial/by-id/usb-Unknown_device')).to.equal(null);
    });

    it('should not take a device without serial number nor USB device name', () => {
      const machinePort = { path: '/dev/ttyS0' };
      expect(findConfiguredPort([machinePort], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(null);
    });
  });

  describe('getStablePath', () => {
    let access;

    beforeEach(() => {
      access = sinon.stub(fs.promises, 'access');
    });

    afterEach(() => {
      access.restore();
    });

    it('should give the /dev/serial/by-id/ link of the device', async () => {
      access.resolves();
      expect(await getStablePath(zbDongleP)).to.equal(`/dev/serial/by-id/${ZBDONGLE_P_LINK}`);
      sinon.assert.calledOnceWithExactly(access, `/dev/serial/by-id/${ZBDONGLE_P_LINK}`);
    });

    it('should give the port when the link is not on the disk of Gladys', async () => {
      access.rejects(new Error('ENOENT'));
      expect(await getStablePath(zbDongleP)).to.equal('/dev/ttyUSB0');
    });

    it('should give the port of a device without USB device name', async () => {
      expect(await getStablePath({ path: '/dev/ttyAMA0' })).to.equal('/dev/ttyAMA0');
      sinon.assert.notCalled(access);
    });
  });

  describe('isSameAdapterFamily', () => {
    const ZBDONGLE_E = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';

    it('should tell two models of the same driver', () => {
      expect(
        isSameAdapterFamily(
          'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
          'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02',
        ),
      ).to.equal(true);
    });

    it('should tell a dongle switched to the ezsp driver from the same Silicon Labs dongle', () => {
      expect(isSameAdapterFamily(ZBDONGLE_E, `${ZBDONGLE_E} (legacy ezsp)`)).to.equal(true);
    });

    it('should tell apart two drivers', () => {
      expect(isSameAdapterFamily(ZBDONGLE_E, 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P')).to.equal(false);
    });

    it('should not tell a model out of the list, nor no model', () => {
      expect(isSameAdapterFamily(null, null)).to.equal(false);
      expect(isSameAdapterFamily('Unknown dongle', 'Unknown dongle')).to.equal(false);
    });
  });
});
