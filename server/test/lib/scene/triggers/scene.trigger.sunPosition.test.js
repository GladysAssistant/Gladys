const sinon = require('sinon');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

describe('Scene.triggers.sunPosition', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const service = {
    getService: fake.returns({
      device: {
        subscribe: fake.returns(null),
      },
    }),
  };

  beforeEach(() => {
    const house = {
      get: fake.resolves([]),
    };

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    const stateManager = new StateManager();

    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should execute scene with sun position trigger', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.SUN_POSITION,
          house: 'house-1',
          altitude: 31,
          azimuth: 160,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUN_POSITION,
      house: {
        selector: 'house-1',
      },
      altitude: 31,
      azimuth: 160,
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledOnce(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should not execute scene when altitude does not match', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.SUN_POSITION,
          house: 'house-1',
          altitude: 31,
          azimuth: 160,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUN_POSITION,
      house: {
        selector: 'house-1',
      },
      altitude: 45,
      azimuth: 160,
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.notCalled(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should not execute scene when azimuth does not match', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.SUN_POSITION,
          house: 'house-1',
          altitude: 31,
          azimuth: 160,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUN_POSITION,
      house: {
        selector: 'house-1',
      },
      altitude: 31,
      azimuth: 200,
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.notCalled(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
