const { fake, assert: assertSinon } = require('sinon');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('scene.command', () => {
  const brain = {};
  const message = {};
  let sceneManager;
  beforeEach(() => {
    message.replyByIntent = fake.returns(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager({}, event, {}, message, {}, {}, {}, {}, {}, {}, brain);
    sceneManager.execute = fake.resolves(null);
  });
  it('should start scene', async () => {
    const classification = {
      intent: 'scene.start',
      entities: [
        {
          entity: 'scene',
          option: 'my-scene',
          sourceText: 'My scene',
        },
      ],
    };
    await sceneManager.command({}, classification, {});
    assertSinon.calledWith(sceneManager.execute, 'my-scene');
    assertSinon.calledWith(message.replyByIntent, {}, 'scene.start.success', {});
  });
  it('should throw error, scene not found', async () => {
    const classification = {
      intent: 'scene.start',
      entities: [],
    };
    await sceneManager.command({}, classification, {});
    assertSinon.notCalled(sceneManager.execute);
    assertSinon.calledWith(message.replyByIntent, {}, 'scene.start.fail', {});
  });
  it('should throw error, scene not found', async () => {
    const classification = {
      intent: 'scene.start',
      entities: [
        {
          entity: 'scene',
          option: undefined,
          sourceText: 'My scene',
        },
      ],
    };
    await sceneManager.command({}, classification, {});
    assertSinon.notCalled(sceneManager.execute);
    assertSinon.calledWith(message.replyByIntent, {}, 'scene.start.fail', {});
  });
});
