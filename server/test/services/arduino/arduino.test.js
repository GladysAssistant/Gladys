const { expect } = require('chai');
// const { assert, spy } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const ArduinoMock = require('./ArduinoMock.test');
// const ArduinoService = require('../../../services/arduino');

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
  it('should have controllers', () => {
    expect(arduinoService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    // const initSpy = spy(arduinoService.arduinoManager, 'init');
    await arduinoService.start();
    // assert.calledOnce(initSpy);
  });
  it('should stop service', async () => {
    await arduinoService.stop();
  });
});
