const { assert, expect } = require('chai');
const SceneManager = require('../../../lib/scene');

const light = {};

describe('SceneManager', () => {
  it('should get a scene by selector', async () => {
    const sceneManager = new SceneManager(light);
    const scene = await sceneManager.getBySelector('test-scene');
    expect(scene).to.have.property('selector', 'test-scene');
  });
  it('should return not found', async () => {
    const sceneManager = new SceneManager(light);
    const promise = sceneManager.getBySelector('not-found-scene');
    return assert.isRejected(promise);
  });
});
