const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('./SerialPortMock.test');

const UsbService = proxyquire('../../../services/usb/index', {
  serialport: SerialPortMock,
});

describe('usb', () => {
  const usbService = UsbService({}, '1bf2c438-4f76-44af-b433-0588d8328fff');
  it('should start service', async () => {
    await usbService.start();
  });
  it('should connect to usb driver', async () => {
    const ports = await usbService.list();
    expect(ports).to.deep.equal([
      {
        comName: '/dev/tty.HC-05-DevB',
        manufacturer: undefined,
        serialNumber: undefined,
        pnpId: undefined,
        locationId: undefined,
        vendorId: undefined,
        productId: undefined,
      },
    ]);
  });
  it('should stop service', async () => {
    await usbService.stop();
  });
});
