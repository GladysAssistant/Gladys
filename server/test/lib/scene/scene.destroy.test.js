const { assert, expect } = require('chai');
const SceneManager = require('../../../lib/scene');

describe('SceneManager', () => {
  it('should destroy a scene', async () => {
    const sceneManager = new SceneManager();
    sceneManager.scenes['test-scene'] = {
      name: 'Test Scene',
    };
    await sceneManager.destroy('test-scene');
    expect(sceneManager.scenes['test-scene']).to.be.undefined; // eslint-disable-line
  });
  it('should return not found', async () => {
    const sceneManager = new SceneManager();
    const promise = sceneManager.destroy('not-found-scene');
    return assert.isRejected(promise);
  });
});
