const GLADYS_VARIABLES = {
  CLIENT_ID: 'NETATMO_CLIENT_ID',
  CLIENT_SECRET: 'NETATMO_CLIENT_SECRET',

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
  ERROR: {
    CONNECTING: 'error connecting',
    PROCESSING_TOKEN: 'error processing token',
    DISCONNECTING: 'error disconnecting',
    CONNECTED: 'error connected',
    SET_DEVICES_VALUES: 'error set devices values',
  },
  GET_DEVICES_VALUES: 'get devices values',
  DISCOVERING_DEVICES: 'discovering',
};

const BASE_API = 'https://api.netatmo.com';
const API = {
  HEADER: {
    ACCEPT: 'application/json',
    HOST: 'api.netatmo.com',
    CONTENT_TYPE: 'application/x-www-form-urlencoded;charset=UTF-8',
  },
  OAUTH2: `${BASE_API}/oauth2/authorize`,
  TOKEN: `${BASE_API}/oauth2/token`,
  GET_THERMOSTATS: `${BASE_API}/api/getthermostatsdata`,
  POST_THERMPOINT: `${BASE_API}/api/setroomthermpoint`,
  HOMESDATA: `${BASE_API}/api/homesdata`,
  HOMESTATUS: `${BASE_API}/api/homestatus`,
  GET_ROOM_MEASURE: `${BASE_API}/api/getroommeasure`,
  SET_ROOM_THERMPOINT: `${BASE_API}/api/setroomthermpoint`,
  SET_THERM_MODE: `${BASE_API}/api/setthermmode`,
  GET_MEASURE: `${BASE_API}/api/getmeasure`,
};

const SUPPORTED_MODULE_TYPE = {
  THERMOSTAT: 'NATherm1',
  PLUG: 'NAPlug',
};

const ENERGY_MODES = {
  OFF: 'off',
  PROGRAM: 'program',
  AWAY: 'away',
  HG: 'hg',
  MANUAL: 'manual',
  MAX: 'max',
  SCHEDULE: 'schedule',
};

const PARAMS = {
  HOME_ID: 'home_id',
  ROOM_ID: 'room_id',
  ROOM_NAME: 'room_name',
  PLUG_ID: 'plug_id',
  PLUG_NAME: 'plug_name',
  FIRMWARE_REVISION: 'firmware_revision',
  MODULES_BRIDGE_ID: 'modules_bridge_id',
};

module.exports = {
  GLADYS_VARIABLES,
  SCOPES,
  STATUS,
  API,
  SUPPORTED_MODULE_TYPE,
  ENERGY_MODES,
  PARAMS,
};
