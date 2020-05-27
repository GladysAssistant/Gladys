const { fake } = require('sinon');
const EventEmitter = require('events');
const ArduinoController = require('../../../../services/arduino/api/arduino.controller');
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');

/* const ports = [
  {
    comName: '/dev/tty.HC-05-DevB',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    locationId: undefined,
    vendorId: undefined,
    productId: undefined,
  },
]; */

const event = new EventEmitter();

const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');

const dhtData = require('../lib/dhtData.json');
const arduinoData = require('../lib/arduinoData.json');

const res = {
  json: fake.returns(null),
};

describe('post /api/v1/service/arduino/listen', () => {
  it('should send a message to the arduino', async () => {
    const arduinoController = ArduinoController(arduinoManager);
    const req = arduinoData;
    await arduinoController['post /api/v1/service/arduino/listen'].controller(req, res);
    // assert.calledWith('/dev/ttyACM0', );
  });
});

describe('post /api/v1/service/arduino/configure', () => {
  it('should configure a device', async () => {
    const arduinoController = ArduinoController(arduinoManager);
    const req = dhtData;
    await arduinoController['post /api/v1/service/arduino/configure'].controller(req, res);
    // assert.calledOnce();
  });
});

describe('post /api/v1/service/arduino/setup', () => {
  it('should upload an arduino code in the card', async () => {
    const arduinoController = ArduinoController(arduinoManager);
    const req = arduinoData;
    await arduinoController['post /api/v1/service/arduino/setup'].controller(req, res);
    // assert.calledOnce();
  });
});
