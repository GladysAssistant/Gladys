const sinon = require('sinon').createSandbox();

const { useFakeTimers } = sinon;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const EventEmitter = require('events');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');

dayjs.extend(utc);
dayjs.extend(timezone);

chai.use(chaiAsPromised);

const { expect, assert } = chai;
const event = new EventEmitter();

// 2024-04-08 13:32:42.683 UTC = 2024-04-08 15:32:42.683 in Europe/Paris
const NOW = dayjs.tz('2024-04-08 13:32:42.683', 'UTC').valueOf();

describe('scene.action.getDate', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  let clock;

  beforeEach(() => {
    clock = useFakeTimers(NOW);
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should get the current date with a minute precision by default', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions({ stateManager, event, timezone: 'Europe/Paris' }, [[{ type: ACTIONS.TIME.GET_DATE }]], scope);
    expect(scope).to.deep.equal({
      0: [
        {
          datetime: '2024-04-08 15:32',
          date: '2024-04-08',
          time: '15:32',
          timestamp: 1712583120,
        },
      ],
    });
  });

  it('should get the current date with a second precision', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions(
      { stateManager, event, timezone: 'Europe/Paris' },
      [[{ type: ACTIONS.TIME.GET_DATE, precision: 'second' }]],
      scope,
    );
    expect(scope).to.deep.equal({
      0: [
        {
          datetime: '2024-04-08 15:32:42',
          date: '2024-04-08',
          time: '15:32:42',
          timestamp: 1712583162,
        },
      ],
    });
  });

  it('should get the current date with an hour precision', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions(
      { stateManager, event, timezone: 'Europe/Paris' },
      [[{ type: ACTIONS.TIME.GET_DATE, precision: 'hour' }]],
      scope,
    );
    expect(scope).to.deep.equal({
      0: [
        {
          datetime: '2024-04-08 15:00',
          date: '2024-04-08',
          time: '15:00',
          timestamp: 1712581200,
        },
      ],
    });
  });

  it('should get the current date with a day precision', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions(
      { stateManager, event, timezone: 'Europe/Paris' },
      [[{ type: ACTIONS.TIME.GET_DATE, precision: 'day' }]],
      scope,
    );
    expect(scope).to.deep.equal({
      0: [
        {
          datetime: '2024-04-08',
          date: '2024-04-08',
          time: '00:00',
          timestamp: 1712527200,
        },
      ],
    });
  });

  it('should return the date in the timezone of the user', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions(
      { stateManager, event, timezone: 'America/New_York' },
      [[{ type: ACTIONS.TIME.GET_DATE }]],
      scope,
    );
    expect(scope).to.deep.equal({
      0: [
        {
          datetime: '2024-04-08 09:32',
          date: '2024-04-08',
          time: '09:32',
          timestamp: 1712583120,
        },
      ],
    });
  });

  it('should abort the scene when the precision is unknown', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const promise = executeActions(
      { stateManager, event, timezone: 'Europe/Paris' },
      [[{ type: ACTIONS.TIME.GET_DATE, precision: 'century' }]],
      scope,
    );
    await assert.isRejected(promise, AbortScene);
  });

  it('should abort the scene when the precision is an empty string', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const promise = executeActions(
      { stateManager, event, timezone: 'Europe/Paris' },
      [[{ type: ACTIONS.TIME.GET_DATE, precision: '' }]],
      scope,
    );
    await assert.isRejected(promise, AbortScene);
  });

  it('should abort the scene when the precision is null', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const promise = executeActions(
      { stateManager, event, timezone: 'Europe/Paris' },
      [[{ type: ACTIONS.TIME.GET_DATE, precision: null }]],
      scope,
    );
    await assert.isRejected(promise, AbortScene);
  });
});
