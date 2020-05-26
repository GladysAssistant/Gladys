const proxyquire = require('proxyquire').noCallThru();

class ArduinoManager {}

const ArduinoService = proxyquire('../../../../services/arduino', {
  './lib': ArduinoManager,
});

describe('send', () => {
  const arduinoService = ArduinoService({}, '6d1bd783-ab5c-4d90-8551-6bc5fcd02212');

  it('should send a message', async () => {
    await arduinoService.send();
  });
});
