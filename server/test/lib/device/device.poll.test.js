const EventEmitter = require('events');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const { assert } = require('chai');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

const testService = {
  device: {
    poll: fake.resolves(true),
  },
};

const testServiceBroken = {
  device: {
    poll: fake.rejects(true),
  },
};

describe('Device', () => {
  it('should poll device', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testService,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    await device.poll({
      service: {
        name: 'test',
      },
    });
  });
  it('should poll device with error', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testServiceBroken,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    await device.poll({
      service: {
        name: 'test',
      },
    });
  });
  it('should not poll device, service does not exist', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = device.poll({
      service: {
        name: 'doesnotexist',
      },
    });
    return assert.isRejected(promise, 'Service doesnotexist was not found.');
  });
  it('should not poll a disabled camera', async () => {
    const stateManager = new StateManager(event);
    const pollFake = fake.resolves(true);
    const service = {
      getService: () => ({ device: { poll: pollFake } }),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    await device.poll({
      selector: 'disabled-camera',
      service: {
        name: 'rtsp-camera',
      },
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.CAMERA,
          type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
          last_value: 0,
        },
      ],
    });
    sinonAssert.notCalled(pollFake);
  });
  it('should poll an enabled camera', async () => {
    const stateManager = new StateManager(event);
    const pollFake = fake.resolves(true);
    const service = {
      getService: () => ({ device: { poll: pollFake } }),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    await device.poll({
      selector: 'enabled-camera',
      service: {
        name: 'rtsp-camera',
      },
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.CAMERA,
          type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
          last_value: 1,
        },
      ],
    });
    sinonAssert.calledOnce(pollFake);
  });
  it('should not poll device, service does not have a poll function', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => ({}),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = device.poll({
      service: {
        name: 'doesnotexist',
      },
    });
    return assert.isRejected(promise, 'Service doesnotexist does not have a device.poll function.');
  });
});
