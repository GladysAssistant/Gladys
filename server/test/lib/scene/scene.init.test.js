const { expect } = require('chai');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager.init', () => {
  it('should init scene with default timezone', async () => {
    const variable = {
      getValue: () => Promise.resolve(null),
      setValue: () => Promise.resolve(null),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, variable);
    await sceneManager.init();
    expect(sceneManager.timezone).to.equal('Europe/Paris');
  });
  it('should init scene with timezone from variable', async () => {
    const variable = {
      getValue: () => Promise.resolve('Europe/London'),
      setValue: () => Promise.resolve(null),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, variable);
    await sceneManager.init();
    expect(sceneManager.timezone).to.equal('Europe/London');
  });
});
