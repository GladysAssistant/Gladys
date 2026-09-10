const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.panic', () => {
  const house = new House(event);
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
});
