const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon').createSandbox();
const Promise = require('bluebird');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, ALARM_MODES } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.disarm', () => {
  const session = {
    unlockTabletMode: fake.resolves(null),
  };
  const house = new House(event, {}, session);
  beforeEach(async () => {
    await house.update('test-house', {
      alarm_delay_before_arming: 0,
      alarm_mode: ALARM_MODES.ARMED,
    });
    sinon.reset();
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should disarm a house', async () => {
    await house.disarm('test-house');
    assert.calledTwice(event.emit);
    assert.calledOnce(session.unlockTabletMode);
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.DISARM,
        house: 'test-house',
      },
    ]);
    expect(event.emit.secondCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED,
        payload: {
          house: 'test-house',
        },
      },
    ]);
  });
  it('should arm with timer then disarm a house and have no timeout left', async () => {
    await house.update('test-house', {
      alarm_delay_before_arming: 5,
      alarm_mode: ALARM_MODES.DISARMED,
    });
    await house.arm('test-house');
    sinon.reset();
    await house.disarm('test-house');
    // Timeout should be deleted
    expect(house.armingHouseTimeout.size).to.equal(0);
    // The UI & the scenes should be notified the house is disarmed
    assert.calledTwice(event.emit);
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.DISARM,
        house: 'test-house',
      },
    ]);
    expect(event.emit.secondCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED,
        payload: {
          house: 'test-house',
        },
      },
    ]);
  });
  it('should not arm the house after the delay when arming was cancelled', async () => {
    await house.update('test-house', {
      alarm_delay_before_arming: 0.001,
      alarm_mode: ALARM_MODES.DISARMED,
    });
    await house.arm('test-house');
    await house.disarm('test-house');
    // Wait for the arming delay to be over
    await Promise.delay(20);
    const houseInDb = await house.getBySelector('test-house');
    expect(houseInDb.alarm_mode).to.equal(ALARM_MODES.DISARMED);
  });
  it('should return house not found', async () => {
    const promise = house.disarm('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return house is already disarmed error', async () => {
    await house.disarm('test-house');
    const promise = house.disarm('test-house');
    return assertChai.isRejected(promise, 'House is already disarmed');
  });
});
