const EventEmitter = require('events');
const { expect } = require('chai');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

const RANDOM_IMAGE =
  'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

describe('Camera.getImageInRoom', () => {
  it('should return image', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {});
    stateManager.setState('device', 'test-camera', {
      features: [
        {
          id: '565d05fc-1736-4b76-99ca-581232901d96',
          selector: 'test-camera',
          category: 'camera',
          type: 'image',
          last_value_string: RANDOM_IMAGE,
        },
      ],
    });
    await deviceManager.camera.setImage('test-camera', RANDOM_IMAGE);
    const cameraImage = await deviceManager.camera.getImageInRoom('2398c689-8b47-43cc-ad32-e98d9be098b5');
    expect(cameraImage).to.equal(RANDOM_IMAGE);
  });
});
