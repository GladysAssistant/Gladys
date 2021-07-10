const { expect } = require('chai');
const EventEmitter = require('events');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device', () => {
  it('should save new sate', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceById', '7f85c2f8-86cc-4600-84db-6c074dadb4e8', {});
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
    const device = new Device(event, {}, stateManager);
    await device.newStringStateEvent({ device_feature_external_id: 'hue:binary:1', state: 'string_value' });

    const updatedFeature = stateManager.get('deviceFeature', 'test-device-feature');
    expect(updatedFeature.last_value).eq(0);
    expect(updatedFeature.last_value_string).eq('string_value');
  });
});
