const { expect } = require('chai');
const Promise = require('bluebird');
const assertChai = require('chai').assert;
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const House = require('../../../lib/house');

// The three arming modes go through the same code path and only differ by the events they
// announce themselves with, so every one of them is checked against its own pair.
const ARM_MODES = [
  {
    mode: ALARM_MODES.PRESENCE_ARMED,
    trigger: EVENTS.ALARM.PRESENCE_ARM,
    websocket: WEBSOCKET_MESSAGE_TYPES.ALARM.PRESENCE_ARMED,
  },
  {
    mode: ALARM_MODES.NIGHT_ARMED,
    trigger: EVENTS.ALARM.NIGHT_ARM,
    websocket: WEBSOCKET_MESSAGE_TYPES.ALARM.NIGHT_ARMED,
  },
  {
    mode: ALARM_MODES.AWAY_ARMED,
    trigger: EVENTS.ALARM.AWAY_ARM,
    websocket: WEBSOCKET_MESSAGE_TYPES.ALARM.AWAY_ARMED,
  },
];

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
      alarm_mode: ALARM_MODES.DISARMED,
    });
    sinon.reset();
  });
  afterEach(() => {
    sinon.reset();
  });

  ARM_MODES.forEach(({ mode, trigger, websocket }) => {
    it(`should arm a house in mode ${mode} after the delay`, async () => {
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
      await house.arm('test-house', mode);

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
            mode,
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
          type: trigger,
          house: 'test-house',
        },
      ]);
      expect(originalEmit.args[3]).to.deep.equal([
        EVENTS.WEBSOCKET.SEND_ALL,
        {
          type: websocket,
          payload: {
            house: 'test-house',
          },
        },
      ]);
    });

    it(`should arm a house in mode ${mode} immediately`, async () => {
      await house.arm('test-house', mode, true);
      assert.callCount(event.emit, 4);
      expect(event.emit.thirdCall.args).to.deep.equal([
        EVENTS.TRIGGERS.CHECK,
        {
          type: trigger,
          house: 'test-house',
        },
      ]);
      expect(event.emit.args[3]).to.deep.equal([
        EVENTS.WEBSOCKET.SEND_ALL,
        {
          type: websocket,
          payload: {
            house: 'test-house',
          },
        },
      ]);
    });

    it(`should return house is already armed in mode ${mode}`, async () => {
      await house.arm('test-house', mode, true);
      const promise = house.arm('test-house', mode);
      return assertChai.isRejected(promise, `House is already armed in mode ${mode}`);
    });
  });

  it('should reject a mode that is not an arming mode', async () => {
    const promise = house.arm('test-house', ALARM_MODES.TRIGGERED);
    return assertChai.isRejected(promise, '"triggered" is not an alarm arming mode');
  });
  it('should reject an unknown mode', async () => {
    const promise = house.arm('test-house', 'partially-armed');
    return assertChai.isRejected(promise, '"partially-armed" is not an alarm arming mode');
  });
  it('should return house not found', async () => {
    const promise = house.arm('house-not-found', ALARM_MODES.AWAY_ARMED);
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should switch from one arming mode to another', async () => {
    await house.arm('test-house', ALARM_MODES.PRESENCE_ARMED, true);
    await house.arm('test-house', ALARM_MODES.NIGHT_ARMED, true);
    const updatedHouse = await house.getBySelector('test-house');
    expect(updatedHouse.alarm_mode).to.equal(ALARM_MODES.NIGHT_ARMED);
  });
  it('should call setTabletModeLocked when alarm_code is set', async () => {
    const session = {
      setTabletModeLocked: fake.resolves(null),
    };
    house = new House(event, {}, session);
    // Set alarm_code on the house
    await house.update('test-house', {
      alarm_code: '1234',
      alarm_delay_before_arming: 0,
      alarm_mode: ALARM_MODES.DISARMED,
    });

    await house.arm('test-house', ALARM_MODES.NIGHT_ARMED, true);

    assert.calledOnce(session.setTabletModeLocked);
    assert.calledWith(session.setTabletModeLocked, 'a741dfa6-24de-4b46-afc7-370772f068d5');
  });
  it('should not call setTabletModeLocked when alarm_code is null', async () => {
    const session = {
      setTabletModeLocked: fake.resolves(null),
    };
    house = new House(event, {}, session);
    // Ensure alarm_code is null
    await house.update('test-house', {
      alarm_code: null,
      alarm_delay_before_arming: 0,
      alarm_mode: ALARM_MODES.DISARMED,
    });

    await house.arm('test-house', ALARM_MODES.PRESENCE_ARMED, true);

    assert.notCalled(session.setTabletModeLocked);
  });
});
