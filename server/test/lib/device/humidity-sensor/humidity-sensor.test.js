const EventEmitter = require('events');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const sinon = require('sinon');
const Device = require('../../../../lib/device');
const Room = require('../../../../lib/room');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();
const messageManager = {
  replyByIntent: fake.resolves(true),
};

describe('HumiditySensor.getHumidityInRoom', () => {
  it('should get average humidity in room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const result = await deviceManager.humiditySensorManager.getHumidityInRoom('2398c689-8b47-43cc-ad32-e98d9be098b5');
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
    );
    expect(humidityResult).to.deep.equal({
      humidity: null,
      unit: 'percent',
    });
  });
});

describe('HumiditySensor.command', () => {
  afterEach(() => {
    sinon.reset();
  });
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
    await deviceManager.humiditySensorManager.command(
      message,
      {
        intent: 'humidity-sensor.get-in-room',
        entities: [],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'humidity-sensor.get-in-room.fail.room-not-found', {});
  });
  it('should ask the humidity in a room with no values', async () => {
    const brain = {
      addRoom: fake.returns(null),
      removeRoom: fake.returns(null),
    };
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const room = new Room(brain);
    await room.create('test-house', {
      name: 'No value Room',
    });
    const roomFound = await room.getBySelector('no-value-room');
    const message = {};
    await deviceManager.humiditySensorManager.command(
      message,
      {
        intent: 'humidity-sensor.get-in-room',
        entities: [
          {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'room',
            type: 'enum',
            option: roomFound.id,
            sourceText: roomFound.name,
            utteranceText: roomFound.name,
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
    assert.calledWith(messageManager.replyByIntent, message, 'humidity-sensor.get-in-room.fail.no-results', {
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
    });
  });
  it('should return error when incorrect intent', async () => {
    const brain = {
      addRoom: fake.returns(null),
      removeRoom: fake.returns(null),
    };
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const room = new Room(brain);
    await room.create('test-house', {
      name: 'No value Room',
    });
    const roomFound = await room.getBySelector('no-value-room');
    const message = {};
    await deviceManager.humiditySensorManager.command(
      message,
      {
        intent: 'humidity-sensor.get-in-rooom',
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
        room: roomFound.id,
      },
    );
    assert.calledWith(messageManager.replyByIntent, message, 'humidity-sensor.get-in-room.fail', {
      room: roomFound.id,
    });
  });
});
