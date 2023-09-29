const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, ALARM_MODES } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.disarm', () => {
  const house = new House(event);
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
    const promise = house.disarm('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return house is already disarmed error', async () => {
    await house.disarm('test-house');
    const promise = house.disarm('test-house');
    return assertChai.isRejected(promise, 'House is already disarmed');
  });
});
