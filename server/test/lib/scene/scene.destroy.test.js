const { assert, expect } = require('chai');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager', () => {
  it('should destroy a scene', async () => {
    const sceneManager = new SceneManager({}, event);
    sceneManager.scenes['test-scene'] = {
      name: 'Test Scene',
      triggers: [],
    };
    await sceneManager.destroy('test-scene');
    expect(sceneManager.scenes['test-scene']).to.be.undefined; // eslint-disable-line
  });
  it('should return not found', async () => {
    const sceneManager = new SceneManager({}, event);
    const promise = sceneManager.destroy('not-found-scene');
    return assert.isRejected(promise);
  });
});
