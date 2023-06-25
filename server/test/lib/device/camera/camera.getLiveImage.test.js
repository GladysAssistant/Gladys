const EventEmitter = require('events');
const { expect, assert } = require('chai');
const { fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');
const ServiceManager = require('../../../../lib/service');

const RANDOM_IMAGE =
  'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

const event = new EventEmitter();
const job = new Job(event);

describe('Camera.getLiveImage', () => {
  it('should return live camera image', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    serviceManager.getServiceById = fake.returns({
      device: {
        getImage: fake.resolves(RANDOM_IMAGE),
      },
    });
    const deviceManager = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    stateManager.setState('device', 'test-camera', {});
    const cameraImage = await deviceManager.camera.getLiveImage('test-camera');
    expect(cameraImage).to.equal(RANDOM_IMAGE);
  });
  it('should return camera not found', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    serviceManager.getServiceById = fake.returns({
      device: {
        getImage: fake.resolves(RANDOM_IMAGE),
      },
    });
    const deviceManager = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    stateManager.setState('device', 'test-camera', {});
    const promise = deviceManager.camera.getLiveImage('camera-not-found');
    return assert.isRejected(promise, 'Camera not found');
  });
  it('should return service not fount', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    serviceManager.getServiceById = fake.returns(null);
    const deviceManager = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    stateManager.setState('device', 'test-camera-2', {});
    const promise = deviceManager.camera.getLiveImage('test-camera-2');
    return assert.isRejected(promise, 'Service is not found or not configured.');
  });
});
