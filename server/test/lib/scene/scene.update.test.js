const { assert, expect } = require('chai');
const { fake, assert: assertSinon } = require('sinon');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('scene.update', () => {
  const brain = {};
  let sceneManager;
  beforeEach(() => {
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {}, {}, {}, {}, brain);
  });
  it('should update a scene', async () => {
    const scene = await sceneManager.update('test-scene', {
      name: 'Name updated',
    });
    expect(scene).to.have.property('selector', 'test-scene');
    expect(scene).to.have.property('name', 'Name updated');
    assertSinon.calledOnce(brain.addNamedEntity);
    assertSinon.calledOnce(brain.removeNamedEntity);
  });
  it('should update a scene with tags', async () => {
    const scene = await sceneManager.update('test-scene', {
      name: 'Name updated',
      tags: [{ name: 'tag 1' }],
    });
    expect(scene).to.have.property('selector', 'test-scene');
    expect(scene).to.have.property('name', 'Name updated');
    expect(scene).to.have.property('tags');
    expect(scene.tags).deep.eq([{ name: 'tag 1' }]);
    assertSinon.calledOnce(brain.addNamedEntity);
    assertSinon.calledOnce(brain.removeNamedEntity);
  });
  it('should return not found', async () => {
    const promise = sceneManager.update('not-found-scene', {
      name: 'Updated scene',
    });
    return assert.isRejected(promise, 'Scene not found');
  });
});
