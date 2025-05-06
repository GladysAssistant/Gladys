const { expect } = require('chai');
const Promise = require('bluebird');
const assertChai = require('chai').assert;
const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const House = require('../../../lib/house');

describe('house.arm', () => {
  let house;
  let event;
  beforeEach(async () => {
    const session = {
      setTabletModeLocked: fake.resolves(null),
    };
    event = {
      emit: fake.returns(null),
    };
    house = new House(event, {}, session);
    await house.update('test-house', {
      alarm_delay_before_arming: 0.001,
    });
    sinon.reset();
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should arm a house', async () => {
    const originalEmit = event.emit;
    // Create a promise that resolves when all events are emitted
    const eventsPromise = new Promise((resolve) => {
      let eventCount = 0;

      // @ts-ignore
      event.emit = (...args) => {
        originalEmit.apply(event, args);
        eventCount += 1;
        if (eventCount === 4) {
          resolve();
        }
      };
    });

    // Start arming the house
    await house.arm('test-house');

    // Wait for all events to be emitted
    await eventsPromise;

    // Verify the events
    assert.callCount(originalEmit, 4);
    expect(originalEmit.firstCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING,
        payload: {
          house: 'test-house',
        },
      },
    ]);
    expect(originalEmit.secondCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.ARMING,
        house: 'test-house',
      },
    ]);
    expect(originalEmit.thirdCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.ARM,
        house: 'test-house',
      },
    ]);
    expect(originalEmit.args[3]).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED,
        payload: {
          house: 'test-house',
        },
      },
    ]);
  });
  it('should arm a house immediately', async () => {
    await house.arm('test-house', true);
    assert.callCount(event.emit, 4);
    expect(event.emit.firstCall.args).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING,
        payload: {
          house: 'test-house',
        },
      },
    ]);
    expect(event.emit.secondCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.ARMING,
        house: 'test-house',
      },
    ]);
    expect(event.emit.thirdCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.ARM,
        house: 'test-house',
      },
    ]);
    expect(event.emit.args[3]).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED,
        payload: {
          house: 'test-house',
        },
      },
    ]);
  });
  it('should return house not found', async () => {
    const promise = house.arm('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return house is already armed error', async () => {
    await house.arm('test-house', true);
    const promise = house.arm('test-house');
    return assertChai.isRejected(promise, 'House is already armed');
  });
});
