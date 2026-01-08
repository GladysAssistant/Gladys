const EventEmitter = require('events');
const { assert, stub } = require('sinon');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const Brain = require('../../../lib/brain');
const { SYSTEM_VARIABLE_NAMES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');
const db = require('../../../models');

const event = new EventEmitter();
const job = new Job(event);

const user = {
  getByRole: stub().returns([{ selector: 'admin', language: 'fr' }]),
};

describe('Device check batteries', () => {
  let brain;
  before(async () => {
    brain = new Brain();
    await brain.train();
  });
  it('should do nothing if is not enabled', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const variables = {
      getValue: () => false,
    };
    const messageManager = {
      sendToUser: stub().returns(null),
    };
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, {}, user);

    await device.checkBatteries();

    assert.notCalled(user.getByRole);
    assert.notCalled(messageManager.sendToUser);
  });
  it('should do nothing if the threshold is not set', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const variables = {
      getValue: (key) => {
        if (key === SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED) {
          return true;
        }
        return undefined;
      },
    };
    const messageManager = {
      sendToUser: stub().returns(null),
    };
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, {}, user);

    await device.checkBatteries();

    assert.notCalled(messageManager.sendToUser);
  });
  it('should send a message if battery is lower than threshold', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const variables = {
      getValue: (key) => {
        if (key === SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED) {
          return true;
        }
        return 30;
      },
    };
    const messageManager = {
      sendToUser: stub().returns(null),
    };
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, brain, user);

    await device.checkBatteries();

    assert.calledWith(
      messageManager.sendToUser,
      'admin',
      'Avertissement ! Le niveau de la batterie de Test device est inférieur à 30% (actuel : 20%)',
    );
  });
  it('should send a message if battery is low', async () => {
    // Update the feature to be a "battery low" feature
    const feature = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature-battery',
      },
    });
    await feature.update({
      last_value: 1,
      category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
      type: DEVICE_FEATURE_TYPES.BINARY,
    });
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const variables = {
      getValue: (key) => {
        if (key === SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED) {
          return true;
        }
        return 30;
      },
    };
    const messageManager = {
      sendToUser: stub().returns(null),
    };
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, brain, user);

    await device.checkBatteries();

    assert.calledWith(
      messageManager.sendToUser,
      'admin',
      'Avertissement ! Le niveau de la batterie de Test device est faible !',
    );
  });
  it('should do nothing is battery level is null', async () => {
    // set the battery to null
    const feature = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature-battery',
      },
    });
    await feature.update({
      last_value: null,
      last_value_changed: null,
    });
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const messageManager = {
      sendToUser: stub().returns(null),
    };
    const variables = {
      getValue: (key) => {
        if (key === SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED) {
          return true;
        }
        return 30;
      },
    };
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, {}, user);

    await device.checkBatteries();

    assert.notCalled(messageManager.sendToUser);
  });
});
