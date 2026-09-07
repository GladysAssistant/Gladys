const EventEmitter = require('events');
const { expect } = require('chai');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');
const db = require('../../../../models');

const event = new EventEmitter();
const job = new Job(event);

const RANDOM_IMAGE =
  'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

describe('Camera.getImagesInRoom', () => {
  it('should return image', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
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
    const cameraImage = await deviceManager.camera.getImagesInRoom('2398c689-8b47-43cc-ad32-e98d9be098b5');
    expect(cameraImage[0]).to.equal(RANDOM_IMAGE);
  });
  it('should not return the image of a disabled camera', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
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
    // The camera of the room is turned off: its last image must not be returned anymore
    await db.DeviceFeature.create({
      name: 'Test camera enabled',
      selector: 'test-camera-enabled',
      external_id: 'camera:enabled',
      category: 'camera',
      type: 'enabled',
      read_only: false,
      keep_history: false,
      has_feedback: false,
      min: 0,
      max: 1,
      last_value: 0,
      device_id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
    });
    const cameraImages = await deviceManager.camera.getImagesInRoom('2398c689-8b47-43cc-ad32-e98d9be098b5');
    expect(cameraImages).to.deep.equal([]);
  });
});
