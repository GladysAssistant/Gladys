const EventEmitter = require('events');
const { expect, assert } = require('chai');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const RANDOM_IMAGE =
  'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

const event = new EventEmitter();

describe('Camera.getImage', () => {
  it('should return camera image', async () => {
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
    const cameraImage = await deviceManager.camera.getImage('test-camera');
    expect(cameraImage).to.equal(RANDOM_IMAGE);
  });
  it('should return camera not found', async () => {
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
    const promise = deviceManager.camera.getImage('camera-not-found');
    return assert.isRejected(promise, 'Camera not found');
  });
  it('should return camera not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {});
    stateManager.setState('device', 'test-camera-2', {
      features: [
        {
          id: '565d05fc-1736-4b76-99ca-581232901d96',
          selector: 'test-camera',
          last_value_string: RANDOM_IMAGE,
        },
      ],
    });
    const promise = deviceManager.camera.getImage('test-camera-2');
    return assert.isRejected(promise, 'Camera image feature not found');
  });
});
