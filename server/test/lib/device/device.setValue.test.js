const EventEmitter = require('events');
const sinon = require('sinon').createSandbox();
const { assert } = require('chai');

const { fake, assert: sinonAssert } = sinon;

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

describe('Device', () => {
  afterEach(() => {
    sinon.reset();
  });
  it('should throw an error, service does not exist', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = device.setValue(
      {
        service: {
          name: 'doesnotexist',
        },
        external_id: 'test',
      },
      {},
      1,
    );
    return assert.isRejected(promise, 'Service doesnotexist was not found.');
  });
  it('should throw an error, function setValue not found', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => {},
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = device.setValue(
      {
        service: {
          name: 'my-service',
        },
        external_id: 'test',
      },
      {},
      1,
    );
    return assert.isRejected(promise, 'Function device.setValue in service my-service does not exist.');
  });
  it('should save numeric state when device has no feedback', async () => {
    const stateManager = new StateManager(event);
    const serviceSetValue = fake.resolves(null);
    const service = {
      getService: () => ({
        device: {
          setValue: serviceSetValue,
        },
      }),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.saveState = fake.resolves(null);
    device.saveStringState = fake.resolves(null);
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      has_feedback: false,
    };
    await device.setValue({ service: { name: 'my-service' } }, deviceFeature, 1);
    sinonAssert.calledWith(serviceSetValue, { service: { name: 'my-service' } }, deviceFeature, 1);
    sinonAssert.calledWith(device.saveState, deviceFeature, 1);
    sinonAssert.notCalled(device.saveStringState);
  });
  it('should save string state when setting a text value on a text feature', async () => {
    const stateManager = new StateManager(event);
    const serviceSetValue = fake.resolves(null);
    const service = {
      getService: () => ({
        device: {
          setValue: serviceSetValue,
        },
      }),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.saveState = fake.resolves(null);
    device.saveStringState = fake.resolves(null);
    const gladysDevice = { service: { name: 'my-service' } };
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TEXT,
      type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
      has_feedback: false,
    };
    await device.setValue(gladysDevice, deviceFeature, 'The meal is ready!');
    sinonAssert.calledWith(serviceSetValue, gladysDevice, deviceFeature, 'The meal is ready!');
    sinonAssert.calledWith(device.saveStringState, gladysDevice, deviceFeature, 'The meal is ready!');
    sinonAssert.notCalled(device.saveState);
  });
  it('should not save string state on a text feature with feedback', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => ({
        device: {
          setValue: fake.resolves(null),
        },
      }),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.saveState = fake.resolves(null);
    device.saveStringState = fake.resolves(null);
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TEXT,
      type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
      has_feedback: true,
    };
    await device.setValue({ service: { name: 'my-service' } }, deviceFeature, 'The meal is ready!');
    sinonAssert.notCalled(device.saveStringState);
    sinonAssert.notCalled(device.saveState);
  });
  it('should not save a string value sent to a non-text feature', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => ({
        device: {
          setValue: fake.resolves(null),
        },
      }),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.saveState = fake.resolves(null);
    device.saveStringState = fake.resolves(null);
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.MUSIC,
      type: DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION,
      has_feedback: false,
    };
    await device.setValue({ service: { name: 'my-service' } }, deviceFeature, 'http://example.com/notification.mp3');
    sinonAssert.notCalled(device.saveStringState);
    sinonAssert.notCalled(device.saveState);
  });
});
