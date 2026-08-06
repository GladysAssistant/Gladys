const sinon = require('sinon');
const EventEmitter = require('events');

const { assert, fake } = sinon;

const { EVENTS, ACTIONS } = require('../../../../utils/constants');
const SceneManager = require('../../../../lib/scene');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('Scene.triggers.meteoFranceVigilance', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  beforeEach(async () => {
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

    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain);

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
          type: EVENTS.METEO_FRANCE.NEW_VIGILANCE,
          house: 'house-1',
          color: 3,
        },
      ],
    });
  });

  afterEach(() => {
    sinon.reset();
  });

  const waitForQueue = () =>
    new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          resolve(null);
        } catch (e) {
          reject(e);
        }
      });
    });

  it('should execute scene when vigilance reaches the configured level', async () => {
    sceneManager.checkTrigger({
      type: EVENTS.METEO_FRANCE.NEW_VIGILANCE,
      house: 'house-1',
      dept: '71',
      color: 3,
    });
    await waitForQueue();
    assert.calledOnce(device.setValue);
  });
  it('should execute scene when vigilance is above the configured level', async () => {
    sceneManager.checkTrigger({
      type: EVENTS.METEO_FRANCE.NEW_VIGILANCE,
      house: 'house-1',
      dept: '71',
      color: 4,
    });
    await waitForQueue();
    assert.calledOnce(device.setValue);
  });
  it('should not execute scene when vigilance is below the configured level', async () => {
    sceneManager.checkTrigger({
      type: EVENTS.METEO_FRANCE.NEW_VIGILANCE,
      house: 'house-1',
      dept: '71',
      color: 2,
    });
    await waitForQueue();
    assert.notCalled(device.setValue);
  });
  it('should not execute scene for another house', async () => {
    sceneManager.checkTrigger({
      type: EVENTS.METEO_FRANCE.NEW_VIGILANCE,
      house: 'house-2',
      dept: '06',
      color: 4,
    });
    await waitForQueue();
    assert.notCalled(device.setValue);
  });
});
