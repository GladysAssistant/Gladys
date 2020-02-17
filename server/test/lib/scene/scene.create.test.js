const { assert, expect } = require('chai');
const EventEmitter = require('events');
const { ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager', () => {
  it('should create one scene', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = await sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
    });
    expect(scene).to.have.property('selector', 'my-living-room');
  });
  it('should create one scene with custom selector', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = await sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      selector: 'my-custom-selector',
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
    });
    expect(scene).to.have.property('selector', 'my-custom-selector');
  });
  it('should return validation error, invalid actions', async () => {
    const sceneManager = new SceneManager({}, event);
    const promise = sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      actions: [
        {
          type: ACTIONS.LIGHT.TURN_ON,
        },
      ],
    });
    return assert.isRejected(promise);
  });
});
