const EventEmitter = require('events');
const logger = require('../../utils/logger');
const StateManager = require('../../lib/state');
const { EVENT_LIST, CONDITIONS, STATES } = require('../../utils/constants');

const event = new EventEmitter();
const stateManager = new StateManager();

const NUMBER_OF_LISTENERS = 300;
const NUMBER_OF_CONDITIONS_PER_TRIGGER = 5;
const NUMBER_OF_HOUSE_STATES = 1000;
const NUMBER_OF_EVENTS_TO_THROW = 1000 * 1000;

const EVENTS_TO_THROW = [];

const displayNumberOfEventProcessedBySeconds = (time) => {
  const elapsed = process.hrtime(time)[1] / 1000000; // divide by a million to get nano to milli
  const perSecond = (1000 * NUMBER_OF_EVENTS_TO_THROW) / elapsed;
  const millionEventProcessedPerSecond = perSecond / 1000000;
  const millionEventProcessedPerSecondBeautiful = Math.round(millionEventProcessedPerSecond * 100) / 100;
  logger.info(
    `Processed 1 million events in ${elapsed} ms, so ${millionEventProcessedPerSecondBeautiful}M events/per second`,
  );
};

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

for (let a = 0; a < NUMBER_OF_EVENTS_TO_THROW; a += 1) {
  const oneEvent = EVENT_LIST[getRandomInt(0, EVENT_LIST.length)];
  EVENTS_TO_THROW.push(oneEvent);
}

for (let b = 0; b < NUMBER_OF_HOUSE_STATES; b += 1) {
  // init stateManager
  stateManager.setState('house', String(b), {
    alarm: getRandomInt(0, 1) === 1 ? STATES.HOUSE_ALARM.ARMED : STATES.HOUSE_ALARM.DISARMED,
  });
}

for (let i = 0; i < NUMBER_OF_LISTENERS; i += 1) {
  const listener = {
    id: i,
    type: EVENT_LIST[getRandomInt(0, EVENT_LIST.length)],
    conditions: [],
    scenes: [],
  };
  for (let j = 0; j < NUMBER_OF_CONDITIONS_PER_TRIGGER; j += 1) {
    listener.conditions.push({
      type: getRandomInt(0, 1) === 1 ? CONDITIONS.HOUSE_ALARM.IS_ARMED : CONDITIONS.HOUSE_ALARM.IS_DISARMED,
      house: j,
      or: [
        {
          type: getRandomInt(0, 1) === 1 ? CONDITIONS.HOUSE_ALARM.IS_ARMED : CONDITIONS.HOUSE_ALARM.IS_DISARMED,
          house: j,
        },
      ],
    });
  }
}

// eslint-disable-next-line no-constant-condition
while (1) {
  const start = process.hrtime();
  EVENTS_TO_THROW.forEach((item, index) => {
    event.emit(item, {});
  });
  displayNumberOfEventProcessedBySeconds(start);
}
