const EventEmitter = require('events');
const { assert, fake } = require('sinon');
const chaiAssert = require('chai').assert;
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

const testService = {
  light: {
    turnOn: fake.resolves(true),
  },
};

const testServiceBroken = {
  light: {
    turnOn: fake.rejects(true),
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
    assert.calledWith(testService.light.turnOn, device, deviceFeature);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    await deviceManager.lightManager.command(message, { intent: 'light.turnon' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'light.turn-on.fail', context);
    assert.calledWith(testServiceBroken.light.turnOn, device, deviceFeature);
  });
  it('should fail to send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    const promise = deviceManager.lightManager.command(message, { intent: 'unknow' }, context);
    chaiAssert.isRejected(promise);
  });
});
