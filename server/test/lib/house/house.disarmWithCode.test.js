const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, ALARM_MODES } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.disarmWithCode', () => {
  const house = new House(event);
  beforeEach(async () => {
    await house.update('test-house', {
      alarm_code: '123456',
      alarm_delay_before_arming: 0,
      alarm_mode: ALARM_MODES.ARMED,
    });
    sinon.reset();
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should disarm a house with code', async () => {
    await house.disarmWithCode('test-house', '123456');
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
  it('should return house not found', async () => {
    const promise = house.disarmWithCode('house-not-found', '123456');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return wrong code', async () => {
    const promise = house.disarmWithCode('test-house', '12');
    return assertChai.isRejected(promise, 'Invalid code');
  });
  it('should return house is already disarmed error', async () => {
    await house.disarmWithCode('test-house', '123456');
    const promise = house.disarmWithCode('test-house', '123456');
    return assertChai.isRejected(promise, 'House is already disarmed');
  });
});
