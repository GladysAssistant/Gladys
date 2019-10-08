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

const service = {
  getService: () => testService,
};

const serviceBroken = {
  getService: () => testServiceBroken,
};

const messageManager = {
  replyByIntent: fake.resolves(true),
};

const device = {
  service: {
    name: 'test',
  },
};

const deviceFeature = {
  id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
  selector: 'test-device-feature',
  has_feedback: false,
  keep_history: true,
};

const message = {
  text: 'turn on the light in the living room',
};

const context = {
  device,
  deviceFeature,
};

describe('Light', () => {
  it('should send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service);
    await deviceManager.lightManager.command(message, { intent: 'light.turnon' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.success', context);
    assert.calledWith(testService.device.setValue, device, deviceFeature, 1);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    await deviceManager.lightManager.command(message, { intent: 'light.turnon' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.fail', context);
    assert.calledWith(testServiceBroken.device.setValue, device, deviceFeature, 1);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    await deviceManager.lightManager.command(message, { intent: 'unknow' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.fail', context);
  });
});
