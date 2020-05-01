const { assert, expect } = require('chai');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager', () => {
  it('should update a scene', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = await sceneManager.update('test-scene', {
      name: 'Name updated',
    });
    expect(scene).to.have.property('selector', 'test-scene');
    expect(scene).to.have.property('name', 'Name updated');
  });
  it('should return not found', async () => {
    const sceneManager = new SceneManager({}, event);
    const promise = sceneManager.update('not-found-scene', {
      name: 'Updated scene',
    });
    return assert.isRejected(promise);
  });
});
