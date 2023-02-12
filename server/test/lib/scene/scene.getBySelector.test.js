const { assert, expect } = require('chai');
const EventEmitter = require('events');

const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('scene.getBySelector', () => {
  it('should get a scene by selector', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = await sceneManager.getBySelector('test-scene');
    expect(scene).to.have.property('selector', 'test-scene');
  });
  it('should return not found', async () => {
    const sceneManager = new SceneManager({}, event);
    const promise = sceneManager.getBySelector('not-found-scene');
    return assert.isRejected(promise);
  });
});
