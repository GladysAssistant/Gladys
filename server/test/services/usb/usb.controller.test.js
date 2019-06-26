const { assert, fake } = require('sinon');
const UsbController = require('../../../services/usb/api/usb.controller');

const ports = [
  {
    comName: '/dev/tty.HC-05-DevB',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    locationId: undefined,
    vendorId: undefined,
    productId: undefined,
  },
];

const list = fake.resolves(ports);

const res = {
  json: fake.returns(null),
};

describe('GET /api/v1/service/usb/port', () => {
  it('should configure bridge', async () => {
    const usbController = UsbController({ list });
    const req = {};
    await usbController['get /api/v1/service/usb/port'].controller(req, res);
    assert.calledOnce(list);
    assert.calledWith(res.json, ports);
  });
});
