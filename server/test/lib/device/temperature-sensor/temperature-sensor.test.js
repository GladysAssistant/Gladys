const EventEmitter = require('events');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');
const db = require('../../../../models');

const event = new EventEmitter();
const job = new Job(event);

const messageManager = {
  replyByIntent: fake.resolves(true),
};

describe('TemperatureSensor.getTemperatureInRoom', () => {
  it('should get average temperature in room in celsius', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);
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
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
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
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
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
  it('should exclude crazy values (below -273.15 or above 200) from average calculation', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);

    // Create a temperature sensor with a crazy high value (500°C)
    await db.DeviceFeature.create({
      id: 'a5d22c4e-1b8f-4a3c-9f2d-6e7a8b9c0d1e',
      name: 'Test temperature sensor crazy high value',
      selector: 'test-temperature-sensor-crazy-high',
      external_id: 'temperature-sensor:crazy-high',
      category: 'temperature-sensor',
      type: 'decimal',
      unit: 'celsius',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 100,
      last_value: 500,
      last_value_changed: new Date(),
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
    });

    // Create a temperature sensor with a crazy low value (-999°C)
    await db.DeviceFeature.create({
      id: 'b6e33d5f-2c9a-5b4d-0a3e-7f8b9c0d2e3f',
      name: 'Test temperature sensor crazy low value',
      selector: 'test-temperature-sensor-crazy-low',
      external_id: 'temperature-sensor:crazy-low',
      category: 'temperature-sensor',
      type: 'decimal',
      unit: 'celsius',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 100,
      last_value: -999,
      last_value_changed: new Date(),
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
    });
    const result = await deviceManager.temperatureSensorManager.getTemperatureInRoom(
      '2398c689-8b47-43cc-ad32-e98d9be098b5',
      {
        unit: 'celsius',
      },
    );
    // The crazy value sensor (500°C) should be excluded from the calculation
    // Only the valid sensors (20°C and 100°F = 37.78°C) should be included
    // Average = (20 + 37.78) / 2 = 28.89°C
    expect(result.temperature).to.be.closeTo(28.89, 0.01);
    expect(result.unit).to.equal('celsius');
  });
  it('should exclude crazy fahrenheit values (below -459.67 or above 392) from average calculation', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);

    // Create a temperature sensor with a crazy high fahrenheit value (1000°F)
    await db.DeviceFeature.create({
      id: 'c7f44e6a-3d0b-6c5e-1b4f-8a9c0d3e4f5a',
      name: 'Test temperature sensor crazy high fahrenheit',
      selector: 'test-temperature-sensor-crazy-high-f',
      external_id: 'temperature-sensor:crazy-high-f',
      category: 'temperature-sensor',
      type: 'decimal',
      unit: 'fahrenheit',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 100,
      last_value: 1000,
      last_value_changed: new Date(),
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
    });

    // Create a temperature sensor with a crazy low fahrenheit value (-1000°F)
    await db.DeviceFeature.create({
      id: 'd8a55f7b-4e1c-7d6f-2c5a-9b0d1e4f5a6b',
      name: 'Test temperature sensor crazy low fahrenheit',
      selector: 'test-temperature-sensor-crazy-low-f',
      external_id: 'temperature-sensor:crazy-low-f',
      category: 'temperature-sensor',
      type: 'decimal',
      unit: 'fahrenheit',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 100,
      last_value: -1000,
      last_value_changed: new Date(),
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
    });

    const result = await deviceManager.temperatureSensorManager.getTemperatureInRoom(
      '2398c689-8b47-43cc-ad32-e98d9be098b5',
      {
        unit: 'celsius',
      },
    );
    // The crazy fahrenheit values should be excluded from the calculation
    // Only the valid sensors (20°C and 100°F = 37.78°C) should be included
    // Average = (20 + 37.78) / 2 = 28.89°C
    expect(result.temperature).to.be.closeTo(28.89, 0.01);
    expect(result.unit).to.equal('celsius');
  });
});

describe('TemperatureSensor.command', () => {
  it('should ask the temperature in a room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);
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
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'room',
            type: 'enum',
            option: '2398c689-8b47-43cc-ad32-e98d9be098b5',
            sourceText: 'kitchen',
            utteranceText: 'kitchen',
          },
        ],
      },
      {
        entities: {
          room: {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'room',
            type: 'enum',
            option: '2398c689-8b47-43cc-ad32-e98d9be098b5',
            sourceText: 'kitchen',
            utteranceText: 'kitchen',
          },
        },
        room: 'kitchen',
        slotFill: undefined,
        user: {
          temperature_unit_preference: 'celsius',
        },
      },
    );
    assert.calledWith(messageManager.replyByIntent, message, 'temperature-sensor.get-in-room.success', {
      entities: {
        room: {
          start: 25,
          end: 31,
          len: 7,
          levenshtein: 0,
          accuracy: 1,
          entity: 'room',
          type: 'enum',
          option: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          sourceText: 'kitchen',
          utteranceText: 'kitchen',
        },
      },
      room: 'kitchen',
      slotFill: undefined,
      user: {
        temperature_unit_preference: 'celsius',
      },
      roomName: 'kitchen',
      temperature: 29,
      unit: '°C',
    });
  });
  it('should return room not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);
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
