const { expect } = require('chai');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager.getTag', () => {
  it('should get tags', async () => {
    const sceneManager = new SceneManager({}, event);
    const tags = await sceneManager.getTag();
    expect(tags).to.be.instanceOf(Array);
    tags.forEach((tag) => {
      expect(tag).to.have.property('name');
    });
  });
});
