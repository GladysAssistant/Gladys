const { assert, fake, useFakeTimers } = require('sinon');
const chaiAssert = require('chai').assert;
const dayjs = require('dayjs');
const EventEmitter = require('events');
const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.action.checkTime', () => {
  it('should execute condition.check-time, and send message because condition is true', async () => {
    const stateManager = new StateManager(event);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    const todayAt12 = dayjs()
      .hour(12)
      .minute(0);
    const fiveMinutesAgo = todayAt12.subtract(5, 'minute');
    const inFiveMinutes = todayAt12.add(5, 'minute');
    const clock = useFakeTimers(todayAt12.valueOf());
    await executeActions(
      { stateManager, event, message },
      [
        [
          {
            type: ACTIONS.CONDITION.CHECK_TIME,
            after: fiveMinutesAgo.format('HH:mm'),
            before: inFiveMinutes.format('HH:mm'),
            days_of_the_week: [todayAt12.format('dddd').toLowerCase()],
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'hello',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'hello');
    clock.restore();
  });
  it('should abort scene because condition is not verified', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const todayAt12 = dayjs()
      .hour(12)
      .minute(0);
    const fiveMinutesAgo = todayAt12.subtract(5, 'minute');
    const clock = useFakeTimers(todayAt12.valueOf());
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.CONDITION.CHECK_TIME,
            before: fiveMinutesAgo.format('HH:mm'),
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
    clock.restore();
  });
  it('should abort scene because condition is not verified', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const todayAt12 = dayjs()
      .hour(12)
      .minute(0);
    const inFiveMinutes = todayAt12.add(5, 'minute');
    const clock = useFakeTimers(todayAt12.valueOf());
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.CONDITION.CHECK_TIME,
            after: inFiveMinutes.format('HH:mm'),
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
    clock.restore();
  });
  it('should abort scene because condition is not verified', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const todayAt19 = dayjs()
      .hour(19)
      .minute(0);
    const eightPm = dayjs()
      .hour(20)
      .minute(0);
    const nineAm = dayjs()
      .hour(9)
      .minute(0);
    const clock = useFakeTimers(todayAt19.valueOf());
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.CONDITION.CHECK_TIME,
            after: eightPm.format('HH:mm'),
            before: nineAm.format('HH:mm'),
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
    clock.restore();
  });
  it('should not abort scene because condition is verified', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const todayAt20 = dayjs()
      .hour(20)
      .minute(0);
    const sevenPm = dayjs()
      .hour(19)
      .minute(0);
    const nineAm = dayjs()
      .hour(9)
      .minute(0);
    const clock = useFakeTimers(todayAt20.valueOf());
    await executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.CONDITION.CHECK_TIME,
            after: sevenPm.format('HH:mm'),
            before: nineAm.format('HH:mm'),
          },
        ],
      ],
      scope,
    );
    clock.restore();
  });
  it('should abort scene because condition is not verified', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const todayAt12 = dayjs()
      .hour(12)
      .minute(0);
    const tomorrow = todayAt12.add(1, 'day');
    const clock = useFakeTimers(todayAt12.valueOf());
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: ACTIONS.CONDITION.CHECK_TIME,
            days_of_the_week: [tomorrow.format('dddd').toLowerCase()],
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
    clock.restore();
  });
});
