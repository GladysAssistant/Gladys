// const { expect } = require('chai');
const { spy, assert } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');

describe('init method', () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('Should init the connection with the arduino devices', () => {
    const initSpy = spy(arduinoManager, 'init');
    arduinoManager.init();
    assert.calledOnce(initSpy);
  });
});
