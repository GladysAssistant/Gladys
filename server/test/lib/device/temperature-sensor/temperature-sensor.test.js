const EventEmitter = require('events');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

const messageManager = {
  replyByIntent: fake.resolves(true),
};

describe('TemperatureSensor.getTemperatureInRoom', () => {
  it('should get average temperature in room in celsius', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const result = await deviceManager.temperatureSensorManager.getTemperatureInRoom(
      '2398c689-8b47-43cc-ad32-e98d9be098b5',
      {
        unit: 'celsius',
      },
    );
    expect(result).to.deep.equal({
      temperature: 28.88888888888889,
      unit: 'celsius',
    });
  });
  it('should get average temperature in room in fahrenheit', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {});
    const result = await deviceManager.temperatureSensorManager.getTemperatureInRoom(
      '2398c689-8b47-43cc-ad32-e98d9be098b5',
      {
        unit: 'fahrenheit',
      },
    );
    expect(result).to.deep.equal({
      temperature: 84,
      unit: 'fahrenheit',
    });
  });
  it('should return not found error', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {});
    const temperatureResult = await deviceManager.temperatureSensorManager.getTemperatureInRoom(
      'f08337ff-206e-4bd7-86c4-6d63d793d58e',
      {
        unit: 'fahrenheit',
      },
    );
    expect(temperatureResult).to.deep.equal({
      temperature: null,
      unit: 'fahrenheit',
    });
  });
});

describe('TemperatureSensor.command', () => {
  it('should ask the temperature in a room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const message = {
      user: {
        temperature_unit_preference: 'celsius',
      },
    };
    await deviceManager.temperatureSensorManager.command(
      message,
      {
        intent: 'temperature-sensor.get-in-room',
        entities: [
          {
            sourceText: 'kitchen',
            entity: 'room',
          },
        ],
      },
      {
        room: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        user: {
          temperature_unit_preference: 'celsius',
        },
      },
    );
    assert.calledWith(messageManager.replyByIntent, message, 'temperature-sensor.get-in-room.success', {
      room: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      roomName: 'kitchen',
      temperature: 29,
      unit: '°C',
      user: {
        temperature_unit_preference: 'celsius',
      },
    });
  });
  it('should return room not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const message = {
      user: {
        temperature_unit_preference: 'celsius',
      },
    };
    await deviceManager.temperatureSensorManager.command(
      message,
      {
        intent: 'temperature-sensor.get-in-room',
        entities: [],
      },
      {
        user: {
          temperature_unit_preference: 'celsius',
        },
      },
    );
    assert.calledWith(messageManager.replyByIntent, message, 'temperature-sensor.get-in-room.fail.room-not-found', {
      user: {
        temperature_unit_preference: 'celsius',
      },
    });
  });
});
