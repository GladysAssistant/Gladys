const { assert, fake } = require('sinon');
const UsbController = require('../../../services/usb/api/usb.controller');

const ports = [
  {
    path: '/dev/path',
    manufacturer: '/dev/tty.HC-05-DevB',
    productId: '/dev/comPID',
    vendorId: '/dev/comVID',
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
    assert.calledOnceWithExactly(res.json, [
      {
        comPath: '/dev/path',
        comName: '/dev/tty.HC-05-DevB',
        comPID: '/dev/comPID',
        comVID: '/dev/comVID',
      },
    ]);
  });
});
