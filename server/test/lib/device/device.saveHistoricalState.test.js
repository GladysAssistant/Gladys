const EventEmitter = require('events');
const { assert, expect } = require('chai');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const { BadParameters } = require('../../../utils/coreErrors');

const event = new EventEmitter();
const job = new Job(event);

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

    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    const testDevice = await device.getBySelector('test-device');

    const deviceFeature = testDevice.features[0];
    const updateDate = new Date().toISOString();
    const historicalState = 20;

    await device.saveHistoricalState(deviceFeature, historicalState, updateDate);

    return assert.equal(deviceFeature.last_value_changed, updateDate);
  });

  it('should save historical sate on feature without state', async () => {
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

    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    const testDevice = await device.getBySelector('test-device');

    const deviceFeature = testDevice.features[0];
    const updateDate = new Date().toISOString();
    const historicalState = 20;

    await device.saveHistoricalState(deviceFeature, historicalState, updateDate);

    return assert.equal(deviceFeature.last_value_changed, updateDate);
  });

  it('should not save NaN as state', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);

    const nanValue = parseInt('NaN value', 10);

    try {
      await device.saveHistoricalState(
        {
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          selector: 'test-device-feature',
          has_feedback: false,
          keep_history: false,
        },
        nanValue,
      );
      assert.fail('NaN device state should fail');
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });
});
