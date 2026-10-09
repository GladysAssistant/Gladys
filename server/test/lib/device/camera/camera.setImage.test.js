const EventEmitter = require('events');
const { expect, assert } = require('chai');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');

const RANDOM_IMAGE =
  'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

const event = new EventEmitter();
const job = new Job(event);

describe('Camera.setImage', () => {
  it('should set image', async () => {
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
    const newDeviceFeature = stateManager.get('deviceFeature', 'test-camera');
    expect(newDeviceFeature).to.have.property('last_value_string', RANDOM_IMAGE);
  });
  it('should return camera not found', async () => {
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
    const promise = deviceManager.camera.setImage('not-found-camera', RANDOM_IMAGE);
    return assert.isRejected(promise, 'Camera not found');
  });
  it('should return camera feature not found', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('device', 'test-camera', {
      features: [
        {
          id: '565d05fc-1736-4b76-99ca-581232901d96',
          selector: 'test-camera',
          last_value_string: RANDOM_IMAGE,
        },
      ],
    });
    const promise = deviceManager.camera.setImage('test-camera', RANDOM_IMAGE);
    return assert.isRejected(promise, 'Camera image feature not found');
  });
  it('should return image too big', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('device', 'test-camera', {
      features: [
        {
          id: '565d05fc-1736-4b76-99ca-581232901d96',
          selector: 'test-camera',
          last_value_string: RANDOM_IMAGE,
        },
      ],
    });
    let bigImage = 'image/png;base64,';
    while (bigImage.length < 151 * 1024) {
      bigImage += 'lkmlklkmlklsjfksdjflkdsjkj';
    }
    const promise = deviceManager.camera.setImage('test-camera', bigImage);
    return assert.isRejected(promise, 'Image is too big');
  });
  it('should not store the image of a disabled camera', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('device', 'test-camera-disabled', {
      features: [
        {
          id: '565d05fc-1736-4b76-99ca-581232901d96',
          selector: 'test-camera-disabled',
          category: 'camera',
          type: 'enabled',
          last_value: 0,
        },
        {
          id: '0eb6a0f0-8c4b-4c4a-8c5d-6cd0f2b6ac3d',
          selector: 'test-camera-disabled-image',
          category: 'camera',
          type: 'image',
        },
      ],
    });
    const promise = deviceManager.camera.setImage('test-camera-disabled', RANDOM_IMAGE);
    await assert.isRejected(promise, 'Camera is disabled');
    // The image was not stored, so turning the camera back on cannot reveal it
    expect(stateManager.get('deviceFeature', 'test-camera-disabled-image')).to.equal(null);
  });
});
