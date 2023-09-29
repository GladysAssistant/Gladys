const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.panic', () => {
  const house = new House(event);
  afterEach(() => {
    sinon.reset();
  });
  it('should set house in panic mode', async () => {
    await house.panic('test-house');
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
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.PANIC,
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
  it('should return house is already in panic mode error', async () => {
    await house.panic('test-house');
    const promise = house.panic('test-house');
    return assertChai.isRejected(promise, 'House is already in panic mode');
  });
});
