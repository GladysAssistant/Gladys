const { expect } = require('chai');
const { assert, stub, useFakeTimers } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { BadParameters } = require('../../../utils/coreErrors');

describe('Device.saveState', () => {
  it('should saveState and keep history', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const clock = useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    await device.saveState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      12,
    );
    assert.calledWith(event.emit.firstCall, 'websocket.send-all', {
      payload: {
        device_feature_selector: 'test-device-feature',
        last_value: 12,
        last_value_changed: new Date(),
      },
      type: 'device.new-state',
    });
    assert.calledWith(event.emit.secondCall, 'trigger.check', {
      device_feature: 'test-device-feature',
      last_value: 12,
      last_value_changed: new Date(),
      previous_value: null,
      type: 'device.new-state',
    });
    clock.restore();
  });
  it('should saveState and keep history and emit previous value of device', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const clock = useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
    });
    await device.saveState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      12,
    );
    assert.calledWith(event.emit.firstCall, 'websocket.send-all', {
      payload: {
        device_feature_selector: 'test-device-feature',
        last_value: 12,
        last_value_changed: new Date(),
      },
      type: 'device.new-state',
    });
    assert.calledWith(event.emit.secondCall, 'trigger.check', {
      device_feature: 'test-device-feature',
      last_value: 12,
      last_value_changed: new Date(),
      previous_value: 5,
      type: 'device.new-state',
    });
    clock.restore();
  });
  it('should saveState and not keep history', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    await device.saveState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: false,
      },
      12,
    );
  });
  // we want to make sure that inserting states at a face pace is working, and not causing concurrencies issues
  it('should insert 200 states in parallel', async function Test() {
    this.timeout(10000);
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const promises = [];
    for (let i = 0; i < 200; i += 1) {
      promises.push(
        device.saveState(
          {
            id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
            selector: 'test-device-feature',
            has_feedback: false,
            keep_history: true,
          },
          12,
        ),
      );
    }
    await Promise.all(promises);
  });
  it('should not save NaN as state', async () => {
    const event = {
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);

    const nanValue = parseInt('NaN value', 10);

    try {
      await device.saveState(
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
  it('should not save string state', async () => {
    const event = {
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);

    const stringValue = 'LOCK';

    try {
      await device.saveState(
        {
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          selector: 'test-device-feature',
          has_feedback: false,
          keep_history: false,
        },
        // @ts-ignore
        stringValue,
      );
      assert.fail('String device state should fail');
    } catch (e) {
      expect(e.toString()).to.equal(
        'SequelizeValidationError: Validation error: Validation isFloat on last_value failed',
      );
    }
  });
});
