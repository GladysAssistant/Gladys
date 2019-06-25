const EventEmitter = require('events');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device', () => {
  it('should saveState and keep history', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager);
    await device.saveState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      12,
    );
  });
  it('should saveState and not keep history', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager);
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
});
