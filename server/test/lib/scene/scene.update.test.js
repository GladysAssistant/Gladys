const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');
const db = require('../../../models');

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
  });
  it('should not delete tags when patching scene', async () => {
    const scene = await sceneManager.update('test-scene', {
      name: 'Name updated',
      tags: [{ name: 'tag 1' }],
    });
    expect(scene.tags).deep.eq([{ name: 'tag 1' }]);
    const scene2 = await sceneManager.update('test-scene', {
      name: 'Name updated 2',
    });
    expect(scene2.tags).deep.eq([{ name: 'tag 1' }]);
  });
  it('should not let an update overwrite when the scene was last executed', async () => {
    const lastExecuted = new Date('2026-11-10T08:00:00.000Z');
    await db.Scene.update({ last_executed: lastExecuted }, { where: { selector: 'test-scene' } });
    // an editor saving the scene it loaded before the run sends the previous value back
    const scene = await sceneManager.update('test-scene', {
      name: 'Name updated',
      last_executed: null,
    });
    expect(scene).to.have.property('name', 'Name updated');
    expect(new Date(scene.last_executed).getTime()).to.equal(lastExecuted.getTime());
    const sceneInDb = await db.Scene.findOne({ where: { selector: 'test-scene' } });
    expect(new Date(sceneInDb.last_executed).getTime()).to.equal(lastExecuted.getTime());
  });
  it('should return not found', async () => {
    const promise = sceneManager.update('not-found-scene', {
      name: 'Updated scene',
    });
    return assert.isRejected(promise, 'Scene not found');
  });
});
