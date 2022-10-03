const EventEmitter = require('events');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const testService = {
  device: {
    setValue: fake.resolves(true),
  },
};

const service = {
  getService: () => testService,
};

const device = {
  service: {
    name: 'test',
  },
};

const deviceFeature = {
  id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
  selector: 'test-device-feature',
  has_feedback: false,
  keep_history: true,
};

describe('Light', () => {
  it('should turnOff the light', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, service, {}, {}, job);
    await deviceManager.lightManager.turnOff(device, deviceFeature);
    assert.calledWith(testService.device.setValue, device, deviceFeature, 0);
  });
});
