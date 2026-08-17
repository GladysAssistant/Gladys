import dayjs from 'dayjs';

import { uuid, minutesAgo, hoursAgo } from './helpers';
import { USERS } from './home';

/**
 * Scenes, calendar events and chat history of the demo instance.
 *
 * The scenes are the ones a real user writes first (wake up, movie night,
 * leaving home, water leak alert...) so the scene list and the scene editor
 * both show something meaningful.
 */

const scene = ({ name, selector, icon, description, tags = [], triggers = [], actions = [], lastExecuted }) => ({
  id: uuid(`scene-${selector}`),
  name,
  selector,
  icon,
  description,
  active: true,
  tags: tags.map(tagName => ({ name: tagName })),
  triggers,
  actions,
  last_executed: lastExecuted,
  created_at: '2024-02-11T10:00:00.000Z',
  updated_at: '2024-02-11T10:00:00.000Z'
});

const scenes = [
  scene({
    name: 'Good morning',
    selector: 'good-morning',
    icon: 'sunrise',
    description: 'Opens the shutters, turns the kitchen on and starts the coffee machine.',
    tags: ['Comfort'],
    lastExecuted: hoursAgo(6),
    triggers: [
      {
        type: 'time.changed',
        scheduler_type: 'every-week',
        time: '07:00',
        days_of_the_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    ],
    actions: [
      [{ type: 'device.set-value', device_feature: 'living-room-shutter-position', value: 100 }],
      [{ type: 'light.turn-on', devices: ['kitchen-spots'] }],
      [{ type: 'switch.turn-on', devices: ['kitchen-coffee-plug'] }],
      [{ type: 'delay', value: 10, unit: 'minutes' }],
      [{ type: 'message.send', user: 'tony', text: 'Good morning! Coffee is ready ☕' }]
    ]
  }),
  scene({
    name: 'Movie night',
    selector: 'movie-night',
    icon: 'film',
    description: 'Dims the living room and closes the shutters when the TV turns on.',
    tags: ['Comfort'],
    lastExecuted: hoursAgo(30),
    triggers: [
      {
        type: 'device.new-state',
        device_feature: 'living-room-tv-binary',
        operator: '=',
        value: 1
      }
    ],
    actions: [
      [{ type: 'device.set-value', device_feature: 'living-room-ceiling-light-brightness', value: 15 }],
      [{ type: 'light.turn-on', devices: ['living-room-tv-lamp'] }],
      [{ type: 'device.set-value', device_feature: 'living-room-shutter-position', value: 0 }]
    ]
  }),
  scene({
    name: 'Leaving home',
    selector: 'leaving-home',
    icon: 'log-out',
    description: 'Turns everything off and arms the alarm once the house is empty.',
    tags: ['Security', 'Energy'],
    lastExecuted: hoursAgo(9),
    triggers: [{ type: 'house.empty', house: 'main-house' }],
    actions: [
      [{ type: 'light.turn-off', devices: ['living-room-ceiling-light', 'kitchen-spots', 'office-light'] }],
      [{ type: 'switch.turn-off', devices: ['office-plug'] }],
      [{ type: 'alarm.set-alarm-mode', house: 'main-house', alarm_mode: 'armed' }]
    ]
  }),
  scene({
    name: 'Good night',
    selector: 'good-night',
    icon: 'moon',
    description: 'Closes the shutters, turns the lights off and lowers the heating.',
    tags: ['Comfort', 'Energy'],
    lastExecuted: hoursAgo(18),
    triggers: [
      {
        type: 'time.changed',
        scheduler_type: 'every-day',
        time: '23:00'
      }
    ],
    actions: [
      [{ type: 'light.turn-off', devices: ['living-room-ceiling-light', 'living-room-tv-lamp', 'kitchen-spots'] }],
      [{ type: 'device.set-value', device_feature: 'bedroom-shutter-position', value: 0 }],
      [{ type: 'device.set-value', device_feature: 'bedroom-thermostat-target', value: 18 }]
    ]
  }),
  scene({
    name: 'Water leak alert',
    selector: 'water-leak-alert',
    icon: 'droplet',
    description: 'Warns everyone as soon as the sensor under the sink detects water.',
    tags: ['Security'],
    triggers: [
      {
        type: 'device.new-state',
        device_feature: 'kitchen-leak',
        operator: '=',
        value: 1
      }
    ],
    actions: [
      [
        { type: 'message.send', user: 'tony', text: '🚨 Water leak detected in the kitchen!' },
        { type: 'message.send', user: 'pepper', text: '🚨 Water leak detected in the kitchen!' }
      ]
    ]
  }),
  scene({
    name: 'Charge the car with the sun',
    selector: 'solar-car-charge',
    icon: 'sun',
    description: 'Starts charging the car when solar production covers it.',
    tags: ['Energy'],
    lastExecuted: hoursAgo(28),
    triggers: [
      {
        type: 'device.new-state',
        device_feature: 'solar-power',
        operator: '>',
        value: 2000
      }
    ],
    actions: [
      [{ type: 'condition.only-continue-if', conditions: [] }],
      [{ type: 'device.set-value', device_feature: 'garage-wallbox-charge', value: 1 }]
    ]
  })
];

const sceneTags = [{ name: 'Comfort' }, { name: 'Energy' }, { name: 'Security' }];

// --- Calendar ------------------------------------------------------------

const calendars = [
  {
    id: uuid('calendar-family'),
    name: 'Family',
    selector: 'family',
    color: '#5f6ac4',
    external_id: 'family'
  },
  {
    id: uuid('calendar-work'),
    name: 'Work',
    selector: 'work',
    color: '#f1c40f',
    external_id: 'work'
  }
];

const event = (name, calendar, startDay, startHour, durationHours) => {
  const start = dayjs()
    .startOf('week')
    .add(startDay, 'day')
    .add(startHour, 'hour');
  return {
    id: uuid(`event-${name}-${startDay}`),
    name,
    selector: `event-${startDay}-${startHour}`,
    calendar_id: calendar.id,
    calendar,
    start: start.toISOString(),
    end: start.add(durationHours, 'hour').toISOString(),
    full_day: false
  };
};

const calendarEvents = [
  event('Yoga class', calendars[0], 1, 19, 1),
  event('Team meeting', calendars[1], 2, 10, 1),
  event('Dentist', calendars[0], 3, 15, 1),
  event('Dinner with Pepper', calendars[0], 5, 20, 2),
  event('Sprint review', calendars[1], 4, 14, 2),
  event('Swimming pool', calendars[0], 6, 11, 2)
];

// --- Chat ----------------------------------------------------------------

const TONY_ID = USERS[0].id;

const message = (index, text, fromGladys) => ({
  id: uuid(`message-${index}`),
  sender_id: fromGladys ? null : TONY_ID,
  receiver_id: fromGladys ? TONY_ID : null,
  text,
  is_read: true,
  created_at: minutesAgo(60 - index)
});

const messages = [
  message(0, 'What is the temperature in the living room?', false),
  message(1, 'It is 21.4°C in the living room.', true),
  message(2, 'Turn on the kitchen light', false),
  message(3, 'The kitchen light is on.', true),
  message(4, 'How much electricity did we use today?', false),
  message(5, 'You used 9.4 kWh today, and your solar panels produced 14.6 kWh.', true),
  message(6, 'What is the weather like tomorrow?', false),
  message(7, 'Tomorrow will be mostly sunny, between 14°C and 24°C.', true)
].reverse();

export { scenes, sceneTags, calendars, calendarEvents, messages };
