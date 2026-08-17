const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');
const { AbortScene, NotFoundError } = require('../../../../utils/coreErrors');

const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const db = require('../../../../models');

chai.use(chaiAsPromised);

const { expect } = chai;

describe('scene.enable / scene.disable', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  let event;
  let stateManager;

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should enable another scene', async () => {
    const update = fake.resolves({ selector: 'my-other-scene', active: true });
    const scope = {};
    await executeActions(
      { stateManager, event, update },
      [
        [
          {
            type: ACTIONS.SCENE.ENABLE,
            scene: 'my-other-scene',
          },
        ],
      ],
      scope,
    );
    assert.calledOnceWithExactly(update, 'my-other-scene', { active: true });
  });

  it('should disable another scene', async () => {
    const update = fake.resolves({ selector: 'my-other-scene', active: false });
    const scope = {};
    await executeActions(
      { stateManager, event, update },
      [
        [
          {
            type: ACTIONS.SCENE.DISABLE,
            scene: 'my-other-scene',
          },
        ],
      ],
      scope,
    );
    assert.calledOnceWithExactly(update, 'my-other-scene', { active: false });
  });

  it('should allow a scene to disable itself', async () => {
    const update = fake.resolves({ selector: 'my-scene', active: false });
    const scope = {};
    await executeActions(
      { stateManager, event, update },
      [
        [
          {
            type: ACTIONS.SCENE.DISABLE,
            scene: 'my-scene',
          },
        ],
      ],
      scope,
    );
    assert.calledOnceWithExactly(update, 'my-scene', { active: false });
  });

  it('should abort the scene when no scene is selected', async () => {
    const update = fake.resolves(null);
    const scope = {};
    const promise = executeActions(
      { stateManager, event, update },
      [
        [
          {
            type: ACTIONS.SCENE.ENABLE,
          },
        ],
      ],
      scope,
    );
    await expect(promise).to.be.rejectedWith(AbortScene, 'SCENE_NOT_FOUND');
    assert.notCalled(update);
  });

  it('should abort the scene when the selected scene does not exist anymore', async () => {
    const update = fake.rejects(new NotFoundError('Scene not found'));
    const scope = {};
    const promise = executeActions(
      { stateManager, event, update },
      [
        [
          {
            type: ACTIONS.SCENE.DISABLE,
            scene: 'deleted-scene',
          },
        ],
      ],
      scope,
    );
    await expect(promise).to.be.rejectedWith(AbortScene, 'SCENE_NOT_FOUND');
    assert.calledOnceWithExactly(update, 'deleted-scene', { active: false });
  });

  it('should persist the active flag of the target scene in database', async () => {
    const brain = { addNamedEntity: fake.returns(null), removeNamedEntity: fake.returns(null) };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {}, {}, {}, {}, brain);
    await executeActions(sceneManager, [[{ type: ACTIONS.SCENE.DISABLE, scene: 'test-scene' }]], {});
    let sceneInDb = await db.Scene.findOne({ where: { selector: 'test-scene' } });
    expect(sceneInDb.active).to.equal(false);
    await executeActions(sceneManager, [[{ type: ACTIONS.SCENE.ENABLE, scene: 'test-scene' }]], {});
    sceneInDb = await db.Scene.findOne({ where: { selector: 'test-scene' } });
    expect(sceneInDb.active).to.equal(true);
  });

  it('should propagate an unexpected error coming from the update', async () => {
    const update = fake.rejects(new Error('DATABASE_ERROR'));
    const promise = actionsFunc[ACTIONS.SCENE.ENABLE](
      { stateManager, event, update },
      { type: ACTIONS.SCENE.ENABLE, scene: 'my-other-scene' },
      {},
    );
    await expect(promise).to.be.rejectedWith(Error, 'DATABASE_ERROR');
  });
});
