// const { expect } = require('chai');
const { spy } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const ArduinoMock = require('./ArduinoMock.test');

const ArduinoService = proxyquire('../../../services/arduino', {
  './lib': ArduinoMock,
});

const gladys = {
  event: new EventEmitter(),
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe('arduino', () => {
  const arduinoService = ArduinoService(gladys, '1dbaeb48-d6d2-4930-b7ca-f17d637a364b');
  it('should start service', async () => {
    spy(arduinoService, 'init');
    await arduinoService.start();
    // expect(arduinoService.init.calledOnce).to.be.true;
  });
  it('should stop service', async () => {
    await arduinoService.stop();
  });
});
