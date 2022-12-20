const { expect, assert } = require('chai');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');
const { ACTIONS, EVENTS } = require('../../../utils/constants');

const event = new EventEmitter();

describe('SceneManager', () => {
  it('should duplicate a scene', async () => {
    const sceneManager = new SceneManager({}, event);

    const duplicatedScene = await sceneManager.duplicate('to-duplicate-scene', 'new-name', 'new-icon');
    expect(sceneManager.scenes['new-name']).not.to.equal(undefined);

    expect(duplicatedScene).to.have.property('selector', 'new-name');
    expect(duplicatedScene).to.have.property('name', 'new-name');
    expect(duplicatedScene).to.have.property('icon', 'new-icon');
    expect(duplicatedScene.actions).deep.equal([
      [
        {
          type: ACTIONS.LIGHT.TURN_ON,
        },
      ],
    ]);
    expect(duplicatedScene.triggers).deep.equal([
      {
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'every-day',
        time: '12:00',
      },
    ]);
  });

  it('should return not found', async () => {
    const sceneManager = new SceneManager({}, event);
    const promise = sceneManager.duplicate('not-found-scene', 'new-name');
    return assert.isRejected(promise);
  });
});
