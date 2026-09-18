const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { fake, assert } = sinon;
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');
const logger = require('../../../../utils/logger');

const event = new EventEmitter();

describe('scene.external-integration.scene-action', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  afterEach(() => {
    sinon.restore();
  });

  const buildSelf = (proxy) => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const service = {
      getService: fake.returns(proxy),
    };
    const message = { sendToUser: fake.resolves(null) };
    return { stateManager, event, service, message };
  };

  it('should relay the stored fields untouched with a render bound to the scope', async () => {
    const proxy = {
      scene: {
        runAction: fake(async (key, fields, { render }) => ({ clip_id: `clip-${render(fields.caption)}` })),
      },
    };
    const self = buildSelf(proxy);
    const scope = { triggerEvent: { data: { zone: 'driveway' } } };
    const storedFields = {
      camera: 'ext:frigate:front',
      caption: '{{0.0.last_value}} in {{triggerEvent.data.zone}}',
    };
    await executeActions(
      self,
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION,
            integration: 'ext-frigate',
            action_key: 'create_snapshot',
            fields: storedFields,
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'Clip {{1.0.clip_id}}',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(self.service.getService, 'ext-frigate');
    assert.calledOnce(proxy.scene.runAction);
    const [key, fields] = proxy.scene.runAction.firstCall.args;
    expect(key).to.equal('create_snapshot');
    // the stored values travel as they are: the supervisor decides what to render
    expect(fields).to.equal(storedFields);
    expect(fields).to.deep.equal({
      camera: 'ext:frigate:front',
      caption: '{{0.0.last_value}} in {{triggerEvent.data.zone}}',
    });
    // the outputs are written at the action path, readable by the next action
    expect(scope['1']['0']).to.deep.equal({ clip_id: 'clip-15 in driveway' });
    assert.calledWith(self.message.sendToUser, 'pepper', 'Clip clip-15 in driveway');
  });

  it('should pass an empty object when the action stores no fields', async () => {
    const proxy = { scene: { runAction: fake.resolves({}) } };
    const self = buildSelf(proxy);
    await executeActions(
      self,
      [[{ type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION, integration: 'ext-frigate', action_key: 'echo' }]],
      {},
    );
    expect(proxy.scene.runAction.firstCall.args[1]).to.deep.equal({});
  });

  it('should log and continue when the integration is not installed', async () => {
    const loggerWarn = sinon.stub(logger, 'warn');
    const self = buildSelf(null);
    await executeActions(
      self,
      [
        [{ type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION, integration: 'ext-gone', action_key: 'echo' }],
        [{ type: ACTIONS.MESSAGE.SEND, user: 'pepper', text: 'Clip [{{0.0.clip_id}}]' }],
      ],
      {},
    );
    assert.calledOnce(loggerWarn);
    expect(loggerWarn.firstCall.args[0].message).to.include('EXTERNAL_INTEGRATION_NOT_FOUND');
    // a following action reading an output of the failed one gets an empty value
    assert.calledWith(self.message.sendToUser, 'pepper', 'Clip []');
  });

  it('should log and continue when the integration declares no scene action', async () => {
    const loggerWarn = sinon.stub(logger, 'warn');
    const self = buildSelf({ device: { setValue: fake.resolves(null) } });
    await executeActions(
      self,
      [[{ type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION, integration: 'ext-plain', action_key: 'echo' }]],
      {},
    );
    assert.calledOnce(loggerWarn);
    expect(loggerWarn.firstCall.args[0].message).to.include('SCENE_ACTION_NOT_DECLARED');
  });

  it('should log and continue when the relay fails', async () => {
    const loggerWarn = sinon.stub(logger, 'warn');
    const proxy = { scene: { runAction: fake.rejects(new Error('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT')) } };
    const self = buildSelf(proxy);
    const scope = {};
    await executeActions(
      self,
      [
        [{ type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION, integration: 'ext-frigate', action_key: 'echo' }],
        [{ type: ACTIONS.MESSAGE.SEND, user: 'pepper', text: 'still running' }],
      ],
      scope,
    );
    assert.calledOnce(loggerWarn);
    expect(scope).to.not.have.property('0');
    assert.calledWith(self.message.sendToUser, 'pepper', 'still running');
  });
});
