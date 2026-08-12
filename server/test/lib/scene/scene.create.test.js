const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');
const { ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const sceneModel = require('../../../models/scene');

const event = new EventEmitter();

describe('SceneManager', () => {
  const brain = {};
  let sceneManager;
  beforeEach(() => {
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {}, {}, {}, {}, brain);
  });
  it('should create one scene', async () => {
    const scene = await sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector');
    expect(scene.selector).to.contain('my-living-room');
    // selector should have 4 random characters at the end + dash
    expect(scene.selector).to.have.lengthOf('my-living-room'.length + 5);
  });
  it('should create one scene with custom selector', async () => {
    const scene = await sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      selector: 'my-custom-selector',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector', 'my-custom-selector');
  });
  it('should return validation error, invalid actions', async () => {
    const promise = sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      triggers: [],
      actions: [
        {
          type: ACTIONS.LIGHT.TURN_ON,
        },
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should return validation error, invalid triggers', async () => {
    const promise = sceneManager.create({
      name: 'Invalid trigger scene',
      icon: 'bell',
      triggers: [
        {
          type: 'invalid-trigger-type',
        },
      ],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should return validation error when http.request action has no headers', async () => {
    const promise = sceneManager.create({
      name: 'Invalid http request scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'https://example.com/hook',
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  const createSceneWithCondition = (condition) =>
    sceneManager.create({
      name: 'Only continue if scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [condition],
          },
        ],
      ],
      tags: [],
    });

  it('should create a scene with a condition on a variable', async () => {
    const scene = await createSceneWithCondition({ variable: '0.0.last_value', operator: '>', value: 20 });
    expect(scene).to.have.property('selector');
  });

  it('should create a scene with a condition on a device feature', async () => {
    const scene = await createSceneWithCondition({ device_feature: 'mqtt-temperature', operator: '>', value: 20 });
    expect(scene).to.have.property('selector');
  });

  it('should return validation error when a condition has neither variable nor device feature', async () => {
    await assert.isRejected(createSceneWithCondition({ operator: '>', value: 20 }));
  });

  it('should return validation error when a condition has both variable and device feature', async () => {
    await assert.isRejected(
      createSceneWithCondition({
        variable: '0.0.last_value',
        device_feature: 'mqtt-temperature',
        operator: '>',
        value: 20,
      }),
    );
  });

  it('should format joi error fallback when details are absent', () => {
    expect(sceneModel.formatJoiValidationError()).to.equal('Invalid schema');
    expect(sceneModel.formatJoiValidationError({ message: 'Validation failed' })).to.equal('Validation failed');
  });
});
