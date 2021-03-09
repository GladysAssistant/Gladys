const EventEmitter = require('events');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

const messageManager = {
  replyByIntent: fake.resolves(true),
};

describe('HumiditySensor.getHumidityInRoom', () => {
  it('should get average humidity in room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const result = await deviceManager.humiditySensorManager.getHumidityInRoom('2398c689-8b47-43cc-ad32-e98d9be098b5', {
      unit: 'percent',
    });
    expect(result).to.deep.equal({
      humidity: 56.2,
      unit: 'percent',
    });
  });
  it('should return not found error', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {});
    const humidityResult = await deviceManager.humiditySensorManager.getHumidityInRoom(
      'f08337ff-206e-4bd7-86c4-6d63d793d58e',
      {
        unit: 'percent',
      },
    );
    expect(humidityResult).to.deep.equal({
      humidity: null,
      unit: 'percent',
    });
  });
});

describe('HumiditySensor.command', () => {
  it('should ask the humidity in a room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const message = {};
    await deviceManager.humiditySensorManager.command(
      message,
      {
        intent: 'humidity-sensor.get-in-room',
        entities: [
          {
            sourceText: 'kitchen',
            entity: 'room',
          },
        ],
      },
      {
        room: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      },
    );
    assert.calledWith(messageManager.replyByIntent, message, 'humidity-sensor.get-in-room.success', {
      room: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      roomName: 'kitchen',
      humidity: 56,
      unit: 'percent',
    });
  });
  it('should return room not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const message = {};
    await deviceManager.humiditySensorManager.command(message, {
      intent: 'humidity-sensor.get-in-room',
      entities: [],
    },
    {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'humidity-sensor.get-in-room.fail.room-not-found', {});
  });
});
