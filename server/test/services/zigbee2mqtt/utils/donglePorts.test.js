const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const {
  findConfiguredPort,
  getStablePath,
  isSameAdapterFamily,
  isSameDevice,
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
    it('should find nothing without a stored path', async () => {
      expect(await findConfiguredPort([zbDongleP], null)).to.equal(null);
    });

    it('should find the dongle stored by its port', async () => {
      expect(await findConfiguredPort([teleinfo, zbDongleP], '/dev/ttyUSB0')).to.equal(zbDongleP);
    });

    it('should not find a port that is no longer there', async () => {
      expect(await findConfiguredPort([teleinfo], '/dev/ttyUSB0')).to.equal(null);
    });

    it('should find the dongle stored by its /dev/serial/by-id/ link, whatever its port', async () => {
      const moved = { ...zbDongleP, path: '/dev/ttyUSB3' };
      expect(await findConfiguredPort([teleinfo, moved], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(moved);
    });

    it('should find the dongle by its serial number when its link got another name', async () => {
      const renamed = { ...zbDongleP, pnpId: `usb-Silicon_Labs_CP2102N_${zbDongleP.serialNumber}-if00-port0` };
      expect(await findConfiguredPort([teleinfo, renamed], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(renamed);
    });

    it('should not take another interface of the same device', async () => {
      const otherInterface = { ...zbDongleP, pnpId: ZBDONGLE_P_LINK.replace('-if00-', '-if01-') };
      expect(await findConfiguredPort([otherInterface], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(null);
    });

    it('should not take a device by a short serial number, shared by a whole series', async () => {
      const storedLink = '/dev/serial/by-id/usb-Silicon_Labs_Zigbee_Stick_0001-if00-port0';
      expect(await findConfiguredPort([teleinfo], storedLink)).to.equal(null);
    });

    it('should not take a device when two have the serial number', async () => {
      const twin = { ...zbDongleP, path: '/dev/ttyUSB2', pnpId: `usb-Other_${zbDongleP.serialNumber}-if00-port0` };
      const renamed = { ...zbDongleP, pnpId: `usb-Renamed_${zbDongleP.serialNumber}-if00-port0` };
      expect(await findConfiguredPort([twin, renamed], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(null);
    });

    it('should not look for a serial number in a link without interface', async () => {
      expect(await findConfiguredPort([zbDongleP], '/dev/serial/by-id/usb-Unknown_device')).to.equal(null);
    });

    it('should not take a device without serial number nor USB device name', async () => {
      const machinePort = { path: '/dev/ttyS0' };
      expect(await findConfiguredPort([machinePort], `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(null);
    });

    describe('link shared by two identical adapters without serial number', () => {
      const LINK = 'usb-1a86_USB_Serial-if00-port0';
      const first = { path: '/dev/ttyUSB0', pnpId: LINK };
      const second = { path: '/dev/ttyUSB1', pnpId: LINK };
      let realpath;

      beforeEach(() => {
        realpath = sinon.stub(fs.promises, 'realpath');
      });

      afterEach(() => {
        realpath.restore();
      });

      it('should take the adapter the link leads to, which Docker uses', async () => {
        realpath.resolves('/dev/ttyUSB1');
        expect(await findConfiguredPort([first, second], `/dev/serial/by-id/${LINK}`)).to.equal(second);
      });

      it('should take none when the link leads to a port not listed', async () => {
        realpath.resolves('/dev/ttyUSB2');
        expect(await findConfiguredPort([first, second], `/dev/serial/by-id/${LINK}`)).to.equal(null);
      });

      it('should take none when the link cannot be read', async () => {
        realpath.rejects(new Error('ENOENT'));
        expect(await findConfiguredPort([first, second], `/dev/serial/by-id/${LINK}`)).to.equal(null);
      });

      it('should take the port listed twice under the same path, without reading the link', async () => {
        expect(await findConfiguredPort([first, { ...first }], `/dev/serial/by-id/${LINK}`)).to.equal(first);
        sinon.assert.notCalled(realpath);
      });
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
      expect(await getStablePath(zbDongleP, [zbDongleP, teleinfo])).to.equal(`/dev/serial/by-id/${ZBDONGLE_P_LINK}`);
      sinon.assert.calledOnceWithExactly(access, `/dev/serial/by-id/${ZBDONGLE_P_LINK}`);
    });

    it('should give the link of a device listed twice under the same port (some NAS)', async () => {
      access.resolves();
      expect(await getStablePath(zbDongleP, [zbDongleP, { ...zbDongleP }])).to.equal(
        `/dev/serial/by-id/${ZBDONGLE_P_LINK}`,
      );
    });

    it('should give the port when the link is not on the disk of Gladys', async () => {
      access.rejects(new Error('ENOENT'));
      expect(await getStablePath(zbDongleP, [zbDongleP])).to.equal('/dev/ttyUSB0');
    });

    it('should give the port of a device without USB device name', async () => {
      expect(await getStablePath({ path: '/dev/ttyAMA0' }, [])).to.equal('/dev/ttyAMA0');
      sinon.assert.notCalled(access);
    });

    it('should give the port of two identical adapters without serial number, sharing a single link', async () => {
      access.resolves();
      const pnpId = 'usb-1a86_USB_Serial-if00-port0';
      const ports = [
        { path: '/dev/ttyUSB0', pnpId },
        { path: '/dev/ttyUSB1', pnpId },
      ];
      expect(await getStablePath(ports[0], ports)).to.equal('/dev/ttyUSB0');
      expect(await getStablePath(ports[1], ports)).to.equal('/dev/ttyUSB1');
      sinon.assert.notCalled(access);
    });
  });

  describe('isSameDevice', () => {
    let realpath;

    beforeEach(() => {
      realpath = sinon.stub(fs.promises, 'realpath');
      realpath.withArgs(`/dev/serial/by-id/${ZBDONGLE_P_LINK}`).resolves('/dev/ttyUSB0');
      realpath.withArgs('/dev/ttyUSB0').resolves('/dev/ttyUSB0');
      realpath.withArgs('/dev/ttyUSB1').resolves('/dev/ttyUSB1');
      realpath.rejects(new Error('ENOENT'));
    });

    afterEach(() => {
      realpath.restore();
    });

    it('should tell a port and its link apart from another port', async () => {
      expect(await isSameDevice('/dev/ttyUSB0', `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(true);
      expect(await isSameDevice('/dev/ttyUSB1', `/dev/serial/by-id/${ZBDONGLE_P_LINK}`)).to.equal(false);
    });

    it('should not tell the same device when a path is not on the disk', async () => {
      expect(await isSameDevice('/dev/ttyUSB0', '/dev/serial/by-id/gone')).to.equal(false);
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
