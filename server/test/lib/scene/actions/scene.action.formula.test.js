const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');
const { expect } = require('chai');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');
const actionsFunc = require('../../../../lib/scene/scene.actions');

// The scene formula engine is a restricted mathjs instance built in scene.actions.js.
// Only the operators explicitly passed to create() are guaranteed to stay in the "math"
// namespace across mathjs releases, so every supported operator needs a test here:
// a mathjs upgrade that drops one must fail CI instead of failing silently in production.
describe('scene.formula', () => {
  let event;
  let stateManager;
  const { executeActions } = executeActionsFactory(actionsFunc);

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  afterEach(() => {
    sinon.reset();
  });

  /**
   * @description Evaluate a formula through the device.set-value action and
   * return the value that was sent to the device.
   * @param {string} formula - The formula to evaluate.
   * @returns {Promise<number>} The value passed to device.setValue.
   * @example const value = await evaluateFormula('180 - 5');
   */
  async function evaluateFormula(formula) {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'brightness',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            evaluate_value: formula,
          },
        ],
      ],
      {},
    );
    expect(device.setValue.callCount).to.equal(1);
    return device.setValue.firstCall.args[2];
  }

  it('should support addition', async () => {
    expect(await evaluateFormula('180 + 5')).to.equal(185);
  });

  it('should support subtraction', async () => {
    expect(await evaluateFormula('180 - 5')).to.equal(175);
  });

  it('should support multiplication', async () => {
    expect(await evaluateFormula('3 * 3600')).to.equal(10800);
  });

  it('should support division', async () => {
    expect(await evaluateFormula('10 / 2')).to.equal(5);
  });

  it('should support modulo', async () => {
    expect(await evaluateFormula('10 % 3')).to.equal(1);
  });

  it('should support unary minus', async () => {
    expect(await evaluateFormula('-5')).to.equal(-5);
  });

  it('should support round', async () => {
    expect(await evaluateFormula('round(1.4)')).to.equal(1);
  });

  it('should support parenthesis and operator precedence', async () => {
    expect(await evaluateFormula('(10 - 4) * 2')).to.equal(12);
  });

  it('should subtract from a scene variable', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'brightness',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            evaluate_value: '{{0.0.last_value}} - 5',
          },
        ],
      ],
      {},
    );
    expect(device.setValue.firstCall.args[2]).to.equal(10);
  });
});
