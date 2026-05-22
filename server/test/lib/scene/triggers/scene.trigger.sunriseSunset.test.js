const sinon = require('sinon');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

describe('Scene.triggers.sunriseSunset', () => {
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

  it('should execute scene with sunrise trigger', async () => {
    const addedScene = await sceneManager.addScene({
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
          type: EVENTS.TIME.SUNRISE,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUNRISE,
      house: {
        selector: addedScene.triggers[0].house,
      },
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

  it('should execute scene with sunset trigger', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.SUNSET,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUNSET,
      house: {
        selector: 'house-1',
      },
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

  it('should not execute scene, sunrise trigger with offset=30 when event has offset=0', async () => {
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
          type: EVENTS.TIME.SUNRISE,
          house: 'house-1',
          offset: 30,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUNRISE,
      house: {
        selector: 'house-1',
      },
      offset: 0,
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

  it('should execute scene, sunrise trigger with offset=30 when event has offset=30', async () => {
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
          type: EVENTS.TIME.SUNRISE,
          house: 'house-1',
          offset: 30,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUNRISE,
      house: {
        selector: 'house-1',
      },
      offset: 30,
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

  it('should not execute scene, sunset trigger with offset=-15 when event has offset=0', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.SUNSET,
          house: 'house-1',
          offset: -15,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUNSET,
      house: {
        selector: 'house-1',
      },
      offset: 0,
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
