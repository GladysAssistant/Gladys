const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');
const ServiceManager = require('../../../../lib/service');
const db = require('../../../../models');
const logger = require('../../../../utils/logger');
const { MAX_LIVE_IMAGES_IN_PARALLEL } = require('../../../../lib/device/camera/camera.getLiveImagesInRoom');

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

/**
 * @description Create one more camera in the seeded room, with its camera/image feature.
 * @param {number} index - Number of the camera, used in its id and selector.
 * @returns {Promise<string>} Resolve with the selector of the camera.
 * @example
 * await createCameraInRoom(2);
 */
async function createCameraInRoom(index) {
  const deviceId = `b6b4c1a2-7f5e-4f3e-9a51-2a8f0c6e1d0${index}`;
  const selector = `test-camera-${index}`;
  await db.Device.create({
    id: deviceId,
    name: `Test camera ${index}`,
    selector,
    external_id: `${selector}-external`,
    service_id: SERVICE_ID,
    room_id: ROOM_ID,
  });
  await db.DeviceFeature.create({
    name: `Test camera ${index} image`,
    selector: `${selector}-image`,
    external_id: `camera-${index}:image`,
    category: 'camera',
    type: 'image',
    read_only: false,
    has_feedback: false,
    min: 0,
    max: 0,
    device_id: deviceId,
  });
  return selector;
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
    await createCameraInRoom(2);
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

  it('should return no image and ask nothing when the room is undefined', async () => {
    serviceManager.getServiceById = fake.returns(null);
    stateManager.setState('device', 'test-camera', buildCameraState());

    // Sequelize would drop an undefined condition and select every camera of the house
    const images = await deviceManager.camera.getLiveImagesInRoom(undefined);

    expect(images).to.deep.equal([]);
    expect(serviceManager.getServiceById.called).to.equal(false);
  });

  it('should not return the picture of a camera disabled while it was taken, nor its stored one', async () => {
    const getImage = fake(async () => {
      // the user turns on the private mode during the capture
      stateManager.setState('device', 'test-camera', buildCameraState({ enabled: 0 }));
      return LIVE_IMAGE;
    });
    serviceManager.getServiceById = fake.returns({ device: { getImage } });
    stateManager.setState('device', 'test-camera', buildCameraState({ enabled: 1 }));

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(getImage.callCount).to.equal(1);
    expect(images).to.deep.equal([]);
  });

  [
    ['no service', null],
    ['a service without device', {}],
    ['a service whose device cannot take a picture', { device: {} }],
  ].forEach(([label, service]) => {
    it(`should use the stored image without warning for ${label}`, async () => {
      const warn = sinon.stub(logger, 'warn');
      serviceManager.getServiceById = fake.returns(service);
      stateManager.setState('device', 'test-camera', buildCameraState());

      const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

      expect(images).to.deep.equal([STORED_IMAGE]);
      // a camera that publishes its images (MQTT) is not an error on every request
      expect(warn.called).to.equal(false);
    });
  });

  it('should ask a few cameras at a time in a room with many cameras', async () => {
    const selectors = ['test-camera'];
    for (let index = 2; index <= MAX_LIVE_IMAGES_IN_PARALLEL + 2; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      selectors.push(await createCameraInRoom(index));
    }
    selectors.forEach((selector) => stateManager.setState('device', selector, { ...buildCameraState(), selector }));
    let inFlight = 0;
    let maxInFlight = 0;
    const getImage = fake(async (device) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      inFlight -= 1;
      return `image/jpg;base64,${device.selector}`;
    });
    serviceManager.getServiceById = fake.returns({ device: { getImage } });

    const images = await deviceManager.camera.getLiveImagesInRoom(ROOM_ID);

    expect(getImage.callCount).to.equal(selectors.length);
    expect(maxInFlight).to.equal(MAX_LIVE_IMAGES_IN_PARALLEL);
    expect([...images].sort()).to.deep.equal(selectors.map((selector) => `image/jpg;base64,${selector}`).sort());
  });
});
