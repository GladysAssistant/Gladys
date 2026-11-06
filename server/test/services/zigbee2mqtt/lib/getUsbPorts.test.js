const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { ADAPTERS } = require('../../../../services/zigbee2mqtt/adapters');
const { USB_FINGERPRINTS } = require('../../../../services/zigbee2mqtt/adapters/usbFingerprints');
const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const ZBDONGLE_E = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';
const ZBDONGLE_P = 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P';

describe('zigbee2mqtt getUsbPorts', () => {
  let manager;
  let usb;

  const getAdapter = async (port) => {
    usb.list = fake.resolves([port]);
    const [{ adapter }] = await manager.getUsbPorts();
    return adapter;
  };

  beforeEach(() => {
    usb = { list: fake.resolves([]) };
    const gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      service: {
        getService: fake.returns(usb),
      },
    };
    manager = new Zigbee2mqttManager(gladys, {}, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should recognize a ZBDongle-E, and keep the serial ports of the machine (production machine)', async () => {
    usb.list = fake.resolves([
      {
        path: '/dev/ttyUSB0',
        manufacturer: 'Itead',
        serialNumber: '8e73883472d9ee11bb48b74c37b89984',
        pnpId: 'usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_8e73883472d9ee11bb48b74c37b89984-if00-port0',
        vendorId: '10c4',
        productId: 'ea60',
      },
      { path: '/dev/ttyS4', vendorId: '8086', productId: '54a8' },
      { path: '/dev/ttyS1' },
    ]);

    const ports = await manager.getUsbPorts();

    expect(ports).to.deep.equal([
      {
        path: '/dev/ttyUSB0',
        name: 'Itead Sonoff Zigbee 3.0 USB Dongle Plus V2',
        pnpId: 'usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_8e73883472d9ee11bb48b74c37b89984-if00-port0',
        adapter: ZBDONGLE_E,
      },
      { path: '/dev/ttyS4', name: null, pnpId: undefined, adapter: null },
      { path: '/dev/ttyS1', name: null, pnpId: undefined, adapter: null },
    ]);
  });

  it('should recognize a ZBDongle-P (test bench)', async () => {
    usb.list = fake.resolves([
      {
        path: '/dev/ttyUSB0',
        manufacturer: 'ITead',
        serialNumber: 'd65fba180f86ec11bfdf571719c2d21c',
        pnpId: 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_d65fba180f86ec11bfdf571719c2d21c-if00-port0',
        vendorId: '10c4',
        productId: 'ea60',
      },
    ]);

    const ports = await manager.getUsbPorts();

    expect(ports).to.deep.equal([
      {
        path: '/dev/ttyUSB0',
        name: 'ITead Sonoff Zigbee 3.0 USB Dongle Plus',
        pnpId: 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_d65fba180f86ec11bfdf571719c2d21c-if00-port0',
        adapter: ZBDONGLE_P,
      },
    ]);
  });

  it('should name an unknown USB device after its USB device name, without serial number', async () => {
    usb.list = fake.resolves([
      {
        path: '/dev/ttyACM0',
        manufacturer: 'Arduino (www.arduino.cc)',
        serialNumber: '85735313932351F0E1C1',
        pnpId: 'usb-Arduino__www.arduino.cc__0043_85735313932351F0E1C1-if00',
        vendorId: '2341',
        productId: '0043',
      },
    ]);

    const [port] = await manager.getUsbPorts();

    expect(port.name).to.equal('Arduino www.arduino.cc 0043');
    expect(port.adapter).to.equal(null);
  });

  it('should name a device without USB device name after its manufacturer', async () => {
    usb.list = fake.resolves([{ path: '/dev/ttyUSB0', manufacturer: 'ITEAD', vendorId: '10c4', productId: 'ea60' }]);

    const ports = await manager.getUsbPorts();

    // Without USB device name, the ZBDongle-E and ZBDongle-P can't be told apart: no model
    expect(ports).to.deep.equal([{ path: '/dev/ttyUSB0', name: 'ITEAD', pnpId: undefined, adapter: null }]);
  });

  it('should fail when the usb service is not available', async () => {
    manager.gladys.service.getService = fake.returns(undefined);

    try {
      await manager.getUsbPorts();
      expect.fail();
    } catch (e) {
      expect(e)
        .instanceOf(ServiceNotConfiguredError)
        .property('message', 'USB service is not available');
    }
  });

  it('should keep the USB device name when its serial number is not at its end', async () => {
    usb.list = fake.resolves([
      {
        path: '/dev/ttyUSB0',
        serialNumber: '0001',
        pnpId: 'usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller-if00-port0',
        vendorId: '10c4',
        productId: 'ea60',
      },
    ]);

    const [port] = await manager.getUsbPorts();

    expect(port.name).to.equal('Silicon Labs CP2102 USB to UART Bridge Controller');
    expect(port.adapter).to.equal(null);
  });

  it('should recognize the ZBDongle-E CH9102 variant, with uppercase ids', async () => {
    const adapter = await getAdapter({
      path: '/dev/ttyACM0',
      pnpId: 'usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00',
      vendorId: '1A86',
      productId: '55D4',
    });
    expect(adapter).to.equal(ZBDONGLE_E);
  });

  it('should recognize a ZBDongle-E without serial number in its USB device name', async () => {
    const adapter = await getAdapter({
      path: '/dev/ttyUSB0',
      pnpId: 'usb-ITEAD_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2-if00-port0',
      vendorId: '10c4',
      productId: 'ea60',
    });
    expect(adapter).to.equal(ZBDONGLE_E);
  });

  it('should recognize a ZBDongle-P named after its Silicon Labs chip', async () => {
    const adapter = await getAdapter({
      path: '/dev/ttyUSB0',
      pnpId: 'usb-Silicon_Labs_Sonoff_Zigbee_3.0_USB_Dongle_Plus_0111-if00-port0',
      vendorId: '10c4',
      productId: 'ea60',
    });
    expect(adapter).to.equal(ZBDONGLE_P);
  });

  it('should not take the other SONOFF Dongle Plus for a ZBDongle-P', async () => {
    const pmg24 = await getAdapter({
      path: '/dev/ttyUSB0',
      pnpId: 'usb-SONOFF_SONOFF_Dongle_Plus_MG24_b023a583a66bef118e30a3adc169b110-if00-port0',
      vendorId: '10c4',
      productId: 'ea60',
    });
    const pp10 = await getAdapter({
      path: '/dev/ttyUSB0',
      pnpId: 'usb-SONOFF_SONOFF_Dongle_Plus_CC2674P10_141ff85f6b12f011b6500514773d9da9-if00-port0',
      vendorId: '10c4',
      productId: 'ea60',
    });
    expect(pmg24).to.equal('SONOFF Dongle-PMG24');
    expect(pp10).to.equal('SONOFF Dongle Plus CC2674P10 Dongle-PP10');
  });

  it('should tell the SMLIGHT SLZB-06M variants and the SLZB-07 apart', async () => {
    const pnpIds = {
      'usb-SMLIGHT_SMLIGHT_SLZB-06M_123-if00-port0': 'SMLIGHT SLZB-06M',
      'usb-SMLIGHT_SMLIGHT_SLZB-06Mg24_123-if00-port0': 'SMLIGHT SLZB-06Mg24',
      'usb-SMLIGHT_SMLIGHT_SLZB-06Mg26_123-if00-port0': 'SMLIGHT SLZB-06Mg26',
      'usb-SMLIGHT_SMLIGHT_SLZB-07_be9faa0786e1ea11bd68dc2d9a583111-if00-port0': 'SMLIGHT SLZB-07',
      'usb-SMLIGHT_SMLIGHT_SLZB-07mg24_123-if00-port0': 'SMLIGHT SLZB-07mg24',
      'usb-SMLIGHT_SMLIGHT_SLZB-07p7_be9faa0786e1ea11bd68dc2d9a583111-if00-port0':
        'SMLIGHT SLZB-07p7 Zigbee USB CC2652P7 adapter',
    };
    const adapters = await Promise.all(
      Object.keys(pnpIds).map((pnpId) =>
        getAdapter({ path: '/dev/ttyUSB0', pnpId, vendorId: '10c4', productId: 'ea60' }),
      ),
    );
    expect(adapters).to.deep.equal(Object.values(pnpIds));
  });

  it('should tell the ConBee III and the zig-a-zig-ah! apart, sharing the same FTDI chip', async () => {
    const conbee = await getAdapter({
      path: '/dev/ttyUSB0',
      pnpId: 'usb-dresden_elektronik_ConBee_III_DE03188111-if00-port0',
      vendorId: '0403',
      productId: '6015',
    });
    const zzh = await getAdapter({
      path: '/dev/ttyUSB0',
      pnpId: 'usb-Electrolama_zig-a-zig-ah__zzh__123-if00-port0',
      vendorId: '0403',
      productId: '6015',
    });
    expect(conbee).to.equal('ConBee III');
    expect(zzh).to.equal('Electrolama zig-a-zig-ah! (zzh!)');
  });

  it('should not recognize a known USB device name with other ids', async () => {
    const adapter = await getAdapter({
      path: '/dev/ttyUSB0',
      pnpId: 'usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_123-if00-port0',
      vendorId: '0403',
      productId: '6015',
    });
    expect(adapter).to.equal(null);
  });

  it('should only give models of the Gladys list', () => {
    const labels = ADAPTERS.map(({ label }) => label);
    USB_FINGERPRINTS.forEach(({ adapter }) => expect(labels).to.include(adapter));
  });
});
