const EventEmitter = require('events');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

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

const testServiceNoLight = {
  getDeviceFeature: () => {
    return null;
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

const context = {
  room: '2398c689-8b47-43cc-ad32-e98d9be098b5',
};

describe('Light.command', () => {
  it('should send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service);
    await deviceManager.lightManager.command(message, { intent: 'light.turn-on' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.success', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    await deviceManager.lightManager.command(message, { intent: 'light.turn-on' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.fail', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    await deviceManager.lightManager.command(message, { intent: 'unknow' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.fail', context);
  });
  it('should send a turn off command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service);
    await deviceManager.lightManager.command(message, { intent: 'light.turn-off' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-off.success', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a command because no device with binary feature in this room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, testServiceNoLight);
    await deviceManager.lightManager.command(message, { intent: 'light.turn-off' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.not-found', context);
  });
  it('should fail to send a command because no device in this room', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service);
    // Mock getLightsInRoom to answer no devices
    deviceManager.lightManager.getLightsInRoom = () =>
      new Promise((resolve) => {
        resolve([]);
      });
    await deviceManager.lightManager.command(message, { intent: 'light.turn-off' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.not-found', context);
  });
});
