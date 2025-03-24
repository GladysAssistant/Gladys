const EventEmitter = require('events');
const { assert, fake } = require('sinon');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

const testService = {
  device: {
    setValue: fake.resolves(true),
  },
};

const testServiceBroken = {
  device: {
    setValue: fake.rejects(true),
  },
};

const service = {
  getService: () => testService,
};

const serviceBroken = {
  getService: () => testServiceBroken,
};

const message = {
  text: 'turn on the switch test device',
};

const context = {};

describe('switch.command', () => {
  it('should send a turn on command', async () => {
    const stateManager = new StateManager(event);
    const messageManager = {
      replyByIntent: fake.resolves(true),
    };
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    stateManager.setState('device', 'test-device', {
      selector: 'test-device',
      service: {
        name: 'mqtt',
      },
      features: [
        {
          has_feedback: true,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
      ],
    });
    await deviceManager.switchManager.command(
      message,
      {
        intent: 'switch.turn-on',
        entities: [
          {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'device',
            type: 'enum',
            option: 'test-device',
            sourceText: 'test device',
            utteranceText: 'test device',
          },
        ],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'switch.turn-on.success', context);
    assert.called(testService.device.setValue);
  });
  it('should send a turn off command', async () => {
    const stateManager = new StateManager(event);
    const messageManager = {
      replyByIntent: fake.resolves(true),
    };
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    stateManager.setState('device', 'test-device', {
      selector: 'test-device',
      service: {
        name: 'mqtt',
      },
      features: [
        {
          has_feedback: true,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
      ],
    });
    await deviceManager.switchManager.command(
      message,
      {
        intent: 'switch.turn-off',
        entities: [
          {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'device',
            type: 'enum',
            option: 'test-device',
            sourceText: 'test device',
            utteranceText: 'test device',
          },
        ],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'switch.turn-off.success', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a turn on command (service is not responding)', async () => {
    const stateManager = new StateManager(event);
    const messageManager = {
      replyByIntent: fake.resolves(true),
    };
    const deviceManager = new Device(event, messageManager, stateManager, serviceBroken, {}, {}, job);
    stateManager.setState('device', 'test-device', {
      selector: 'test-device',
      service: {
        name: 'mqtt',
      },
      features: [
        {
          has_feedback: true,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
      ],
    });
    await deviceManager.switchManager.command(
      message,
      {
        intent: 'switch.turn-on',
        entities: [
          {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'device',
            type: 'enum',
            option: 'test-device',
            sourceText: 'test device',
            utteranceText: 'test device',
          },
        ],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'switch.turn-on.fail', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send turn on command (device not found)', async () => {
    const stateManager = new StateManager(event);
    const messageManager = {
      replyByIntent: fake.resolves(true),
    };
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    await deviceManager.switchManager.command(
      message,
      {
        intent: 'switch.turn-on',
        entities: [
          {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'device',
            type: 'enum',
            option: 'test-device',
            sourceText: 'test device',
            utteranceText: 'test device',
          },
        ],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'switch.turn-on.fail', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send turn on command (no entities found)', async () => {
    const stateManager = new StateManager(event);
    const messageManager = {
      replyByIntent: fake.resolves(true),
    };
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    await deviceManager.switchManager.command(
      message,
      {
        intent: 'switch.turn-on',
        entities: [],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'switch.turn-on.fail', context);
    assert.called(testService.device.setValue);
  });
  it('should fail to send a turn on command (feature not found)', async () => {
    const stateManager = new StateManager(event);
    const messageManager = {
      replyByIntent: fake.resolves(true),
    };
    const deviceManager = new Device(event, messageManager, stateManager, service, {}, {}, job);
    stateManager.setState('device', 'test-device', {
      selector: 'test-device',
      service: {
        name: 'mqtt',
      },
      features: [],
    });
    await deviceManager.switchManager.command(
      message,
      {
        intent: 'switch.turn-on',
        entities: [
          {
            start: 25,
            end: 31,
            len: 7,
            levenshtein: 0,
            accuracy: 1,
            entity: 'device',
            type: 'enum',
            option: 'test-device',
            sourceText: 'test device',
            utteranceText: 'test device',
          },
        ],
      },
      context,
    );
    assert.calledWith(messageManager.replyByIntent, message, 'switch.turn-on.fail', context);
    assert.called(testService.device.setValue);
  });
});
