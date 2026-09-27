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

// Nobody asked, which is what a scene or an integration looks like in an alarm event.
const NOBODY = { user: null, user_name: null };

describe('house.arm', () => {
  let house;
  let event;
  let alarmCode;
  beforeEach(async () => {
    const session = {
      setTabletModeLocked: fake.resolves(null),
    };
    event = {
      emit: fake.returns(null),
    };
    alarmCode = {
      existsActive: fake.resolves(true),
    };
    house = new House(event, {}, session, {}, alarmCode);
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
            ...NOBODY,
          },
        },
      ]);
      expect(originalEmit.secondCall.args).to.deep.equal([
        EVENTS.TRIGGERS.CHECK,
        {
          type: EVENTS.ALARM.ARMING,
          house: 'test-house',
          ...NOBODY,
        },
      ]);
      expect(originalEmit.thirdCall.args).to.deep.equal([
        EVENTS.TRIGGERS.CHECK,
        {
          type: trigger,
          house: 'test-house',
          ...NOBODY,
        },
      ]);
      expect(originalEmit.args[3]).to.deep.equal([
        EVENTS.WEBSOCKET.SEND_ALL,
        {
          type: websocket,
          payload: {
            house: 'test-house',
            ...NOBODY,
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
          ...NOBODY,
        },
      ]);
      expect(event.emit.args[3]).to.deep.equal([
        EVENTS.WEBSOCKET.SEND_ALL,
        {
          type: websocket,
          payload: {
            house: 'test-house',
            ...NOBODY,
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

  it('should replace a pending arming instead of stacking a second one', async () => {
    await house.update('test-house', { alarm_delay_before_arming: 0.05 });
    sinon.reset();

    await house.arm('test-house', ALARM_MODES.PRESENCE_ARMED);
    await house.arm('test-house', ALARM_MODES.NIGHT_ARMED);
    expect(house.armingHouseTimeout.size).to.equal(1);

    await Promise.delay(120);

    // Only the mode asked for last is written, and the one it replaced never announced itself
    const houseInDb = await house.getBySelector('test-house');
    expect(houseInDb.alarm_mode).to.equal(ALARM_MODES.NIGHT_ARMED);
    const triggerTypes = event.emit
      .getCalls()
      .filter((call) => call.args[0] === EVENTS.TRIGGERS.CHECK)
      .map((call) => call.args[1].type);
    expect(triggerTypes).to.not.include(EVENTS.ALARM.PRESENCE_ARM);
    expect(triggerTypes).to.include(EVENTS.ALARM.NIGHT_ARM);
  });
  it('should stop reporting an arming in progress once the delay is over', async () => {
    await house.update('test-house', { alarm_delay_before_arming: 0.05 });
    await house.arm('test-house', ALARM_MODES.AWAY_ARMED);
    expect(house.armingHouseTimeout.has('test-house')).to.equal(true);

    await Promise.delay(120);

    expect(house.armingHouseTimeout.has('test-house')).to.equal(false);
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
  it('should name who armed the house in its events', async () => {
    await house.arm('test-house', ALARM_MODES.AWAY_ARMED, true, { user: 'john', user_name: 'John' });

    expect(event.emit.thirdCall.args).to.deep.equal([
      EVENTS.TRIGGERS.CHECK,
      {
        type: EVENTS.ALARM.AWAY_ARM,
        house: 'test-house',
        user: 'john',
        user_name: 'John',
      },
    ]);
    expect(event.emit.args[3]).to.deep.equal([
      EVENTS.WEBSOCKET.SEND_ALL,
      {
        type: WEBSOCKET_MESSAGE_TYPES.ALARM.AWAY_ARMED,
        payload: {
          house: 'test-house',
          user: 'john',
          user_name: 'John',
        },
      },
    ]);
  });
  it('should call setTabletModeLocked when an alarm code exists', async () => {
    const session = {
      setTabletModeLocked: fake.resolves(null),
    };
    house = new House(event, {}, session, {}, { existsActive: fake.resolves(true) });
    await house.update('test-house', {
      alarm_delay_before_arming: 0,
      alarm_mode: ALARM_MODES.DISARMED,
    });

    await house.arm('test-house', ALARM_MODES.NIGHT_ARMED, true);

    assert.calledOnce(session.setTabletModeLocked);
    assert.calledWith(session.setTabletModeLocked, 'a741dfa6-24de-4b46-afc7-370772f068d5');
  });
  it('should not call setTabletModeLocked when no alarm code exists', async () => {
    const session = {
      setTabletModeLocked: fake.resolves(null),
    };
    // Locking a tablet nobody can unlock would leave it stuck on the keypad
    house = new House(event, {}, session, {}, { existsActive: fake.resolves(false) });
    await house.update('test-house', {
      alarm_delay_before_arming: 0,
      alarm_mode: ALARM_MODES.DISARMED,
    });

    await house.arm('test-house', ALARM_MODES.PRESENCE_ARMED, true);

    assert.notCalled(session.setTabletModeLocked);
  });
});
