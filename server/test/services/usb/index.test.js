const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('./SerialPortMock.test');

const UsbService = proxyquire('../../../services/usb/index', {
  serialport: SerialPortMock,
});

describe('usb', () => {
  const usbService = UsbService();
  it('should connect to zwave driver', async () => {
    const ports = await usbService.list();
    expect(ports).to.deep.equal([
      {
        comName: '/dev/tty.HC-05-DevB',
        comPath: '/dev/tty.HC-05-DevB',
      },
    ]);
  });
});
