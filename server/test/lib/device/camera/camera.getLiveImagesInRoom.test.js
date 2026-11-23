const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');
const ServiceManager = require('../../../../lib/service');
const db = require('../../../../models');

const event = new EventEmitter();
const job = new Job(event);

// Seeded camera: device "test-camera" in this room, with a camera/image feature.
const ROOM_ID = '2398c689-8b47-43cc-ad32-e98d9be098b5';
const CAMERA_DEVICE_ID = 'fbedb47f-4d25-4381-8923-2633b23192a0';
const SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';

const LIVE_IMAGE = 'image/jpg;base64,TElWRQ==';
const STORED_IMAGE = 'image/jpg;base64,U1RPUkVE';
const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000);

/**
 * @description Build a camera device as the state manager holds it.
 * @param {object} options - Options.
 * @param {Date} [options.storedImageChanged] - When the stored image was saved.
 * @param {number} [options.enabled] - Value of the camera/enabled feature, none when omitted.
 * @returns {object} The camera device.
 * @example
 * buildCameraState({ storedImageChanged: new Date() });
 */
function buildCameraState({ storedImageChanged = new Date(), enabled } = {}) {
  const features = [
    {
      category: 'camera',
      type: 'image',
      last_value_string: STORED_IMAGE,
      last_value_changed: storedImageChanged,
    },
  ];
  if (enabled !== undefined) {
    features.push({ category: 'camera', type: 'enabled', last_value: enabled });
  }
  return { service_id: SERVICE_ID, features };
}

describe('Camera.getLiveImagesInRoom', () => {
  let stateManager;
  let serviceManager;
  let deviceManager;

  beforeEach(() => {
    stateManager = new StateManager(event);
    serviceManager = new ServiceManager({}, stateManager);
    deviceManager = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return a live image of the camera of the room', async () => {
    const getImage = fake.resolves(LIVE_IMAGE);
    serviceManager.getServiceById = fake.returns({ device: { getImage } });
    stateManager.setState('device', 'test-camera', buildCameraState());

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(images).to.deep.equal([LIVE_IMAGE]);
    // the stored image is recent, the camera is asked for a new one anyway
    expect(getImage.callCount).to.equal(1);
  });

  it('should fall back to the recent stored image when the live image fails', async () => {
    serviceManager.getServiceById = fake.returns({ device: { getImage: fake.rejects(new Error('timeout')) } });
    stateManager.setState('device', 'test-camera', buildCameraState());

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(images).to.deep.equal([STORED_IMAGE]);
  });

  it('should return no image when the live image fails and the stored one is too old', async () => {
    serviceManager.getServiceById = fake.returns({ device: { getImage: fake.rejects(new Error('timeout')) } });
    stateManager.setState('device', 'test-camera', buildCameraState({ storedImageChanged: TWO_HOURS_AGO }));

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(images).to.deep.equal([]);
  });

  it('should neither ask a disabled camera nor return its stored image', async () => {
    const getImage = fake.resolves(LIVE_IMAGE);
    serviceManager.getServiceById = fake.returns({ device: { getImage } });
    stateManager.setState('device', 'test-camera', buildCameraState({ enabled: 0 }));

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(images).to.deep.equal([]);
    expect(getImage.called).to.equal(false);
  });

  it('should ask a camera whose enabled feature is on', async () => {
    serviceManager.getServiceById = fake.returns({ device: { getImage: fake.resolves(LIVE_IMAGE) } });
    stateManager.setState('device', 'test-camera', buildCameraState({ enabled: 1 }));

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(images).to.deep.equal([LIVE_IMAGE]);
  });

  it('should skip a camera missing from the state manager', async () => {
    serviceManager.getServiceById = fake.returns(null);

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(images).to.deep.equal([]);
    expect(serviceManager.getServiceById.called).to.equal(false);
  });

  it('should return no image for a room without camera', async () => {
    serviceManager.getServiceById = fake.returns(null);
    stateManager.setState('device', 'test-camera', buildCameraState());

    const images = await deviceManager.camera.getLiveImagesInRoom('a2b9ba3a-72f1-4a24-b268-25b8bb5e7ad3');

    expect(images).to.deep.equal([]);
    expect(serviceManager.getServiceById.called).to.equal(false);
  });

  it('should return the cameras of no room when the room is null', async () => {
    await db.Device.update({ room_id: null }, { where: { id: CAMERA_DEVICE_ID } });
    serviceManager.getServiceById = fake.returns({ device: { getImage: fake.resolves(LIVE_IMAGE) } });
    stateManager.setState('device', 'test-camera', buildCameraState());

    expect(await deviceManager.camera.getLiveImagesInRoom(ROOM_ID)).to.deep.equal([]);
    expect(await deviceManager.camera.getLiveImagesInRoom(null)).to.deep.equal([LIVE_IMAGE]);
  });

  it('should ask every camera of the room at the same time, each with its own fallback', async () => {
    await db.Device.create({
      id: 'b6b4c1a2-7f5e-4f3e-9a51-2a8f0c6e1d01',
      name: 'Test camera 2',
      selector: 'test-camera-2',
      external_id: 'test-camera-2-external',
      service_id: SERVICE_ID,
      room_id: ROOM_ID,
    });
    await db.DeviceFeature.create({
      name: 'Test camera 2 image',
      selector: 'test-camera-2-image',
      external_id: 'camera-2:image',
      category: 'camera',
      type: 'image',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 0,
      device_id: 'b6b4c1a2-7f5e-4f3e-9a51-2a8f0c6e1d01',
    });
    stateManager.setState('device', 'test-camera', { ...buildCameraState(), selector: 'test-camera' });
    stateManager.setState('device', 'test-camera-2', { ...buildCameraState(), selector: 'test-camera-2' });
    // Each request only settles once both cameras were asked: asked one after the other,
    // the first one would never settle and the test would time out.
    const pending = [];
    const getImage = fake((device) => {
      const request = new Promise((resolve, reject) => {
        pending.push(() => (device.selector === 'test-camera' ? resolve(LIVE_IMAGE) : reject(new Error('offline'))));
      });
      if (pending.length === 2) {
        pending.forEach((settle) => settle());
      }
      return request;
    });
    serviceManager.getServiceById = fake.returns({ device: { getImage } });

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(getImage.callCount).to.equal(2);
    expect([...images].sort()).to.deep.equal([LIVE_IMAGE, STORED_IMAGE].sort());
  });
});
