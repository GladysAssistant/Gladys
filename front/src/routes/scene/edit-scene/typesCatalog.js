import { ACTIONS, EVENTS } from '../../../../../server/utils/constants';

// Icons used for each action type, in the picker and in the action card headers
export const ACTION_ICON = {
  [ACTIONS.LIGHT.TURN_ON]: 'fe fe-toggle-right',
  [ACTIONS.LIGHT.TURN_OFF]: 'fe fe-toggle-left',
  [ACTIONS.LIGHT.TOGGLE]: 'fe fe-shuffle',
  [ACTIONS.LIGHT.BLINK]: 'fe fe-star',
  [ACTIONS.SWITCH.TURN_ON]: 'fe fe-toggle-right',
  [ACTIONS.SWITCH.TURN_OFF]: 'fe fe-toggle-left',
  [ACTIONS.SWITCH.TOGGLE]: 'fe fe-shuffle',
  [ACTIONS.TIME.DELAY]: 'fe fe-clock',
  [ACTIONS.MESSAGE.SEND]: 'fe fe-message-square',
  [ACTIONS.MESSAGE.SEND_CAMERA]: 'fe fe-camera',
  [ACTIONS.CONDITION.IF_THEN_ELSE]: 'fe fe-git-branch',
  [ACTIONS.CONDITION.WHILE]: 'fe fe-repeat',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'fe fe-shuffle',
  [ACTIONS.DEVICE.GET_VALUE]: 'fe fe-refresh-cw',
  [ACTIONS.USER.SET_SEEN_AT_HOME]: 'fe fe-home',
  [ACTIONS.USER.SET_OUT_OF_HOME]: 'fe fe-log-out',
  [ACTIONS.HTTP.REQUEST]: 'fe fe-link',
  [ACTIONS.USER.CHECK_PRESENCE]: 'fe fe-user-check',
  [ACTIONS.CONDITION.CHECK_TIME]: 'fe fe-watch',
  [ACTIONS.SCENE.START]: 'fe fe-fast-forward',
  [ACTIONS.HOUSE.IS_EMPTY]: 'fe fe-home',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'fe fe-home',
  [ACTIONS.DEVICE.SET_VALUE]: 'fe fe-radio',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'fe fe-calendar',
  [ACTIONS.CALENDAR.GET_EVENTS]: 'fe fe-calendar',
  [ACTIONS.ECOWATT.CONDITION]: 'fe fe-zap',
  [ACTIONS.EDF_TEMPO.CONDITION]: 'fe fe-zap',
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: 'fe fe-bell',
  [ACTIONS.ALARM.SET_ALARM_MODE]: 'fe fe-bell',
  [ACTIONS.MQTT.SEND]: 'fe fe-message-square',
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: 'fe fe-speaker',
  [ACTIONS.ZIGBEE2MQTT.SEND]: 'fe fe-message-square',
  [ACTIONS.AI.ASK]: 'fe fe-cpu',
  [ACTIONS.SMS.SEND]: 'fe fe-message-circle',
  [ACTIONS.VARIABLE.SET]: 'fe fe-hash',
  [ACTIONS.TIME.GET_DATE]: 'fe fe-clock'
};

// Action types on their way out. They stay in the picker because existing scenes
// still use them, but they carry a "soon deprecated" badge.
export const DEPRECATED_ACTIONS = [ACTIONS.SMS.SEND];

// Icons used for each trigger type, in the picker and in the trigger card headers
export const TRIGGER_ICON = {
  [EVENTS.DEVICE.NEW_STATE]: 'fe fe-activity',
  [EVENTS.TIME.CHANGED]: 'fe fe-watch',
  [EVENTS.TIME.SUNSET]: 'fe fe-sunset',
  [EVENTS.TIME.SUNRISE]: 'fe fe-sunrise',
  [EVENTS.USER_PRESENCE.BACK_HOME]: 'fe fe-home',
  [EVENTS.USER_PRESENCE.LEFT_HOME]: 'fe fe-log-out',
  [EVENTS.HOUSE.EMPTY]: 'fe fe-home',
  [EVENTS.HOUSE.NO_LONGER_EMPTY]: 'fe fe-home',
  [EVENTS.AREA.USER_ENTERED]: 'fe fe-compass',
  [EVENTS.AREA.USER_LEFT]: 'fe fe-compass',
  [EVENTS.CALENDAR.EVENT_IS_COMING]: 'fe fe-calendar',
  [EVENTS.ALARM.ARM]: 'fe fe-bell',
  [EVENTS.ALARM.ARMING]: 'fe fe-clock',
  [EVENTS.ALARM.PARTIAL_ARM]: 'fe fe-bell',
  [EVENTS.ALARM.DISARM]: 'fe fe-bell-off',
  [EVENTS.ALARM.PANIC]: 'fe fe-alert-triangle',
  [EVENTS.ALARM.TOO_MANY_CODES_TESTS]: 'fe fe-alert-triangle',
  [EVENTS.SYSTEM.START]: 'fe fe-activity',
  [EVENTS.MQTT.RECEIVED]: 'fe fe-hash',
  [EVENTS.WEATHER.ALERT_RAISED]: 'fe fe-alert-triangle',
  [EVENTS.WEATHER.ALERT_ENDED]: 'fe fe-check-circle'
};

// Actions grouped by category, in the order they are displayed in the picker.
// The "color" only tints the icon of the category items in the picker.
export const ACTION_CATEGORIES = [
  {
    key: 'devices',
    color: 'green',
    items: [
      ACTIONS.LIGHT.TURN_ON,
      ACTIONS.LIGHT.TURN_OFF,
      ACTIONS.LIGHT.TOGGLE,
      ACTIONS.LIGHT.BLINK,
      ACTIONS.SWITCH.TURN_ON,
      ACTIONS.SWITCH.TURN_OFF,
      ACTIONS.SWITCH.TOGGLE,
      ACTIONS.DEVICE.SET_VALUE,
      ACTIONS.DEVICE.GET_VALUE
    ]
  },
  {
    key: 'messages',
    color: 'pink',
    items: [ACTIONS.MESSAGE.SEND, ACTIONS.MESSAGE.SEND_CAMERA, ACTIONS.SMS.SEND, ACTIONS.MUSIC.PLAY_NOTIFICATION]
  },
  {
    key: 'conditions',
    color: 'purple',
    items: [
      ACTIONS.CONDITION.IF_THEN_ELSE,
      ACTIONS.CONDITION.ONLY_CONTINUE_IF,
      ACTIONS.CONDITION.WHILE,
      ACTIONS.CONDITION.CHECK_TIME,
      ACTIONS.USER.CHECK_PRESENCE,
      ACTIONS.HOUSE.IS_EMPTY,
      ACTIONS.HOUSE.IS_NOT_EMPTY,
      ACTIONS.ALARM.CHECK_ALARM_MODE,
      ACTIONS.CALENDAR.IS_EVENT_RUNNING,
      ACTIONS.ECOWATT.CONDITION,
      ACTIONS.EDF_TEMPO.CONDITION
    ]
  },
  {
    key: 'flow',
    color: 'blue',
    items: [ACTIONS.TIME.DELAY, ACTIONS.SCENE.START]
  },
  {
    key: 'homeSecurity',
    color: 'orange',
    items: [ACTIONS.ALARM.SET_ALARM_MODE, ACTIONS.USER.SET_SEEN_AT_HOME, ACTIONS.USER.SET_OUT_OF_HOME]
  },
  {
    key: 'advanced',
    color: 'gray',
    items: [
      ACTIONS.HTTP.REQUEST,
      ACTIONS.CALENDAR.GET_EVENTS,
      ACTIONS.MQTT.SEND,
      ACTIONS.ZIGBEE2MQTT.SEND,
      ACTIONS.AI.ASK,
      ACTIONS.VARIABLE.SET,
      ACTIONS.TIME.GET_DATE
    ]
  }
];

// Maps each category color to its CSS module class (defined in style.css)
export const COLOR_CLASS = {
  green: 'typePickerIconGreen',
  pink: 'typePickerIconPink',
  purple: 'typePickerIconPurple',
  blue: 'typePickerIconBlue',
  orange: 'typePickerIconOrange',
  red: 'typePickerIconRed',
  yellow: 'typePickerIconYellow',
  gray: 'typePickerIconGray'
};

const buildColorMap = categories =>
  categories.reduce((colors, category) => {
    category.items.forEach(item => {
      colors[item] = category.color;
    });
    return colors;
  }, {});

// Triggers grouped by category, in the order they are displayed in the picker
export const TRIGGER_CATEGORIES = [
  {
    key: 'devices',
    color: 'green',
    items: [EVENTS.DEVICE.NEW_STATE]
  },
  {
    key: 'time',
    color: 'blue',
    items: [EVENTS.TIME.CHANGED, EVENTS.TIME.SUNRISE, EVENTS.TIME.SUNSET, EVENTS.CALENDAR.EVENT_IS_COMING]
  },
  {
    key: 'presence',
    color: 'orange',
    items: [
      EVENTS.USER_PRESENCE.BACK_HOME,
      EVENTS.USER_PRESENCE.LEFT_HOME,
      EVENTS.HOUSE.EMPTY,
      EVENTS.HOUSE.NO_LONGER_EMPTY,
      EVENTS.AREA.USER_ENTERED,
      EVENTS.AREA.USER_LEFT
    ]
  },
  {
    key: 'alarm',
    color: 'red',
    items: [
      EVENTS.ALARM.ARM,
      EVENTS.ALARM.ARMING,
      EVENTS.ALARM.PARTIAL_ARM,
      EVENTS.ALARM.DISARM,
      EVENTS.ALARM.PANIC,
      EVENTS.ALARM.TOO_MANY_CODES_TESTS
    ]
  },
  {
    key: 'weather',
    color: 'yellow',
    items: [EVENTS.WEATHER.ALERT_RAISED, EVENTS.WEATHER.ALERT_ENDED]
  },
  {
    key: 'advanced',
    color: 'gray',
    items: [EVENTS.SYSTEM.START, EVENTS.MQTT.RECEIVED]
  }
];

// Category color of each action / trigger type, for the card icon tiles
export const ACTION_COLOR = buildColorMap(ACTION_CATEGORIES);
export const TRIGGER_COLOR = buildColorMap(TRIGGER_CATEGORIES);
