const GLADYS_VARIABLES = {
  ENDPOINT: 'TUYA_ENDPOINT',
  ACCESS_KEY: 'TUYA_ACCESS_KEY',
  SECRET_KEY: 'TUYA_SECRET_KEY',
  ACCESS_TOKEN: 'TUYA_ACCESS_TOKEN',
  REFRESH_TOKEN: 'TUYA_REFRESH_TOKEN',
  APP_ACCOUNT_UID: 'TUYA_APP_ACCOUNT_UID',
};

const TUYA_ENDPOINTS = {
  china: 'https://openapi.tuyacn.com',
  westernAmerica: 'https://openapi.tuyaus.com',
  easternAmerica: 'https://openapi-ueaz.tuyaus.com',
  centralEurope: 'https://openapi.tuyaeu.com',
  westernEurope: 'https://openapi-weaz.tuyaeu.com',
  india: 'https://openapi.tuyain.com',
};

const STATUS = {
  NOT_INITIALIZED: 'not_initialized',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  DISCOVERING_DEVICES: 'discovering',
};

const API = {
  VERSION_1_0: '/v1.0/iot-03',
  VERSION_1_1: '/v1.1/iot-03',
  VERSION_1_2: '/v1.2/iot-03',
  VERSION_1_3: '/v1.3/iot-03',
};

module.exports = {
  GLADYS_VARIABLES,
  TUYA_ENDPOINTS,
  STATUS,
  API,
};
