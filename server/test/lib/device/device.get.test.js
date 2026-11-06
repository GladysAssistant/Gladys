const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const db = require('../../../models');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.get', () => {
  let device;
  beforeEach(() => {
    const stateManager = new StateManager(event);
    const service = {
      getLocalServiceByName: fake.resolves({
        id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      }),
    };
    const variable = {
      getValue: fake.resolves('5'),
    };
    device = new Device(event, {}, stateManager, service, {}, variable, job);
  });
  it('should get devices', async () => {
    const devices = await device.get();
    expect(devices).to.be.instanceOf(Array);
  });
  it('should get devices filtered by service', async () => {
    const devices = await device.get({
      service: 'test-service',
    });
    expect(devices).to.be.instanceOf(Array);
  });
  it('should get devices with last_value_is_too_old', async () => {
    const devices = await device.get();
    expect(devices).to.be.instanceOf(Array);
    devices.forEach((oneDevice) => {
      oneDevice.features.forEach((feature) => {
        expect(feature).to.have.property('last_value_is_too_old');
      });
    });
  });
  it('should get devices with last_value_is_too_old', async () => {
    device.variable.getValue = fake.resolves(null);
    const devices = await device.get();
    expect(devices).to.be.instanceOf(Array);
    devices.forEach((oneDevice) => {
      oneDevice.features.forEach((feature) => {
        expect(feature).to.have.property('last_value_is_too_old');
      });
    });
  });
  it('should get devices filtered by service and name', async () => {
    const devices = await device.get({
      service: 'test-service',
      search: 'this name does not exist',
    });
    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(0);
  });
  it('should get devices filtered by model', async () => {
    const devices = await device.get({
      model: 'my-unknown-model',
    });
    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(0);
  });
  it('should get devices filtered by device_feature_category', async () => {
    const devices = await device.get({
      device_feature_category: 'my-unknown-category',
    });
    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(0);
  });
  it('should get devices filtered by device_feature_categories', async () => {
    const devices = await device.get({
      device_feature_categories: ['temperature-sensor', 'humidity-sensor'],
    });
    expect(devices).to.be.instanceOf(Array);
    // Verify that features are filtered
    devices.forEach((oneDevice) => {
      oneDevice.features.forEach((feature) => {
        expect(feature.category).to.be.oneOf(['temperature-sensor', 'humidity-sensor']);
      });
    });
  });
  it('should get devices filtered by device_feature_type', async () => {
    const devices = await device.get({
      device_feature_type: 'my-unknown-type',
    });
    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(0);
  });
  it('should get devices filtered by device_feature_selectors', async () => {
    const devices = await device.get({
      device_feature_selectors: 'test-device-feature,test-camera-image',
    });
    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(2);
  });
  it('should return 0 device (take=0)', async () => {
    const devices = await device.get({
      take: 0,
    });
    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(0);
  });
  it('should not return the camera image in last_value_string', async () => {
    const cameraFeature = await db.DeviceFeature.findOne({ where: { category: 'camera', type: 'image' } });
    await cameraFeature.update({ last_value_string: 'data:image/png;base64,AAAA' });
    const devices = await device.get();
    const features = devices.reduce((acc, oneDevice) => acc.concat(oneDevice.features), []);
    const cameraFeatures = features.filter((f) => f.category === 'camera' && f.type === 'image');
    expect(cameraFeatures).to.have.length.greaterThan(0);
    cameraFeatures.forEach((f) => {
      expect(f.last_value_string).to.equal(null);
      expect(f).to.have.property('last_value_changed');
    });
    const stored = await db.DeviceFeature.findOne({ where: { id: cameraFeature.id } });
    expect(stored.last_value_string).to.equal('data:image/png;base64,AAAA');
  });
  it('should throw not found error', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getLocalServiceByName: fake.resolves(null),
    };
    const deviceBroken = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = deviceBroken.get({
      service: 'not-found-service',
    });
    return assert.isRejected(promise);
  });
});
