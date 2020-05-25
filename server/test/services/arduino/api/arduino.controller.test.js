const { assert, fake } = require('sinon');
const ArduinoController = require('../../../../services/arduino/api/arduino.controller');

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


const res = {
  json: fake.returns(null),
};

describe('post /api/v1/service/arduino/send', () => {
  it('should send a message to the arduino', async () => {
    const req = {};
    await ArduinoController['post /api/v1/service/arduino/send'].controller(req, res);
    //assert.calledOnce(list);
  });
});

describe('get /api/v1/service/arduino/init', () => {
  it('should init the devices', async () => {
    const req = {};
    await ArduinoController['get /api/v1/service/arduino/init'].controller(req, res);
    //assert.calledOnce();
  });
});
