const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');
const { expect, assert: chaiAssert } = require('chai');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const { AbortScene } = require('../../../../utils/coreErrors');

const StateManager = require('../../../../lib/state');
const actionsFunc = require('../../../../lib/scene/scene.actions');

// The scene formula engine is a restricted mathjs instance built in scene.formula.js.
// Only the operators, functions and constants explicitly passed to create() are guaranteed to
// stay in the "math" namespace across mathjs releases, so every supported entry needs a test
// here: a mathjs upgrade that drops one must fail CI instead of failing silently in production.
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

  it('should support power', async () => {
    expect(await evaluateFormula('2 ^ 10')).to.equal(1024);
  });

  it('should support parenthesis and operator precedence', async () => {
    expect(await evaluateFormula('(10 - 4) * 2')).to.equal(12);
  });

  it('should support greater than', async () => {
    expect(await evaluateFormula('5 > 3')).to.equal(1);
  });

  it('should support greater than or equal', async () => {
    expect(await evaluateFormula('3 >= 3')).to.equal(1);
  });

  it('should support less than', async () => {
    expect(await evaluateFormula('5 < 3')).to.equal(0);
  });

  it('should support less than or equal', async () => {
    expect(await evaluateFormula('3 <= 3')).to.equal(1);
  });

  it('should support abs', async () => {
    expect(await evaluateFormula('abs(-4)')).to.equal(4);
  });

  it('should support ceil', async () => {
    expect(await evaluateFormula('ceil(1.2)')).to.equal(2);
  });

  it('should support floor', async () => {
    expect(await evaluateFormula('floor(1.8)')).to.equal(1);
  });

  it('should support fix', async () => {
    expect(await evaluateFormula('fix(-1.8)')).to.equal(-1);
  });

  it('should support round', async () => {
    expect(await evaluateFormula('round(1.4)')).to.equal(1);
  });

  it('should support round with a number of decimals', async () => {
    expect(await evaluateFormula('round(1.567, 2)')).to.equal(1.57);
  });

  it('should support sign', async () => {
    expect(await evaluateFormula('sign(-3)')).to.equal(-1);
  });

  it('should support pow', async () => {
    expect(await evaluateFormula('pow(2, 10)')).to.equal(1024);
  });

  it('should support sqrt', async () => {
    expect(await evaluateFormula('sqrt(400)')).to.equal(20);
  });

  it('should support cbrt', async () => {
    expect(await evaluateFormula('cbrt(27)')).to.equal(3);
  });

  it('should support square', async () => {
    expect(await evaluateFormula('square(5)')).to.equal(25);
  });

  it('should support cube', async () => {
    expect(await evaluateFormula('cube(3)')).to.equal(27);
  });

  it('should support nthRoot', async () => {
    expect(await evaluateFormula('nthRoot(81, 4)')).to.equal(3);
  });

  it('should support hypot', async () => {
    expect(await evaluateFormula('hypot(3, 4)')).to.equal(5);
  });

  it('should support exp', async () => {
    expect(await evaluateFormula('exp(0)')).to.equal(1);
  });

  it('should support log', async () => {
    expect(await evaluateFormula('log(1)')).to.equal(0);
  });

  it('should support log with a base', async () => {
    expect(await evaluateFormula('log(8, 2)')).to.equal(3);
  });

  it('should support log2', async () => {
    expect(await evaluateFormula('log2(8)')).to.equal(3);
  });

  it('should support log10', async () => {
    expect(await evaluateFormula('log10(1000)')).to.equal(3);
  });

  it('should support min', async () => {
    expect(await evaluateFormula('min(12, 4, 9)')).to.equal(4);
  });

  it('should support max', async () => {
    expect(await evaluateFormula('max(12, 4, 9)')).to.equal(12);
  });

  it('should support mean', async () => {
    expect(await evaluateFormula('mean(2, 4, 6)')).to.equal(4);
  });

  it('should support median', async () => {
    expect(await evaluateFormula('median(1, 3, 10)')).to.equal(3);
  });

  it('should support sum', async () => {
    expect(await evaluateFormula('sum(1, 2, 3)')).to.equal(6);
  });

  it('should support prod', async () => {
    expect(await evaluateFormula('prod(2, 3, 4)')).to.equal(24);
  });

  it('should support gcd', async () => {
    expect(await evaluateFormula('gcd(12, 18)')).to.equal(6);
  });

  it('should support lcm', async () => {
    expect(await evaluateFormula('lcm(4, 6)')).to.equal(12);
  });

  it('should support random', async () => {
    const value = await evaluateFormula('random()');
    expect(value).to.be.at.least(0);
    expect(value).to.be.below(1);
  });

  it('should support randomInt', async () => {
    // randomInt(min, max) excludes the upper bound, so this can only return 5
    expect(await evaluateFormula('randomInt(5, 6)')).to.equal(5);
  });

  it('should support sin', async () => {
    expect(await evaluateFormula('sin(0)')).to.equal(0);
  });

  it('should support cos', async () => {
    expect(await evaluateFormula('cos(0)')).to.equal(1);
  });

  it('should support tan', async () => {
    expect(await evaluateFormula('tan(0)')).to.equal(0);
  });

  it('should support asin', async () => {
    expect(await evaluateFormula('asin(0)')).to.equal(0);
  });

  it('should support acos', async () => {
    expect(await evaluateFormula('acos(1)')).to.equal(0);
  });

  it('should support atan', async () => {
    expect(await evaluateFormula('atan(0)')).to.equal(0);
  });

  it('should support atan2', async () => {
    expect(await evaluateFormula('round(atan2(1, 1) * 4, 5)')).to.equal(3.14159);
  });

  it('should support the pi constant', async () => {
    expect(await evaluateFormula('round(pi, 5)')).to.equal(3.14159);
  });

  it('should support the e constant', async () => {
    expect(await evaluateFormula('round(e, 5)')).to.equal(2.71828);
  });

  it('should support the tau constant', async () => {
    expect(await evaluateFormula('round(tau, 5)')).to.equal(6.28319);
  });

  it('should compute a watering duration from a tank level', async () => {
    // Use case from the community request: the watering duration grows with the tank level,
    // capped at 15 minutes and rounded to a whole number of seconds.
    expect(await evaluateFormula('round(min(15, exp(80 / 25)) * 60)')).to.equal(900);
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

  it('should abort the scene when the formula cannot be evaluated', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'brightness',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const promise = executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            // "unknownFunction" is not part of the restricted formula engine namespace,
            // so evaluating this formula throws. It is deliberately a name mathjs will never
            // define, so extending the namespace cannot make this formula valid.
            evaluate_value: 'unknownFunction(1)',
          },
        ],
      ],
      {},
    );
    await chaiAssert.isRejected(promise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
    // The guard must fail closed: the device value must not have been changed.
    expect(device.setValue.callCount).to.equal(0);
  });

  it('should abort the scene when the formula overflows to a non-finite number', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'brightness',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const promise = executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            // exp() overflows to Infinity without throwing: a device cannot be set to it.
            evaluate_value: 'exp(1000)',
          },
        ],
      ],
      {},
    );
    await chaiAssert.isRejected(promise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
    expect(device.setValue.callCount).to.equal(0);
  });

  it('should abort the scene when a delay formula returns a non-finite number', async () => {
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            // log(0) is -Infinity: waiting for it would hang the scene instead of failing it.
            evaluate_value: 'log(0)',
          },
        ],
      ],
      {},
    );
    await chaiAssert.isRejected(promise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
  });
});
