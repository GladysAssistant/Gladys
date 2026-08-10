const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { triggersFunc } = require('../../../../lib/scene/scene.triggers');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

describe('Scene.triggers.weatherAlert', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const service = {
    getService: fake.returns(null),
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

  it('should execute the scene when a matching weather alert is raised', async () => {
    await sceneManager.addScene({
      selector: 'weather-alert-scene',
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
          type: EVENTS.WEATHER.ALERT_RAISED,
          house: 'my-house',
          weather_alert_type: 'wind',
          weather_alert_severity: 'severe',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.WEATHER.ALERT_RAISED,
      house: 'my-house',
      alert: { severity: 'extreme', event: 'Vent violent', type: 'wind' },
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

  it('should match by house, type filter and minimal severity', () => {
    const matcher = triggersFunc[EVENTS.WEATHER.ALERT_RAISED];
    const trigger = {
      house: 'my-house',
      weather_alert_type: 'wind',
      weather_alert_severity: 'severe',
    };
    const buildEvent = (alert, house = 'my-house') => ({ type: EVENTS.WEATHER.ALERT_RAISED, house, alert });

    // matching alert
    expect(matcher(null, 'scene', buildEvent({ severity: 'severe', event: 'Vent', type: 'wind' }), trigger)).to.equal(
      true,
    );
    // wrong house
    expect(
      matcher(null, 'scene', buildEvent({ severity: 'severe', event: 'Vent', type: 'wind' }, 'other'), trigger),
    ).to.equal(false);
    // wrong type
    expect(matcher(null, 'scene', buildEvent({ severity: 'severe', event: 'Pluie', type: 'rain' }), trigger)).to.equal(
      false,
    );
    // below the minimal severity
    expect(matcher(null, 'scene', buildEvent({ severity: 'moderate', event: 'Vent', type: 'wind' }), trigger)).to.equal(
      false,
    );
    // 'any' type filter matches untyped alerts too, minimal severity defaults to minor
    const anyTrigger = { house: 'my-house', weather_alert_type: 'any' };
    expect(matcher(null, 'scene', buildEvent({ severity: 'minor', event: 'Divers' }), anyTrigger)).to.equal(true);
    // absent type filter behaves like 'any'
    const bareTrigger = { house: 'my-house' };
    expect(matcher(null, 'scene', buildEvent({ severity: 'minor', event: 'Divers' }), bareTrigger)).to.equal(true);
    // the ended matcher is the same function
    expect(triggersFunc[EVENTS.WEATHER.ALERT_ENDED]).to.equal(matcher);
  });
});
