const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');
const { AbortScene } = require('../../../../utils/coreErrors');

const StateManager = require('../../../../lib/state');

chai.use(chaiAsPromised);

const { expect } = chai;
const event = new EventEmitter();

describe('scene.setVariable', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  afterEach(() => {
    sinon.reset();
  });

  it('should set a simple text variable in the scope', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            name: 'My variable',
            text: 'Hello world',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      0: [{ value: 'Hello world' }],
    });
  });

  it('should set an empty text variable when no text is configured', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.VARIABLE.SET,
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      0: [{ value: '' }],
    });
  });

  it('should set a text variable containing another variable', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'temperature-sensor',
      type: 'decimal',
      last_value: 15,
    });
    const scope = {};
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.VARIABLE.SET,
            name: 'Temperature text',
            text: 'It is {{0.0.last_value}} °C',
          },
        ],
      ],
      scope,
    );
    expect(scope[1]).to.deep.equal([{ value: 'It is 15 °C' }]);
  });

  it('should set a computed variable', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'temperature-sensor',
      type: 'decimal',
      last_value: 15,
    });
    const scope = {};
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.VARIABLE.SET,
            name: 'Waiting time',
            evaluate_value: '{{0.0.last_value}} * 2 + 10',
          },
        ],
      ],
      scope,
    );
    expect(scope[1]).to.deep.equal([{ value: 40 }]);
  });

  it('should re-use a variable in a next action', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'temperature-sensor',
      type: 'decimal',
      last_value: 15,
    });
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.VARIABLE.SET,
            name: 'Waiting time',
            evaluate_value: '{{0.0.last_value}} * 2',
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'I will wait {{1.0.value}} minutes.',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'I will wait 30 minutes.');
  });

  it('should abort the scene if the formula cannot be evaluated', async () => {
    const stateManager = new StateManager(event);
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            evaluate_value: '10 +',
          },
        ],
      ],
      {},
    );
    await expect(promise).to.be.rejectedWith(AbortScene, 'VARIABLE_VALUE_NOT_A_NUMBER');
  });

  it('should abort the scene if the formula overflows to a non-finite number', async () => {
    const stateManager = new StateManager(event);
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            evaluate_value: '1e309',
          },
        ],
      ],
      {},
    );
    await expect(promise).to.be.rejectedWith(AbortScene, 'VARIABLE_VALUE_NOT_A_NUMBER');
  });

  it('should abort the scene if the text template is invalid', async () => {
    const stateManager = new StateManager(event);
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            text: 'Hello {{#each}}',
          },
        ],
      ],
      {},
    );
    await expect(promise).to.be.rejectedWith(AbortScene, 'VARIABLE_TEXT_NOT_VALID');
  });

  it('should abort the scene if both a text and a formula are configured', async () => {
    const stateManager = new StateManager(event);
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            text: 'Hello',
            evaluate_value: '2 * 3',
          },
        ],
      ],
      {},
    );
    await expect(promise).to.be.rejectedWith(AbortScene, 'VARIABLE_VALUE_AMBIGUOUS');
  });

  it('should abort the scene if the formula does not return a number', async () => {
    const stateManager = new StateManager(event);
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            evaluate_value: '"a"',
          },
        ],
      ],
      {},
    );
    await expect(promise).to.be.rejectedWith(AbortScene, 'VARIABLE_VALUE_NOT_A_NUMBER');
  });
});
