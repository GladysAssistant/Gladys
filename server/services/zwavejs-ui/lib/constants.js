const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  OPENING_SENSOR_STATE,
  STATE,
  BUTTON_STATUS,
  COVER_STATE,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');

const CONFIGURATION = {
  ZWAVEJS_UI_MQTT_URL_KEY: 'ZWAVEJS_UI_MQTT_URL',
  ZWAVEJS_UI_MQTT_USERNAME_KEY: 'ZWAVEJS_UI_MQTT_USERNAME',
  ZWAVEJS_UI_MQTT_PASSWORD_KEY: 'ZWAVEJS_UI_MQTT_PASSWORD',
};

const PARAMS = {
  LOCATION: `location`,
};

const multilevelSwitchCurtainsStateDefault = {
  currentvalue: [
    {
      feature_name: 'position',
      converter: (val) => val,
    },
  ],
};

/**
 * Convert a zWave value format to the
 * Gladys format.
 */
const STATES = {
  alarm_sensor: {
    state: [{ converter: (val) => (val > 0 ? STATE.ON : STATE.OFF) }],
  },
  battery: {
    level: [{ converter: (val) => val }],
    islow: [
      {
        converter: (val) => {
          switch (val) {
            case false:
              return STATE.OFF;
            case true:
              return STATE.ON;
            default:
              return null;
          }
        },
      },
    ],
  },
  binary_sensor: {
    any: [
      {
        converter: (val) => {
          switch (val) {
            case false:
              return STATE.OFF;
            case true:
              return STATE.ON;
            default:
              return null;
          }
        },
      },
    ],
    general_purpose: [
      {
        converter: (val) => {
          switch (val) {
            case false:
              return STATE.OFF;
            case true:
              return STATE.ON;
            default:
              return null;
          }
        },
      },
    ],
  },
  binary_switch: {
    currentvalue: [
      {
        converter: (val) => {
          switch (val) {
            case false:
              return STATE.OFF;
            case true:
              return STATE.ON;
            default:
              return null;
          }
        },
      },
    ],
  },
  central_scene: {
    scene: [
      {
        converter: (val) => {
          switch (val) {
            case 0:
              return BUTTON_STATUS.CLICK;
            case 1:
              return BUTTON_STATUS.RELEASE;
            case 2:
              return BUTTON_STATUS.HOLD_CLICK;
            case 3:
              return BUTTON_STATUS.DOUBLE_CLICK;
            case 4:
              return BUTTON_STATUS.TRIPLE;
            default:
              return null;
          }
        },
      },
    ],
  },
  multilevel_sensor: {
    air_temperature: [{ converter: (val) => val }],
    illuminance: [{ converter: (val) => val }],
    power: [{ converter: (val) => val }],
  },
  multilevel_switch: {
    currentvalue: [
      {
        feature_name: 'position',
        converter: (val) => val,
      },
      {
        feature_name: 'state',
        converter: (val) => (val > 0 ? STATE.ON : STATE.OFF),
      },
      {
        property_name: 'restoreprevious',
        converter: (val) => (val > 0 ? STATE.ON : STATE.OFF),
      },
    ],
    '17-5': multilevelSwitchCurtainsStateDefault,
    '17-6': multilevelSwitchCurtainsStateDefault,
    '17-7': multilevelSwitchCurtainsStateDefault,
  },
  notification: {
    access_control: {
      door_state_simple: [
        {
          converter: (val) => {
            switch (val) {
              case 22:
                return OPENING_SENSOR_STATE.OPEN;
              case 23:
                return OPENING_SENSOR_STATE.CLOSE;
              default:
                return null;
            }
          },
        },
      ],
    },
  },
};

/**
 * @description Build a command action.
 * @param {string} name - Command name.
 * @param {any[]} value - Value to send to the command.
 * @param {Array|null} stateUpdate - State synchronization.
 * @returns {object} Action to perform.
 * @example buildCommandAction('stopLevelChange', []);
 */
function buildCommandAction(name, value, stateUpdate = null) {
  return {
    isCommand: true,
    name,
    value,
    stateUpdate: stateUpdate || [],
  };
}

/**
 * @description Build a writeValue action.
 * @param {string} property - Property name.
 * @param {any} value - Value to write.
 * @param {Array|null} stateUpdate - State synchronization.
 * @returns {object} Action to perform.
 * @example buildWriteValueAction('targetValue', 99, [{property_name: 'position', feature_name: 'position', value: 99}])
 */
function buildWriteValueAction(property, value, stateUpdate = null) {
  return {
    isCommand: false,
    name: property,
    value,
    stateUpdate: stateUpdate || [],
  };
}
const multilevelSwitchCurtainsActionsDefault = {
  currentvalue: {
    state: (value, _nodeContext) => {
      if (value === COVER_STATE.STOP) {
        return buildCommandAction('stopLevelChange', []);
      }

      if (value === COVER_STATE.OPEN) {
        return buildCommandAction(
          'set',
          [99],
          [
            {
              feature_name: 'position',
              value: 99,
            },
          ],
        );
      }

      // COVER_STATE.CLOSE
      return buildCommandAction(
        'set',
        [0],
        [
          {
            feature_name: 'position',
            value: 0,
          },
        ],
      );
    },
    position: (value, _nodeContext) => buildCommandAction('set', [value]),
  },
};
/**
 * Convert value from Gladys format to
 * the Zwave MQTT expected format.
 */
const ACTIONS = {
  binary_switch: {
    currentvalue: (value, _nodeContext) => buildCommandAction('set', [value === STATE.ON]),
  },
  multilevel_switch: {
    currentvalue: {
      state: (value, _nodeContext) => {
        if (value === STATE.ON) {
          return buildCommandAction(
            'set',
            [99],
            [
              {
                feature_name: 'position',
                value: 99,
              },
              {
                property_name: 'restoreprevious',
                value: STATE.ON,
              },
            ],
          );
        }

        return buildCommandAction(
          'set',
          [0],
          [
            {
              feature_name: 'position',
              value: 0,
            },
            {
              property_name: 'restoreprevious',
              value: STATE.OFF,
            },
          ],
        );
      },
      position: (value, _nodeContext) =>
        buildCommandAction(
          'set',
          [value],
          [
            {
              feature_name: 'state',
              value: value > 0 ? STATE.ON : STATE.OFF,
            },
            {
              property_name: 'restoreprevious',
              value: value > 0 ? STATE.ON : STATE.OFF,
            },
          ],
        ),
    },
    restoreprevious: (value, _nodeContext) => {
      if (value === STATE.ON) {
        // On multilevel switch dimmers, when turning ON, let's go back
        // to the latest value. Same behavior as pushing the real button.
        // Position is automatically updated by the device (through a targetvalue update)
        return buildWriteValueAction('restorePrevious', true);
      }

      return buildCommandAction(
        'set',
        [0],
        [
          {
            property_name: 'currentvalue',
            feature_name: 'state',
            value: STATE.OFF,
          },
          {
            property_name: 'currentvalue',
            feature_name: 'position',
            value: 0,
          },
        ],
      );
    },
    '17-5': multilevelSwitchCurtainsActionsDefault,
    '17-6': multilevelSwitchCurtainsActionsDefault,
    '17-7': multilevelSwitchCurtainsActionsDefault,
  },
};

/**
 * List of supported features.
 */
const EXPOSES = {
  alarm_sensor: {
    state: {
      category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      read_only: true,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 1,
    },
  },
  battery: {
    level: {
      category: DEVICE_FEATURE_CATEGORIES.BATTERY,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      read_only: true,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 100,
    },
    islow: {
      category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
      type: DEVICE_FEATURE_TYPES.BATTERY_LOW.BINARY,
      read_only: true,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 1,
    },
  },
  binary_sensor: {
    any: {
      category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      min: 0,
      max: 1,
      read_only: true,
      has_feedback: true,
      keep_history: true,
    },
    general_purpose: {
      category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      min: 0,
      max: 1,
      read_only: true,
      has_feedback: true,
      keep_history: true,
    },
  },
  binary_switch: {
    currentvalue: {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      min: 0,
      max: 1,
      keep_history: true,
      read_only: false,
      has_feedback: false,
    },
  },
  central_scene: {
    scene: {
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
      type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      min: 0,
      max: 4,
      keep_history: false,
      read_only: true,
      has_feedback: true,
    },
  },
  multilevel_sensor: {
    air_temperature: {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      min: -100,
      max: 150,
      keep_history: true,
      read_only: true,
      has_feedback: false,
    },
    illuminance: {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.LUX,
      min: 0,
      max: 100000,
      keep_history: true,
      read_only: true,
      has_feedback: false,
    },
    power: {
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
      unit: DEVICE_FEATURE_UNITS.WATT,
      min: 0,
      max: 5000,
      keep_history: true,
      read_only: true,
      has_feedback: false,
    },
  },
  multilevel_switch: {
    // Default deviceClass refers to SWITCH
    currentvalue: [
      {
        name: 'position',
        feature: {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          min: 0,
          max: 99,
          keep_history: true,
          read_only: false,
          has_feedback: false,
        },
      },
      {
        name: 'state',
        feature: {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          min: 0,
          max: 1,
          keep_history: true,
          read_only: false,
          has_feedback: false,
        },
      },
    ],
    /// Dimmers
    '17-1': {
      // We explicitly expose the restorePrevious.
      // It's up to the user to choose the one he would like:
      // restorePrevious or full ON/OFF
      restoreprevious: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        min: 0,
        max: 1,
        keep_history: true,
        read_only: false,
        has_feedback: false,
      },
    },
    /// Curtains
    // Class A Motor: Window Covering No Position/Endpoint Device Type
    '17-5': {
      currentvalue: [
        {
          name: 'position',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            min: 0,
            max: 99,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
        {
          name: 'state',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
      ],
    },
    /// Curtains
    // Class B Motor : Window Covering Endpoint Aware Device Type
    '17-6': {
      currentvalue: [
        {
          name: 'position',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            min: 0,
            max: 99,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
        {
          name: 'state',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
      ],
    },
    /// Curtains
    // Class C Motor : Window Covering Position/Endpoint Aware Device Type
    '17-7': {
      currentvalue: [
        {
          name: 'position',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            min: 0,
            max: 99,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
        {
          name: 'state',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
      ],
    },
  },
  notification: {
    access_control: {
      door_state_simple: {
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        min: 0,
        max: 1,
        keep_history: true,
        read_only: true,
        has_feedback: true,
      },
    },
  },
};

const COMMANDCLASS = {
  ALARM_SENSOR: 156,
  BINARY_SENSOR: 48,
  BINARY_SWITCH: 37,
  MULTILEVEL_SWITCH: 38,
};

const PRODUCTID = {
  FIBARO_FGMS001: '271-4097-2048',
};

module.exports = {
  ACTIONS,
  CONFIGURATION,
  EXPOSES,
  STATES,
  PARAMS,
  COMMANDCLASS,
  PRODUCTID,
};
