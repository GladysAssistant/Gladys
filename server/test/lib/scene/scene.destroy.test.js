const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: assertSinon } = sinon;
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');
const { EVENTS } = require('../../../utils/constants');

const event = new EventEmitter();

describe('scene.destroy', () => {
  const brain = {};
  let sceneManager;
  beforeEach(() => {
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {}, {}, {}, {}, brain);
  });
  it('should destroy a scene', async () => {
    sceneManager.scenes['test-scene'] = {
      name: 'Test Scene',
      triggers: [],
    };
    await sceneManager.destroy('test-scene');
    expect(sceneManager.scenes['test-scene']).to.equal(undefined);
  });
  it('should return not found', async () => {
    const promise = sceneManager.destroy('not-found-scene');
    return assert.isRejected(promise);
  });
  it('should stop the in-flight executions of the destroyed scene', async () => {
    sceneManager.scenes['test-scene'] = {
      name: 'Test Scene',
      triggers: [],
    };
    const abortController = new AbortController();
    sceneManager.runningScenes.set('execution-1', {
      sceneSelector: 'test-scene',
      abortController,
    });
    const otherAbortController = new AbortController();
    sceneManager.runningScenes.set('execution-2', {
      sceneSelector: 'other-scene',
      abortController: otherAbortController,
    });

    await sceneManager.destroy('test-scene');

    expect(abortController.signal.aborted).to.equal(true);
    expect(otherAbortController.signal.aborted).to.equal(false);
  });
  it('should call dailyUpdate when destroying a scene with sunrise trigger', async () => {
    sceneManager.dailyUpdate = fake.resolves(null);
    sceneManager.scenes['test-scene'] = {
      name: 'Test Scene',
      triggers: [
        {
          type: EVENTS.TIME.SUNRISE,
          house: 'house',
        },
      ],
    };
    await sceneManager.destroy('test-scene');
    assertSinon.calledOnce(sceneManager.dailyUpdate);
  });
  it('should NOT call dailyUpdate when destroying a scene without sunrise/sunset triggers', async () => {
    sceneManager.dailyUpdate = fake.resolves(null);
    sceneManager.scenes['test-scene'] = {
      name: 'Test Scene',
      triggers: [],
    };
    await sceneManager.destroy('test-scene');
    assertSinon.notCalled(sceneManager.dailyUpdate);
  });
});
