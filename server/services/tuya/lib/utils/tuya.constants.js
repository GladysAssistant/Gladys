const GLADYS_VARIABLES = {
  ENDPOINT: 'TUYA_ENDPOINT',
  WS_ENDPOINT: 'TUYA_WS_ENDPOINT',
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

const TUYA_WS_ENDPOINTS = {
  china: 'wss://mqe.tuyacn.com:8285/',
  westernAmerica: 'wss://mqe.tuyaus.com:8285/',
  easternAmerica: 'wss://mqe.tuyaus.com:8285/',
  centralEurope: 'wss://mqe.tuyaeu.com:8285/',
  westernEurope: 'wss://mqe.tuyaeu.com:8285/',
  india: 'wss://mqe.tuyain.com:8285/',
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
  VERSION_2_0: '/v2.0',
};

const INFRARED_CATEGORIES = {
  INFRARED_TV: 'infrared_tv',
  INFRARED_AC: 'infrared_ac',
};

const INFRARED_MODELS = {
  INFRARED_TV: 'TV',
  INFRARED_AC: 'Air Conditioner',
};

module.exports = {
  GLADYS_VARIABLES,
  TUYA_ENDPOINTS,
  STATUS,
  API,
  TUYA_WS_ENDPOINTS,
  INFRARED_CATEGORIES,
  INFRARED_MODELS,
};
