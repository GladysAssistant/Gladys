const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const db = require('../../../../models');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { triggersFunc } = require('../../../../lib/scene/scene.triggers');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

// The sun is in the South-East, 30° above the horizon
const sunPositionEvent = {
  type: EVENTS.TIME.SUN_POSITION,
  house: {
    selector: 'my-house',
  },
  altitude: 30,
  azimuth: 160,
  previous_altitude: 29,
  previous_azimuth: 159,
};

describe('Scene.triggers.sunPosition', () => {
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

  it('should execute the scene when the sun enters the configured area', async () => {
    await sceneManager.addScene({
      selector: 'sun-position-scene',
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
          house: 'my-house',
          sun_altitude_operator: '>',
          sun_altitude: 29.5,
          sun_azimuth_operator: '>',
          sun_azimuth: 159.5,
        },
      ],
    });
    sceneManager.checkTrigger(sunPositionEvent);
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

  it('should not execute the scene when the house is not matching', async () => {
    await sceneManager.addScene({
      selector: 'sun-position-scene',
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
          house: 'another-house',
          sun_altitude_operator: '>',
          sun_altitude: 29.5,
        },
      ],
    });
    sceneManager.checkTrigger(sunPositionEvent);
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

  it('should match when only the altitude condition is set', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '>',
      sun_altitude: 29.5,
    };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(true);
  });

  it('should match when only the azimuth condition is set', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_azimuth_operator: '<',
      sun_azimuth: 159.5,
    };
    const sunGoingWest = { ...sunPositionEvent, azimuth: 159, previous_azimuth: 160 };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunGoingWest, trigger)).to.equal(true);
  });

  it('should match with the "=" operator when the sun altitude rounds to the value', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '=',
      sun_altitude: 31,
    };
    const sunAlmostAt31 = { ...sunPositionEvent, altitude: 30.7, previous_altitude: 30.2 };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunAlmostAt31, trigger)).to.equal(true);
  });

  it('should not match with the "=" operator when the sun altitude is too far from the value', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '=',
      sun_altitude: 31,
    };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(false);
  });

  it('should match with the "=" operator on the azimuth across North', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_azimuth_operator: '=',
      sun_azimuth: 0,
    };
    // The sun is 0.2° west of North: the circular distance to 0° is 0.2°, not 359.8°
    const sunAlmostNorth = { ...sunPositionEvent, azimuth: 359.8, previous_azimuth: 359 };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunAlmostNorth, trigger)).to.equal(true);
  });

  it('should not match with the "=" operator when the azimuth is far from the value on the compass', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_azimuth_operator: '=',
      sun_azimuth: 180,
    };
    const sunAlmostNorth = { ...sunPositionEvent, azimuth: 359.8, previous_azimuth: 359 };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunAlmostNorth, trigger)).to.equal(false);
  });

  it('should not match twice while the sun stays in the configured area', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '>',
      sun_altitude: 20,
    };
    // The previous altitude was already above the threshold
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(false);
  });

  it('should not match when the altitude condition is verified but not the azimuth one', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '>',
      sun_altitude: 29.5,
      sun_azimuth_operator: '>',
      sun_azimuth: 200,
    };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(false);
  });

  it('should not match when no condition is configured', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
    };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(false);
  });

  it('should not match when an operator is set without any value', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '>',
      sun_altitude: null,
    };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(false);
  });

  it('should not match when the value is not a number', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '>',
      sun_altitude: 'not-a-number',
    };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(false);
  });

  it('should save a scene with a sun position trigger in database', async () => {
    const sceneInDb = await db.Scene.create({
      name: 'sun-position-scene-in-db',
      icon: 'sun',
      triggers: [
        {
          type: EVENTS.TIME.SUN_POSITION,
          house: 'my-house',
          sun_altitude_operator: '=',
          sun_altitude: 31,
          sun_azimuth_operator: '=',
          sun_azimuth: 160,
        },
      ],
      actions: [[]],
    });
    expect(sceneInDb.triggers[0].sun_azimuth).to.equal(160);
  });

  it('should reject a scene with an azimuth out of range', async () => {
    let error;
    try {
      await db.Scene.create({
        name: 'sun-position-scene-invalid',
        icon: 'sun',
        triggers: [
          {
            type: EVENTS.TIME.SUN_POSITION,
            house: 'my-house',
            sun_azimuth_operator: '=',
            sun_azimuth: 400,
          },
        ],
        actions: [[]],
      });
    } catch (e) {
      error = e;
    }
    expect(error).to.not.equal(undefined);
    expect(error.message).to.contain('sun_azimuth');
  });

  it('should match when the value is a numeric string', () => {
    const trigger = {
      type: EVENTS.TIME.SUN_POSITION,
      house: 'my-house',
      sun_altitude_operator: '>',
      sun_altitude: '29.5',
    };
    expect(triggersFunc[EVENTS.TIME.SUN_POSITION](sceneManager, 'scene-1', sunPositionEvent, trigger)).to.equal(true);
  });
});
