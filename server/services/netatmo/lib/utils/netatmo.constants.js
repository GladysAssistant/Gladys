const GLADYS_VARIABLES = {
  USERNAME: 'NETATMO_USERNAME',
  CLIENT_ID: 'NETATMO_CLIENT_ID',
  CLIENT_SECRET: 'NETATMO_CLIENT_SECRET',

  SCOPE_ENERGY: 'NETATMO_SCOPE_ENERGY',

  CONNECTED: 'NETATMO_CONNECTED',
  ACCESS_TOKEN: 'NETATMO_ACCESS_TOKEN',
  REFRESH_TOKEN: 'NETATMO_REFRESH_TOKEN',
  EXPIRE_IN_TOKEN: 'NETATMO_EXPIRE_IN_TOKEN',
};

const SCOPES = {
  ENERGY: {
    read: 'read_thermostat',
    write: 'write_thermostat',
  },
};
const STATUS = {
  NOT_INITIALIZED: 'not_initialized',
  CONNECTING: 'connecting',
  DISCONNECTING: 'disconnecting',
  PROCESSING_TOKEN: 'processing token',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  DISCOVERING_DEVICES: 'discovering',
};

module.exports = {
  GLADYS_VARIABLES,
  SCOPES,
  STATUS,
};
