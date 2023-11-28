const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.partialArm', () => {
  const house = new House(event);
  afterEach(() => {
    sinon.reset();
  });
  it('should set house in partial arm mode', async () => {
    await house.partialArm('test-house');
    assert.calledTwice(event.emit);
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.PARTIAL_ARM,
        house: 'test-house',
      },
    ]);
    expect(event.emit.secondCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.PARTIALLY_ARMED,
        payload: {
          house: 'test-house',
        },
      },
    ]);
  });
  it('should return house not found', async () => {
    const promise = house.partialArm('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return house is already partially armed mode error', async () => {
    await house.partialArm('test-house');
    const promise = house.partialArm('test-house');
    return assertChai.isRejected(promise, 'House is already partially armed');
  });
});
