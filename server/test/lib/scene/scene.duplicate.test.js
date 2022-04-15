const { expect, assert } = require('chai');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager', () => {
  it('should duplicate a scene', async () => {
    const sceneManager = new SceneManager({}, event);

    const duplicatedScene = await sceneManager.duplicate('to-duplicate-scene', 'new-name');
    expect(sceneManager.scenes['new-name']).not.to.be.undefined; // eslint-disable-line

    expect(duplicatedScene).to.have.property('selector', 'new-name');
    expect(duplicatedScene).to.have.property('name', 'new-name');
  });

  it('should return not found', async () => {
    const sceneManager = new SceneManager({}, event);
    const promise = sceneManager.destroy('not-found-scene');
    return assert.isRejected(promise);
  });
});
