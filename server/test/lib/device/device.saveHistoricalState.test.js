const EventEmitter = require('events');
const { assert } = require('chai');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device saveHistoricalState', () => {
  it('should save historical sate (new state)', async () => {
    const testFeature = {
      id: '5smd05fc-1736-4b76-99ca-5812329sm036',
      name: 'Test feature test',
      selector: 'test-feature',
      external_id: 'feature:test',
      category: 'feature',
      type: 'weight',
      unit: null,
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 0,
      last_value: null,
      last_value_string: '10',
      last_value_changed: new Date(2019, 2, 11, 5, 23, 59),
      device_id: 'fdfmb47f-4d25-4381-8923-2633b23192sm',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    };

    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      id: 'fdfmb47f-4d25-4381-8923-2633b23192sm',
      name: 'test',
      features: [testFeature],
    });
    stateManager.setState('deviceFeature', 'test-feature', testFeature);

    const device = new Device(event, {}, stateManager);
    const testDevice = await device.getBySelector('test-device');

    const deviceFeature = testDevice.features[0];
    const updateDate = new Date().toISOString();
    const historicalState = 20;

    await device.saveHistoricalState(deviceFeature, historicalState, updateDate);

    return assert.equal(deviceFeature.last_value_changed, updateDate);
  });
});
