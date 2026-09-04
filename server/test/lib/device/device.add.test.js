const EventEmitter = require('events');
const { expect } = require('chai');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);
const service = {
  getService: () => null,
};

const buildDevice = (lastValue) => ({
  id: 'device-id',
  selector: 'plug',
  external_id: 'plug-external-id',
  features: [
    {
      id: 'feature-id',
      selector: 'plug-binary',
      external_id: 'plug-binary-external-id',
      category: 'switch',
      type: 'binary',
      last_value: lastValue,
    },
  ],
  params: [],
});

describe('Device.add', () => {
  it('should load the device and its features in RAM', () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, service, {}, {}, job);
    const device = buildDevice(0);
    deviceManager.add(device);
    expect(stateManager.get('device', 'plug')).to.equal(device);
    expect(stateManager.get('deviceById', 'device-id')).to.equal(device);
    expect(stateManager.get('deviceByExternalId', 'plug-external-id')).to.equal(device);
    expect(stateManager.get('deviceFeature', 'plug-binary')).to.equal(device.features[0]);
    expect(stateManager.get('deviceFeatureById', 'feature-id')).to.equal(device.features[0]);
    expect(stateManager.get('deviceFeatureByExternalId', 'plug-binary-external-id')).to.equal(device.features[0]);
  });
  it('should keep the device features in sync with the feature store after the device is saved again', () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, service, {}, {}, job);
    deviceManager.add(buildDevice(0));
    // the device is saved again (edited in the UI, re-discovered by an integration):
    // device.create loads a fresh object from the DB and adds it again
    const updatedDevice = buildDevice(0);
    updatedDevice.name = 'Renamed plug';
    updatedDevice.features[0].name = 'Renamed feature';
    deviceManager.add(updatedDevice);
    // then a new state arrives, as device.saveState stores it
    stateManager.setState('deviceFeature', 'plug-binary', {
      last_value: 1,
      last_value_changed: new Date(),
    });
    const deviceInRam = stateManager.get('device', 'plug');
    const featureInRam = stateManager.get('deviceFeature', 'plug-binary');
    expect(deviceInRam.name).to.equal('Renamed plug');
    expect(deviceInRam.features[0]).to.equal(featureInRam);
    expect(deviceInRam.features[0].name).to.equal('Renamed feature');
    expect(deviceInRam.features[0].last_value).to.equal(1);
    expect(stateManager.get('deviceById', 'device-id').features[0].last_value).to.equal(1);
    expect(stateManager.get('deviceFeatureById', 'feature-id')).to.equal(featureInRam);
    expect(stateManager.get('deviceFeatureByExternalId', 'plug-binary-external-id')).to.equal(featureInRam);
  });
  it('should keep the same feature objects when the device already in RAM is added again', () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, service, {}, {}, job);
    const device = buildDevice(0);
    deviceManager.add(device);
    // device.addFeature adds again the very device object it read from the store
    deviceManager.add(device);
    expect(stateManager.get('device', 'plug')).to.equal(device);
    expect(stateManager.get('deviceFeature', 'plug-binary')).to.equal(device.features[0]);
  });
  it('should add a feature which was not in RAM yet when the device is saved again', () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, service, {}, {}, job);
    deviceManager.add(buildDevice(0));
    const updatedDevice = buildDevice(0);
    updatedDevice.features.push({
      id: 'new-feature-id',
      selector: 'plug-power',
      external_id: 'plug-power-external-id',
      category: 'switch',
      type: 'power',
      last_value: null,
    });
    deviceManager.add(updatedDevice);
    const deviceInRam = stateManager.get('device', 'plug');
    expect(deviceInRam.features).to.have.lengthOf(2);
    expect(deviceInRam.features[1]).to.equal(stateManager.get('deviceFeature', 'plug-power'));
    stateManager.setState('deviceFeature', 'plug-power', { last_value: 12 });
    expect(deviceInRam.features[1].last_value).to.equal(12);
  });
});
