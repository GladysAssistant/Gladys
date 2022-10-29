const EventEmitter = require('events');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const testService = {
  device: {
    setValue: fake.resolves(true),
  },
};

const testServiceBroken = {
  device: {
    setValue: fake.rejects(true),
  },
};

const service = {
  getService: () => testService,
};

const serviceBroken = {
  getService: () => testServiceBroken,
};

const messageManager = {
  replyByIntent: fake.resolves(true),
};

const message = {
  text: 'turn on the light in the living room',
};

const context = {};

describe('Light.command', () => {
  it('should send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    await deviceManager.lightManager.command(
      message,
      {
        intent: 'light.turn-on',
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
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.success', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken, {}, {}, job);
    await deviceManager.lightManager.command(
      message,
      {
        intent: 'light.turn-on',
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
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.fail', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken, {}, {}, job);
    await deviceManager.lightManager.command(
      message,
      {
        intent: 'unknow',
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
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.fail', context);
  });
  it('should send a turn off command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    await deviceManager.lightManager.command(
      message,
      {
        intent: 'light.turn-off',
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
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-off.success', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a command because no device with binary feature in this room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    // Mock getDeviceFeature to answer no binay feature
    deviceManager.lightManager.getLightsInRoom = () =>
      new Promise((resolve) => {
        resolve([
          {
            device: {
              getDeviceFeature: () => null,
            },
          },
        ]);
      });
    await deviceManager.lightManager.command(
      message,
      {
        intent: 'light.turn-off',
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
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'light.not-found', context);
  });
  it('should fail to send a command because no device in this room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    // Mock getLightsInRoom to answer no devices
    deviceManager.lightManager.getLightsInRoom = () =>
      new Promise((resolve) => {
        resolve([]);
      });
    await deviceManager.lightManager.command(
      message,
      {
        intent: 'light.turn-off',
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
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'light.not-found', context);
  });
  it('should fail to send a command because no room found in command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    // Mock getLightsInRoom to answer no devices
    deviceManager.lightManager.getLightsInRoom = () =>
      new Promise((resolve) => {
        resolve([]);
      });
    await deviceManager.lightManager.command(
      message,
      {
        intent: 'light.turn-off',
        entities: [],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'light.not-found', context);
  });
});
