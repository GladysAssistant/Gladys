const sinon = require('sinon');

const { assert } = sinon;

const EventEmitter = require('events');
const { expect } = require('chai');

const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { NotFoundError } = require('../../../utils/coreErrors');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.newStateEvent', () => {
  it('should save new sate', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeatureByExternalId', 'hue:binary:1', {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      name: 'Test device feature',
      selector: 'test-device-feature',
      external_id: 'hue:binary:1',
      category: 'light',
      type: 'binary',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
      last_value: 0,
      last_value_changed: '2019-02-12 07:49:07.556 +00:00',
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    });
    stateManager.setState('deviceById', '7f85c2f8-86cc-4600-84db-6c074dadb4e8', {});
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    await device.newStateEvent({ device_feature_external_id: 'hue:binary:1', state: 12 });
    const newDeviceFeature = stateManager.get('deviceFeature', 'test-device-feature');
    expect(newDeviceFeature).to.have.property('last_value', 12);
  });
  it('should save new string state', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeatureByExternalId', 'hue:binary:1', {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      name: 'Test device feature',
      selector: 'test-device-feature',
      external_id: 'hue:binary:1',
      category: 'light',
      type: 'binary',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
      last_value_string: null,
      last_value_changed: '2019-02-12 07:49:07.556 +00:00',
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    });
    stateManager.setState('deviceById', '7f85c2f8-86cc-4600-84db-6c074dadb4e8', {});
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    await device.newStateEvent({ device_feature_external_id: 'hue:binary:1', text: 'my-text' });
    const newDeviceFeature = stateManager.get('deviceFeatureByExternalId', 'hue:binary:1');
    expect(newDeviceFeature).to.have.property('last_value_string', 'my-text');
  });
  it('should save new historical state', async () => {
    const stateManager = new StateManager(event);
    const currentDeviceFeature = {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      name: 'Test device feature',
      selector: 'test-device-feature',
      external_id: 'hue:binary:1',
      category: 'light',
      type: 'binary',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
      last_value: 120,
      last_value_changed: '2019-02-12 07:49:07.556 +00:00',
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    };
    stateManager.setState('deviceById', '7f85c2f8-86cc-4600-84db-6c074dadb4e8', {});
    stateManager.setState('deviceFeatureByExternalId', 'hue:binary:1', currentDeviceFeature);
    stateManager.setState('deviceFeature', 'test-device-feature', currentDeviceFeature);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const dateInThePast = new Date();
    dateInThePast.setFullYear(2010);
    await device.newStateEvent({
      device_feature_external_id: 'hue:binary:1',
      state: 12,
      created_at: dateInThePast.toISOString(),
    });
    const newDeviceFeature = stateManager.get('deviceFeatureByExternalId', 'hue:binary:1');
    expect(newDeviceFeature).to.have.property('last_value', 120);
    expect(newDeviceFeature).to.have.property('last_value_changed', '2019-02-12 07:49:07.556 +00:00');
  });
  it('should save new historical state in the future', async () => {
    const stateManager = new StateManager(event);
    const currentDeviceFeature = {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      name: 'Test device feature',
      selector: 'test-device-feature',
      external_id: 'hue:binary:1',
      category: 'light',
      type: 'binary',
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
      last_value: 120,
      last_value_changed: '2019-02-12 07:49:07.556 +00:00',
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    };
    stateManager.setState('deviceById', '7f85c2f8-86cc-4600-84db-6c074dadb4e8', {});
    stateManager.setState('deviceFeatureByExternalId', 'hue:binary:1', currentDeviceFeature);
    stateManager.setState('deviceFeature', 'test-device-feature', currentDeviceFeature);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const dateInTheFuture = new Date();
    await device.newStateEvent({
      device_feature_external_id: 'hue:binary:1',
      state: 12,
      created_at: dateInTheFuture.toISOString(),
    });
    const newDeviceFeature = stateManager.get('deviceFeatureByExternalId', 'hue:binary:1');
    expect(newDeviceFeature).to.have.property('last_value', 12);
    expect(newDeviceFeature).to.have.property('last_value_changed');
    expect(newDeviceFeature.last_value_changed).to.deep.equal(dateInTheFuture);
  });
  it('should not save state missing device feature', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    try {
      await device.newStateEvent({
        device_feature_external_id: 'hue:binary:1',
        state: 12,
        created_at: '2019-02-12 07:49:07.556 +00:00',
      });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
    const newDeviceFeature = stateManager.get('deviceFeatureByExternalId', 'hue:binary:1');
    // eslint-disable-next-line no-unused-expressions
    expect(newDeviceFeature).to.be.null;
  });
  it('should not save state missing device', async () => {
    const stateManager = new StateManager(event);
    const currentDeviceFeature = {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      name: 'Test device feature',
      selector: 'test-device-feature',
      external_id: 'hue:binary:1',
      device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
    };
    stateManager.setState('deviceFeatureByExternalId', 'hue:binary:1', currentDeviceFeature);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    try {
      await device.newStateEvent({
        device_feature_external_id: 'hue:binary:1',
        state: 12,
        created_at: '2019-02-12 07:49:07.556 +00:00',
      });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
    const newDeviceFeature = stateManager.get('deviceFeatureByExternalId', 'hue:binary:1');
    expect(newDeviceFeature).not.to.have.property('last_value');
    expect(newDeviceFeature).not.to.have.property('last_value_changed');
    const newDevice = stateManager.get('deviceById', '7f85c2f8-86cc-4600-84db-6c074dadb4e8');
    // eslint-disable-next-line no-unused-expressions
    expect(newDevice).to.be.null;
  });
});
