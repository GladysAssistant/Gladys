const { expect } = require('chai');
const Promise = require('bluebird');
const assertChai = require('chai').assert;
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.panic', () => {
  const session = {
    setTabletModeLocked: fake.resolves(null),
  };
  const house = new House(event, {}, session);
  beforeEach(async () => {
    await house.update('test-house', {
      alarm_mode: ALARM_MODES.DISARMED,
      alarm_delay_before_arming: 0,
    });
    sinon.reset();
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should trigger the alarm of the house', async () => {
    const updatedHouse = await house.panic('test-house');
    expect(updatedHouse.alarm_mode).to.equal(ALARM_MODES.TRIGGERED);
    assert.calledTwice(event.emit);
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.PANIC,
        house: 'test-house',
      },
    ]);
    expect(event.emit.secondCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.TRIGGERED,
        payload: {
          house: 'test-house',
        },
      },
    ]);
  });
  it('should return house not found', async () => {
    const promise = house.panic('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return house alarm is already triggered error', async () => {
    await house.panic('test-house');
    const promise = house.panic('test-house');
    return assertChai.isRejected(promise, 'House alarm is already triggered');
  });
  it('should cancel a pending arming so it cannot switch the alarm back off', async () => {
    await house.update('test-house', { alarm_delay_before_arming: 0.05 });
    await house.arm('test-house', ALARM_MODES.AWAY_ARMED);

    await house.panic('test-house');
    expect(house.armingHouseTimeout.has('test-house')).to.equal(false);

    // Wait past the delay the arming would have fired at
    await Promise.delay(120);

    const houseInDb = await house.getBySelector('test-house');
    expect(houseInDb.alarm_mode).to.equal(ALARM_MODES.TRIGGERED);
  });
});
