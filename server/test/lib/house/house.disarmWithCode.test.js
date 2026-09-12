const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, ALARM_MODES } = require('../../../utils/constants');
const db = require('../../../models');
const passwordUtils = require('../../../utils/password');

const House = require('../../../lib/house');
const AlarmCode = require('../../../lib/alarm-code');

const JOHN_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const event = {
  emit: fake.returns(null),
};

describe('house.disarmWithCode', () => {
  const session = {
    unlockTabletMode: fake.resolves(null),
  };
  const alarmCode = new AlarmCode();
  const house = new House(event, {}, session, {}, alarmCode);
  beforeEach(async () => {
    await house.update('test-house', {
      alarm_delay_before_arming: 0,
      alarm_mode: ALARM_MODES.AWAY_ARMED,
    });
    await db.AlarmCode.create({ user_id: JOHN_ID, code: await passwordUtils.hash('123456') });
    sinon.reset();
    house.alarmCodeRateLimit.delete('test-house');
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should disarm a house with the code of a user', async () => {
    await house.disarmWithCode('test-house', '123456');
    assert.calledTwice(event.emit);
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.DISARM,
        house: 'test-house',
        user: 'john',
        user_name: 'John',
      },
    ]);
    expect(event.emit.secondCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED,
        payload: {
          house: 'test-house',
          user: 'john',
          user_name: 'John',
        },
      },
    ]);
  });
  it('should disarm a house with a guest code, named after the guest', async () => {
    await db.AlarmCode.create({ name: 'Home help', code: await passwordUtils.hash('4321') });
    await house.disarmWithCode('test-house', '4321');
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.DISARM,
        house: 'test-house',
        user: null,
        user_name: 'Home help',
      },
    ]);
  });
  it('should refuse an expired guest code like a wrong one', async () => {
    await db.AlarmCode.create({
      name: 'Last week help',
      code: await passwordUtils.hash('4321'),
      valid_until: new Date(Date.now() - 1000),
    });
    const promise = house.disarmWithCode('test-house', '4321');
    return assertChai.isRejected(promise, 'INVALID_CODE');
  });
  it('should accept a guest code still within its validity', async () => {
    await db.AlarmCode.create({
      name: 'This week help',
      code: await passwordUtils.hash('4321'),
      valid_until: new Date(Date.now() + 60 * 1000),
    });
    const updatedHouse = await house.disarmWithCode('test-house', '4321');
    expect(updatedHouse.alarm_mode).to.equal(ALARM_MODES.DISARMED);
  });
  it('should disarm 4 times with fail code', async () => {
    await assertChai.isRejected(house.disarmWithCode('test-house', '12'), 'INVALID_CODE');
    await assertChai.isRejected(house.disarmWithCode('test-house', '12'), 'INVALID_CODE');
    await assertChai.isRejected(house.disarmWithCode('test-house', '12'), 'INVALID_CODE');
    await assertChai.isRejected(house.disarmWithCode('test-house', '12'), 'TOO_MANY_CODES_TESTS');
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.TOO_MANY_CODES_TESTS,
        house: 'test-house',
      },
    ]);
  });
  it('should return house not found', async () => {
    const promise = house.disarmWithCode('house-not-found', '123456');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return wrong code', async () => {
    const promise = house.disarmWithCode('test-house', '12');
    return assertChai.isRejected(promise, 'INVALID_CODE');
  });
  it('should refuse any code when none exists', async () => {
    await db.AlarmCode.destroy({ where: {} });
    const promise = house.disarmWithCode('test-house', '123456');
    return assertChai.isRejected(promise, 'INVALID_CODE');
  });
  it('should just resolve if house is already disarmed', async () => {
    await house.disarmWithCode('test-house', '123456');
    await house.disarmWithCode('test-house', '123456');
  });
  it('should cancel the arming in progress', async () => {
    await house.update('test-house', {
      alarm_delay_before_arming: 5,
      alarm_mode: ALARM_MODES.DISARMED,
    });
    await house.arm('test-house', ALARM_MODES.AWAY_ARMED);
    sinon.reset();
    await house.disarmWithCode('test-house', '123456');
    // Timeout should be deleted
    expect(house.armingHouseTimeout.size).to.equal(0);
    assert.calledTwice(event.emit);
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.DISARM,
        house: 'test-house',
        user: 'john',
        user_name: 'John',
      },
    ]);
    expect(event.emit.secondCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED,
        payload: {
          house: 'test-house',
          user: 'john',
          user_name: 'John',
        },
      },
    ]);
  });
});
