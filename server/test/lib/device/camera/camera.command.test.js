const EventEmitter = require('events');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');

const event = new EventEmitter();

const job = new Job(event);

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
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);
    const context = {};
    await deviceManager.camera.command(
      message,
      {
        intent: 'camera.get-image-room',
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
    assert.calledWith(messageManager.replyByIntent, message, 'camera.get-image-room.success', context, RANDOM_IMAGE);
  });
  it('should respond camera not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);
    const context = {};
    await deviceManager.camera.command(
      message,
      {
        intent: 'camera.get-image-room',
        entities: [
          {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'room',
            type: 'enum',
            option: 'eb67abb2-64a3-4850-88d8-b26e0a8f7c28',
            sourceText: 'kitchen',
            utteranceText: 'kitchen',
          },
        ],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'camera.get-image-room.no-image-found', context);
  });
  it('should respond camera not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, messageManager, stateManager, {}, {}, {}, job);
    const context = {};
    await deviceManager.camera.command(
      message,
      {
        intent: 'camera.get-image-room',
        entities: [],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'camera.get-image-room.no-image-found', context);
  });
});
