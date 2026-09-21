const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

const buildEvent = (overrides = {}) => ({
  type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
  integration: 'ext-frigate',
  trigger_key: 'object_detected',
  filters: { camera: 'ext:frigate:front', label: 'person', zone: 'driveway', min_score: 0.5 },
  data: { label: 'person', zone: 'driveway', score: 0.92 },
  ...overrides,
});

describe('Scene.triggers.externalIntegrationSceneEvent', () => {
  let sceneManager;
  let message;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const service = {
    getService: fake.returns(null),
  };

  const waitForQueue = () =>
    new Promise((resolve, reject) => {
      sceneManager.queue.start((e) => (e ? reject(e) : resolve()));
    });

  const addScene = (fields, extra = {}) =>
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'Seen {{triggerEvent.data.label}} in {{triggerEvent.data.zone}} ({{triggerEvent.filters.camera}})',
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
          integration: 'ext-frigate',
          trigger_key: 'object_detected',
          fields,
        },
      ],
      ...extra,
    });

  beforeEach(() => {
    const house = {
      get: fake.resolves([]),
    };

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    message = { sendToUser: fake.resolves(null) };

    const stateManager = new StateManager();

    sceneManager = new SceneManager(
      stateManager,
      event,
      device,
      message,
      {},
      house,
      {},
      {},
      {},
      scheduler,
      brain,
      service,
    );
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should execute the scene on matching filters, with the reduced trigger event in scope', async () => {
    const execute = sinon.spy(sceneManager, 'execute');
    await addScene({ camera: 'ext:frigate:front', label: ['person', 'car'], zone: 'driveway', min_score: 0.5 });
    sceneManager.checkTrigger(buildEvent());
    await waitForQueue();
    assert.calledOnce(execute);
    // the matcher's filters never enter the scope
    expect(execute.firstCall.args[1].triggerEvent).to.deep.equal({
      type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
      integration: 'ext-frigate',
      trigger_key: 'object_detected',
      data: { label: 'person', zone: 'driveway', score: 0.92 },
    });
    assert.calledOnce(message.sendToUser);
    expect(message.sendToUser.firstCall.args[1]).to.equal('Seen person in driveway ()');
  });

  it('should not match another integration or another key', async () => {
    await addScene({});
    sceneManager.checkTrigger(buildEvent({ integration: 'ext-other' }));
    sceneManager.checkTrigger(buildEvent({ trigger_key: 'doorbell_pressed' }));
    await waitForQueue();
    assert.notCalled(message.sendToUser);
  });

  it('should treat null, empty string and empty array filters as wildcards', async () => {
    await addScene({ camera: null, label: [], zone: '' });
    sceneManager.checkTrigger(buildEvent({ filters: { camera: 'ext:frigate:back', label: 'dog', zone: null } }));
    await waitForQueue();
    assert.calledOnce(message.sendToUser);
  });

  it('should match a trigger without stored fields and an event without filters', async () => {
    await addScene(undefined);
    sceneManager.checkTrigger(buildEvent({ filters: undefined, data: undefined }));
    await waitForQueue();
    assert.calledOnce(message.sendToUser);
  });

  it('should skip a stored key absent from the current declaration', async () => {
    // `old_filter` was removed by an update: not on the event, stale, skipped
    await addScene({ camera: 'ext:frigate:front', old_filter: 'whatever' });
    sceneManager.checkTrigger(buildEvent());
    await waitForQueue();
    assert.calledOnce(message.sendToUser);
  });

  it('should not match a set filter against a declared key absent from the event', async () => {
    await addScene({ zone: 'driveway' });
    sceneManager.checkTrigger(buildEvent({ filters: { camera: 'ext:frigate:front', label: 'person', zone: null } }));
    await waitForQueue();
    assert.notCalled(message.sendToUser);
  });

  it('should match a multi_select filter by membership', async () => {
    await addScene({ label: ['person', 'car'] });
    sceneManager.checkTrigger(buildEvent({ filters: { label: 'dog' } }));
    sceneManager.checkTrigger(buildEvent({ filters: { label: 'car' } }));
    await waitForQueue();
    assert.calledOnce(message.sendToUser);
  });

  it('should compare scalars strictly', async () => {
    await addScene({ min_score: 0.5, zone: 'driveway' });
    // a stringified number never equals a number, a different string never matches
    sceneManager.checkTrigger(buildEvent({ filters: { min_score: '0.5', zone: 'driveway' } }));
    sceneManager.checkTrigger(buildEvent({ filters: { min_score: 0.5, zone: 'garden' } }));
    sceneManager.checkTrigger(buildEvent({ filters: { min_score: 0.5, zone: 'driveway' } }));
    await waitForQueue();
    assert.calledOnce(message.sendToUser);
  });

  it('should skip an inactive scene', async () => {
    await addScene({}, { active: false });
    sceneManager.checkTrigger(buildEvent());
    await waitForQueue();
    assert.notCalled(message.sendToUser);
  });
});
