const sinon = require('sinon');
const EventEmitter = require('events');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const { AbortScene } = require('../../../../utils/coreErrors');
const actionsFunc = require('../../../../lib/scene/scene.actions');

chai.use(chaiAsPromised);

const { assert } = chai;
const event = new EventEmitter();

describe('scene.action.delay', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  let clock;

  beforeEach(() => {
    // Setup fake timers before each test
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    // Restore original timers after each test
    clock.restore();
  });

  it('should execute delay with milliseconds unit', async () => {
    // Create a promise that will be resolved after the action completes
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'milliseconds',
            value: 5,
          },
        ],
      ],
      {},
    );

    // Advance the clock by the delay amount + 1 to be sure
    await clock.tickAsync(5 + 1);

    // Wait for the action to complete
    await actionPromise;

    // If we reach here without timing out, the test passes
  });

  it('should execute delay with seconds unit', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            value: 5,
          },
        ],
      ],
      {},
    );

    // Advance the clock by 5 seconds (in milliseconds) + 1 to be sure
    await clock.tickAsync(5 * 1000 + 1);

    await actionPromise;
  });

  it('should execute delay with minutes unit', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'minutes',
            value: 5,
          },
        ],
      ],
      {},
    );

    // Advance the clock by 5 minutes (in milliseconds) + 1 to be sure
    await clock.tickAsync(5 * 60 * 1000 + 1);

    await actionPromise;
  });

  it('should execute delay with hours unit', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'hours',
            value: 5,
          },
        ],
      ],
      {},
    );

    // Advance the clock by 5 hours (in milliseconds) + 1 to be sure
    await clock.tickAsync(5 * 60 * 60 * 1000 + 1);

    await actionPromise;
  });

  it('should execute delay with calculated unit', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            evaluate_value: '5 + 12',
          },
        ],
      ],
      {},
    );

    // Advance the clock by 17 seconds (in milliseconds) + 1 to be sure
    await clock.tickAsync(17 * 1000 + 1);

    await actionPromise;
  });
  it('should execute delay with calculated unit with data from get-value', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            evaluate_value: '{{0.0.last_value}} + 1',
          },
        ],
      ],
      { 0: [{ last_value: 15 }] },
    );

    // Advance the clock by 16 seconds (in milliseconds) + 1 to be sure
    await clock.tickAsync(16 * 1000 + 1);

    await actionPromise;
  });

  it('should throw an error when evaluate_value is not a number', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            evaluate_value: 'not_a_number',
          },
        ],
      ],
      {},
    );

    return assert.isRejected(actionPromise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
  });

  it('should throw an error when value is not a number', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            value: 'not_a_number',
          },
        ],
      ],
      {},
    );

    return assert.isRejected(actionPromise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
  });

  it('should throw an error when unit is unknown', async () => {
    const actionPromise = executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'unknown_unit',
            value: 5,
          },
        ],
      ],
      {},
    );

    return assert.isRejected(actionPromise, AbortScene, 'Unit unknown_unit not recognized');
  });
});
