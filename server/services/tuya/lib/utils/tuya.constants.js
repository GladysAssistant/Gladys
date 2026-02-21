const GLADYS_VARIABLES = {
  ENDPOINT: 'TUYA_ENDPOINT',
  ACCESS_KEY: 'TUYA_ACCESS_KEY',
  SECRET_KEY: 'TUYA_SECRET_KEY',
  ACCESS_TOKEN: 'TUYA_ACCESS_TOKEN',
  REFRESH_TOKEN: 'TUYA_REFRESH_TOKEN',
  APP_ACCOUNT_UID: 'TUYA_APP_ACCOUNT_UID',
  APP_USERNAME: 'TUYA_APP_USERNAME',
  MANUAL_DISCONNECT: 'TUYA_MANUAL_DISCONNECT',
  LAST_CONNECTED_CONFIG_HASH: 'TUYA_LAST_CONNECTED_CONFIG_HASH',
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
  PUBLIC_VERSION_1_0: '/v1.0',
  VERSION_1_0: '/v1.0/iot-03',
  VERSION_1_1: '/v1.1/iot-03',
  VERSION_1_2: '/v1.2/iot-03',
  VERSION_1_3: '/v1.3/iot-03',
};

const DEVICE_PARAM_NAME = {
  DEVICE_ID: 'DEVICE_ID',
  LOCAL_KEY: 'LOCAL_KEY',
  IP_ADDRESS: 'IP_ADDRESS',
  PROTOCOL_VERSION: 'PROTOCOL_VERSION',
  CLOUD_IP: 'CLOUD_IP',
  LOCAL_OVERRIDE: 'LOCAL_OVERRIDE',
  PRODUCT_ID: 'PRODUCT_ID',
  PRODUCT_KEY: 'PRODUCT_KEY',
};

module.exports = {
  GLADYS_VARIABLES,
  TUYA_ENDPOINTS,
  STATUS,
  API,
  DEVICE_PARAM_NAME,
};
