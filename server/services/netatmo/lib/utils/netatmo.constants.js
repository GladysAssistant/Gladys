const GLADYS_VARIABLES = {
  CLIENT_ID: 'NETATMO_CLIENT_ID',
  CLIENT_SECRET: 'NETATMO_CLIENT_SECRET',

  ENERGY_API: 'NETATMO_ENERGY_API',
  WEATHER_API: 'NETATMO_WEATHER_API',

  ACCESS_TOKEN: 'NETATMO_ACCESS_TOKEN',
  REFRESH_TOKEN: 'NETATMO_REFRESH_TOKEN',
  EXPIRE_IN_TOKEN: 'NETATMO_EXPIRE_IN_TOKEN',
};

const SCOPES = {
  ENERGY: {
    read: 'read_thermostat',
    write: 'write_thermostat',
  },
  HOME_SECURITY: {
    read_camera: 'read_camera',
    read_presence: 'read_presence',
    read_carbonmonoxidedetector: 'read_carbonmonoxidedetector',
    read_smokedetector: 'read_smokedetector',
  },
  WEATHER: {
    read_station: 'read_station',
  },
  AIRCARE: {
    read_homecoach: 'read_homecoach',
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
    GET_DEVICES_VALUES: 'error get devices values',
  },
  GET_DEVICES_VALUES: 'get devices values',
  DISCOVERING_DEVICES: 'discovering',
};

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';
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
  GET_WEATHER_STATIONS: `${BASE_API}/api/getstationsdata?get_favorites=false`,
  POST_THERMPOINT: `${BASE_API}/api/setroomthermpoint`,
  HOMESDATA: `${BASE_API}/api/homesdata`,
  HOMESTATUS: `${BASE_API}/api/homestatus`,
  GET_ROOM_MEASURE: `${BASE_API}/api/getroommeasure`,
  SET_ROOM_THERMPOINT: `${BASE_API}/api/setroomthermpoint`,
  SET_THERM_MODE: `${BASE_API}/api/setthermmode`,
  GET_MEASURE: `${BASE_API}/api/getmeasure`,
};

const SUPPORTED_CATEGORY_TYPE = {
  ENERGY: 'Energy',
  WEATHER: 'Weather',
  UNKNOWN: 'unknown',
};

const SUPPORTED_MODULE_TYPE = {
  THERMOSTAT: 'NATherm1',
  PLUG: 'NAPlug',
  NRV: 'NRV',
  NAMAIN: 'NAMain',
  NAMODULE1: 'NAModule1',
  NAMODULE2: 'NAModule2',
  NAMODULE3: 'NAModule3',
  NAMODULE4: 'NAModule4',
};

const PARAMS = {
  HOME_ID: 'home_id',
  ROOM_ID: 'room_id',
  ROOM_NAME: 'room_name',
  PLUG_ID: 'plug_id',
  PLUG_NAME: 'plug_name',
  MODULES_BRIDGE_ID: 'modules_bridge_id',
};

module.exports = {
  GLADYS_VARIABLES,
  SCOPES,
  STATUS,
  GITHUB_BASE_URL,
  API,
  SUPPORTED_CATEGORY_TYPE,
  SUPPORTED_MODULE_TYPE,
  PARAMS,
};
