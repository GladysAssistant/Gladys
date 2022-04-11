const { fake } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('device.getValue', () => {
  it('should execute one getValue ', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      0: {
        0: {
          category: 'light',
          type: 'binary',
          last_value: 15,
        },
      },
    });
  });
  it('should execute multiple get value and get a merged scope', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      0: {
        0: {
          category: 'light',
          type: 'binary',
          last_value: 15,
        },
        1: {
          category: 'light',
          type: 'binary',
          last_value: 15,
        },
      },
      1: {
        0: {
          category: 'light',
          type: 'binary',
          last_value: 15,
        },
        1: {
          category: 'light',
          type: 'binary',
          last_value: 15,
        },
      },
    });
  });
});
