const { expect, assert } = require('chai');
const { fake, assert: assertSinon } = require('sinon');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');
const { ACTIONS, EVENTS } = require('../../../utils/constants');

const event = new EventEmitter();

describe('scene.duplicate', () => {
  const brain = {};
  let sceneManager;

  const scheduler = {
    scheduleJob: (date, callback) => {
      return {
        callback,
        date,
        cancel: () => {},
      };
    },
  };

  beforeEach(() => {
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {}, {}, {}, scheduler, brain);
  });

  it('should duplicate a scene', async () => {
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
    assertSinon.calledOnce(brain.addNamedEntity);
  });

  it('should return not found', async () => {
    const promise = sceneManager.duplicate('not-found-scene', 'new-name', 'new-icon');
    return assert.isRejected(promise);
  });
});
