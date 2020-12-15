const CONFIGURATION = {
  NETATMO_CLIENT_ID: 'NETATMO_CLIENT_ID',
  NETATMO_CLIENT_SECRET: 'NETATMO_CLIENT_SECRET',
  NETATMO_USERNAME: 'NETATMO_USERNAME',
  NETATMO_PASSWORD: 'NETATMO_PASSWORD',
};

const DEFAULT = {
  TOPICS: [
    'gladys/master/#', // Default gladys topic
  ],
};

const NETATMO_VALUES ={
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
      NO_SOUND: 0,
      SOUND: 1,
    },
    DOOR_TAG: {
      UNDEFINED: -1,
      CLOSED: 0,
      OPEN: 1,
    },
  },
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
  NETATMO_VALUES,
};
