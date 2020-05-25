const { fake } = require('sinon');
const ArduinoController = require('../../../../services/arduino/api/arduino.controller');

const res = {
  json: fake.returns(null),
};

describe('post /api/v1/service/arduino/send', () => {
  it('should send a message to the arduino', async () => {
    const req = {};
    await ArduinoController['post /api/v1/service/arduino/send'].controller(req, res);
    // assert.calledOnce(list);
  });
});

describe('get /api/v1/service/arduino/init', () => {
  it('should init the devices', async () => {
    const req = {};
    await ArduinoController['get /api/v1/service/arduino/init'].controller(req, res);
    // assert.calledOnce();
  });
});
