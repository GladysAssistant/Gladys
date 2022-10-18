const EventEmitter = require('events');
const { fake } = require('sinon');
const Device = require('../../../lib/device');
const { DEVICE_POLL_FREQUENCIES } = require('../../../utils/constants');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const testService = {
  device: {
    poll: fake.resolves(true),
  },
};

describe('Device', () => {
  it('should setup poll', () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testService,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.setupPoll();
  });
  it('should poll all', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testService,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES.EVERY_MINUTES] = [
      {
        service: {
          name: 'test',
        },
      },
    ];
    await device.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_MINUTES)();
  });
  it('should poll all (empty frequency)', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testService,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES.EVERY_MINUTES] = [
      {
        service: {
          name: 'test',
        },
      },
    ];
    await device.pollAll(10)();
  });
});
