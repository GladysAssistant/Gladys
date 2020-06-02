// const { expect } = require('chai');
const { spy, assert } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');

describe('setup method', () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('Should upload an arduino code in the board', () => {
    const setupSpy = spy(arduinoManager, 'setup');
    arduinoManager.setup(arduinoData);
    assert.calledOnce(setupSpy);
  });
});
