const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const SceneManager = require('../../../lib/scene');
const { convertSunPositionToDegrees } = require('../../../lib/scene/scene.checkSunPositionTriggers');
const { ACTIONS, EVENTS } = require('../../../utils/constants');

const DEGREE_TO_RADIAN = Math.PI / 180;

const sunPositionScene = {
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
      sun_altitude: 20,
    },
  ],
};

describe('scene.checkSunPositionTriggers', () => {
  const event = {};
  const house = {};
  const brain = {};
  const service = {};

  let sceneManager;

  beforeEach(() => {
    event.on = fake.returns(null);
    event.emit = fake.returns(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    service.getService = fake.returns(null);
    house.get = fake.resolves([
      { selector: 'my-house', latitude: 48.85, longitude: 2.35 },
      { selector: 'house-without-coordinates', latitude: null, longitude: null },
    ]);

    sceneManager = new SceneManager({}, event, {}, {}, {}, house, {}, {}, {}, {}, brain, service);
    // The sun is at 30° above the horizon, in the South-East (azimuth 160° from North,
    // so -20° from South in the suncalc convention)
    sceneManager.sunCalc = {
      getPosition: fake.returns({
        altitude: 30 * DEGREE_TO_RADIAN,
        azimuth: -20 * DEGREE_TO_RADIAN,
      }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should convert a suncalc position to degrees, with an azimuth from North', () => {
    expect(convertSunPositionToDegrees({ altitude: 0, azimuth: 0 })).to.deep.equal({ altitude: 0, azimuth: 180 });
    expect(convertSunPositionToDegrees({ altitude: Math.PI / 2, azimuth: Math.PI })).to.deep.equal({
      altitude: 90,
      azimuth: 0,
    });
    expect(convertSunPositionToDegrees({ altitude: -Math.PI / 4, azimuth: -Math.PI / 2 })).to.deep.equal({
      altitude: -45,
      azimuth: 90,
    });
  });

  it('should do nothing when no active scene has a sun position trigger', async () => {
    await sceneManager.addScene({
      ...sunPositionScene,
      triggers: [{ type: EVENTS.SYSTEM.START }],
    });
    await sceneManager.checkSunPositionTriggers();
    assert.notCalled(house.get);
    assert.notCalled(event.emit);
  });

  it('should do nothing when the scene with a sun position trigger is not active', async () => {
    await sceneManager.addScene({ ...sunPositionScene, active: false });
    await sceneManager.checkSunPositionTriggers();
    assert.notCalled(house.get);
    assert.notCalled(event.emit);
  });

  it('should only save the sun position at the first check', async () => {
    await sceneManager.addScene(sunPositionScene);
    await sceneManager.checkSunPositionTriggers();
    assert.notCalled(event.emit);
    expect(sceneManager.sunPositions.get('my-house')).to.deep.equal({ altitude: 30, azimuth: 160 });
    // A house without coordinates is ignored
    expect(sceneManager.sunPositions.get('house-without-coordinates')).to.equal(undefined);
  });

  it('should emit a trigger check with the current and previous sun position', async () => {
    await sceneManager.addScene(sunPositionScene);
    await sceneManager.checkSunPositionTriggers();
    sceneManager.sunCalc.getPosition = fake.returns({
      altitude: 31 * DEGREE_TO_RADIAN,
      azimuth: -19 * DEGREE_TO_RADIAN,
    });
    await sceneManager.checkSunPositionTriggers();
    assert.calledOnceWithExactly(event.emit, EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.TIME.SUN_POSITION,
      house: { selector: 'my-house', latitude: 48.85, longitude: 2.35 },
      altitude: 31,
      azimuth: 161,
      previous_altitude: 30,
      previous_azimuth: 160,
    });
    expect(sceneManager.sunPositions.get('my-house')).to.deep.equal({ altitude: 31, azimuth: 161 });
  });
});
