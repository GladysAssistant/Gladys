const EventEmitter = require('events');
const { assert, stub } = require('sinon');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

const user = {
  getByRole: stub().returns([{ selector: 'admin', language: 'fr' }]),
};

const messageManager = {
  sendToUser: stub().returns(null),
};

describe('Device check batteries', () => {
  it('should do nothing if is not enabled', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const variables = {
      getValue: () => false,
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
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, {}, user);

    await device.checkBatteries();

    assert.notCalled(messageManager.sendToUser);
  });
  it('should send a message if battery is low', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const brain = {
      getReply: () => 'Avertissement !!! Le niveau de la batterie de Test device est inférieur à 30 % (actuel : 20 %)',
    };
    const variables = {
      getValue: (key) => {
        if (key === SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED) {
          return true;
        }
        return 30;
      },
    };
    const device = new Device(event, messageManager, stateManager, service, {}, variables, job, brain, user);

    await device.checkBatteries();

    assert.calledWith(
      messageManager.sendToUser,
      'admin',
      'Avertissement !!! Le niveau de la batterie de Test device est inférieur à 30 % (actuel : 20 %)',
    );
  });
});
