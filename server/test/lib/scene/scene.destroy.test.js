const { assert, expect } = require('chai');
const { fake, assert: assertSinon } = require('sinon');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('scene.destroy', () => {
  const brain = {};
  let sceneManager;
  beforeEach(() => {
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {}, {}, {}, {}, brain);
  });
  it('should destroy a scene', async () => {
    sceneManager.scenes['test-scene'] = {
      name: 'Test Scene',
      triggers: [],
    };
    await sceneManager.destroy('test-scene');
    expect(sceneManager.scenes['test-scene']).to.equal(undefined);
    assertSinon.calledOnce(brain.removeNamedEntity);
  });
  it('should return not found', async () => {
    const promise = sceneManager.destroy('not-found-scene');
    return assert.isRejected(promise);
  });
});
