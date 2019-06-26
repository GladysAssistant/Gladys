const EventEmitter = require('events');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

const messageManager = {
  replyByIntent: fake.resolves(true),
};

const message = {
  text: 'Show me the camera in the living room',
};

const RANDOM_IMAGE =
  'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

describe('Camera.command', () => {
  it('should respond with image from camera', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const context = {
      room: '2398c689-8b47-43cc-ad32-e98d9be098b5',
    };
    await deviceManager.camera.command(message, { intent: 'camera.get-image-room' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'camera.get-image-room.success', context, RANDOM_IMAGE);
  });
  it('should respond camera not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {});
    const context = {
      room: 'eb67abb2-64a3-4850-88d8-b26e0a8f7c28',
    };
    await deviceManager.camera.command(message, { intent: 'camera.get-image-room' }, context);
    assert.calledWith(messageManager.replyByIntent, message, 'camera.get-image-room.no-image-found', context);
  });
});
