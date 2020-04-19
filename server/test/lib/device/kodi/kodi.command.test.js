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

const message = {
  text: 'Kodi ping salon',
};

const context = {
  room: '2398c689-8b47-43cc-ad32-e98d9be098b5',
};

describe('Kodi.command', () => {
  it('should send a ping command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, service);
    await deviceManager.kodiManager.command(message, { intent: 'kodi.ping' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'kodi.ping.success', context);
  });
  it('should fail to send a ping command', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    await deviceManager.kodiManager.command(message, { intent: 'unknow' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'kodi.ping.fail', context);
  });
  it('should fail to send a ping command', async () => {
    const stateManager = new StateManager(event); 
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken);
    context.room = null;
    await deviceManager.kodiManager.command(message, { intent: 'kodi.ping' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'kodi.ping.get-in-room.fail.room-not-found', context);
  });
});
