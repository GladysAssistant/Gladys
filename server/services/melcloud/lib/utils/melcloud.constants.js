const GLADYS_VARIABLES = {
  USERNAME: 'MELCLOUD_USERNAME',
  PASSWORD: 'MELCLOUD_PASSWORD',
};

const MELCLOUD_ENDPOINT = 'https://app.melcloud.com/Mitsubishi.Wifi.Client/';

const STATUS = {
  NOT_INITIALIZED: 'not_initialized',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  DISCOVERING_DEVICES: 'discovering',
};

module.exports = {
  GLADYS_VARIABLES,
  MELCLOUD_ENDPOINT,
  STATUS,
};
