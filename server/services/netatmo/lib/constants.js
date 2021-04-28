const CONFIGURATION = {
  NETATMO_CLIENT_ID: 'NETATMO_CLIENT_ID',
  NETATMO_CLIENT_SECRET: 'NETATMO_CLIENT_SECRET',
  NETATMO_USERNAME: 'NETATMO_USERNAME',
  NETATMO_PASSWORD: 'NETATMO_PASSWORD',
  NETATMO_IS_CONNECT: 'NETATMO_IS_CONNECT',
};

const DEFAULT = {
  TOPICS: [
    'gladys/master/#', // Default gladys topic
  ],
};

const NETATMO_VALUES = {
  UNITS: {
    SYSTEM: {
      TEMPERATURE: {
        0: 'celsius',
        1: 'fahrenheit',
      },
      DISTANCE: {
        0: 'millimeter',
        1: 'inch',
      },
      PRECIPITATION: {
        0: 'millimeter-hour',
        1: 'inch-hour',
      },
    },
    WIND: {
      0: 'kilometer-hour',
      1: 'miles-hour',
      2: 'meter-second',
      3: 'beaufort',
      4: 'knots',
    },
    PRESSURE: {
      0: 'millibar',
      1: 'inch-mercury',
      2: 'millimeter-mercury',
    },
    FEEL_LIKE_ALGO: {
      0: 'Based on Humidex',
      1: 'Based on heat index',
    },
  },
  BATTERY: {
    VERY_LOW: 5,
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    FULL: 100,
  },
  SECURITY: {
    STATUS: {
      OFF: 0,
      ON: 1,
    },
    LIGHT: {
      OFF: 0,
      ON: 1,
      AUTO: 2,
    },
    SIREN: {
      NO_NEWS: -1,
      NO_SOUND: 0,
      SOUND: 1,
      WARNING: 2,
    },
    DOOR_TAG: {
      UNDEFINED: -1,
      CLOSED: 0,
      OPEN: 1,
    },
  },
  ENERGY: {
    SETPOINT_MODE: {
      SCHEDULE: 0,
      MANUAL: 1,
      HG: 2, // Hors Gel
      AWAY: 3, // Absent
      PROGRAM: 0,
    },
    HEATING_REQ: {
      0: 0,
      100: 1,
    },
  },
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
  NETATMO_VALUES,
};
