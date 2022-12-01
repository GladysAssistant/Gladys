const EventEmitter = require('events');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const DgramMock = require('./DgramMock.test');

const XiaomiManager = proxyquire('../../../services/xiaomi/lib', {
  dgram: DgramMock,
});

const MESSAGES = require('./messagesToTest.test');

describe('Xiaomi Service', () => {
  const gladys = {
    event: new EventEmitter(),
  };
  const xiaomiManager = new XiaomiManager(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  it('should listen', async () => {
    xiaomiManager.listen();
    xiaomiManager.listening();
  });
  MESSAGES.forEach((message) => {
    const rsiInfo = {
      address: '192.168.1.10',
    };
    it(`Should test device "${message.model}"`, () => {
      return xiaomiManager.onMessage(JSON.stringify(message), rsiInfo);
    });
  });
  it('should getSensors', async () => {
    const sensors = xiaomiManager.getSensors();
    expect(sensors).to.be.instanceOf(Array);
    sensors.forEach((sensor) => {
      expect(sensor).to.have.property('external_id');
      expect(sensor).to.have.property('name');
    });
  });
});
