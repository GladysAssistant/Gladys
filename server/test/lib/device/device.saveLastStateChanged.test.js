const { assert, stub, useFakeTimers } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

describe.only('Device.saveLastStateChanged', () => {
  it('should saveLastStateChanged', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const clock = useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager);
    await device.saveLastStateChanged({
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      selector: 'test-device-feature',
      has_feedback: false,
    });
    assert.calledWith(event.emit.firstCall, 'websocket.send-all', {
      payload: {
        device_feature_selector: 'test-device-feature',
        last_value_changed: new Date(),
      },
      type: 'device.new-state-no-changed',
    });
    clock.restore();
  });
});
