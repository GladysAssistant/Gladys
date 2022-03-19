const GLADYS_VARIABLES = {
  BASE_URL: 'BASE_URL',
  ACCESS_KEY: 'ACCESS_KEY',
  SECRET_KEY: 'SECRET_KEY',
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
};

const STATUS = {
  NOT_INITIALIZED: 'not_initialized',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  DISCOVERING_DEVICES: 'discovering',
};

module.exports = {
  GLADYS_VARIABLES,
  STATUS,
};
