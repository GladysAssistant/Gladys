const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, stub } = sinon;

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const Brain = require('../../../lib/brain');
const Variable = require('../../../lib/variable');
const { SYSTEM_VARIABLE_NAMES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');
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
    await brain.load();
  });
  [false, '0', 'false', null].forEach((disabledValue) => {
    it(`should do nothing if is not enabled (value = ${JSON.stringify(disabledValue)})`, async () => {
      const stateManager = new StateManager(event);
      const service = {
        getService: () => null,
      };
      const variables = {
        getValue: () => disabledValue,
      };
      const messageManager = {
        sendToUser: stub().returns(null),
      };
      const device = new Device(event, messageManager, stateManager, service, {}, variables, job, {}, user);

      await device.checkBatteries();

      assert.notCalled(user.getByRole);
      assert.notCalled(messageManager.sendToUser);
    });
  });
  it('should do nothing if disabled in the settings (value stored as text)', async () => {
    const variables = new Variable(event);
    // the settings page saves a JSON boolean, stored as '0' in the TEXT column
    await variables.setValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED, false);
    await variables.setValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD, '30');
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const messageManager = {
      sendToUser: stub().returns(null),
    };
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, brain, user);

    await device.checkBatteries();

    assert.notCalled(messageManager.sendToUser);
  });
  it('should send a message if enabled in the settings (value stored as text)', async () => {
    const variables = new Variable(event);
    // the settings page saves a JSON boolean, stored as '1' in the TEXT column
    await variables.setValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED, true);
    await variables.setValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD, '30');
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
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
  describe('when sending the message to one admin fails', () => {
    const twoAdmins = {
      getByRole: stub().resolves([
        { selector: 'admin-1', language: 'fr' },
        { selector: 'admin-2', language: 'fr' },
      ]),
    };
    const variables = {
      getValue: (key) => {
        if (key === SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED) {
          return '1';
        }
        return 30;
      },
    };
    const createMessageManager = (sentTo) => ({
      // resolves later: sentTo is only filled when checkBatteries waits for the sends
      sendToUser: stub().callsFake(async (selector) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        if (selector === 'admin-1') {
          throw new NotFoundError(`User ${selector} not found`);
        }
        sentTo.push(selector);
      }),
    });
    it('should still warn the other admins when the battery is lower than threshold', async () => {
      const sentTo = [];
      const messageManager = createMessageManager(sentTo);
      const stateManager = new StateManager(event);
      const service = {
        getService: () => null,
      };
      const device = new Device(event, messageManager, stateManager, service, {}, variables, job, brain, twoAdmins);

      await device.checkBatteries();

      assert.calledTwice(messageManager.sendToUser);
      expect(sentTo).to.deep.equal(['admin-2']);
    });
    it('should still warn the other admins when the battery is low', async () => {
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
      const sentTo = [];
      const messageManager = createMessageManager(sentTo);
      const stateManager = new StateManager(event);
      const service = {
        getService: () => null,
      };
      const device = new Device(event, messageManager, stateManager, service, {}, variables, job, brain, twoAdmins);

      await device.checkBatteries();

      assert.calledTwice(messageManager.sendToUser);
      expect(sentTo).to.deep.equal(['admin-2']);
    });
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
