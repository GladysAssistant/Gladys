const GLADYS_VARIABLES = {
  API_KEY: 'TESSIE_API_KEY',
};

const SCOPES = {
  VEHICLE: {
    read: 'read_vehicle',
    write: 'write_vehicle',
    control: 'control_vehicle',
  },
  TELEMETRY: {
    read: 'read_telemetry',
  },
  DRIVER: {
    read: 'read_driver',
    write: 'write_driver',
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
    SET_VEHICLE_VALUES: 'error set vehicle values',
    GET_VEHICLE_VALUES: 'error get vehicle values',
  },
  GET_VEHICLE_VALUES: 'get vehicle values',
  DISCOVERING_VEHICLES: 'discovering',
};

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';
const BASE_API = 'https://api.tessie.com';
const API = {
  HEADER: {
    ACCEPT: 'application/json',
    HOST: 'api.tessie.com',
    CONTENT_TYPE: 'application/json',
  },
  OAUTH2: `${BASE_API}/oauth2/authorize`,
  TOKEN: `${BASE_API}/oauth2/token`,
  VEHICLES: `${BASE_API}/vehicles`,
  VEHICLE_STATE: `/state`,
  VEHICLE_COMMAND: `/command`,
  VEHICLE_CHARGING: `/charging`,
  VEHICLE_LOCATION: `/location`,
  VEHICLE_BATTERY: `/battery`,
  VEHICLE_BATTERY_HEALTH: `/battery/health`,
  VEHICLE_FIRMWARE: `/firmware/alerts`,
  VEHICLE_CONSUMPTION: `/consumption`,
  VEHICLE_WEATHER: `/weather`,
  VEHICLE_DRIVES: `/drives`,
  VEHICLE_CHARGES: `/charges`,
  VEHICLE_TIRES: `/tires`,
  VEHICLE_LICENSE: `/license`,
  VEHICLE_TELEMETRY: `/telemetry`,
  DRIVERS: `${BASE_API}/drivers`,
  DRIVER_INVITATIONS: `${BASE_API}/drivers/invitations`,
};

const SUPPORTED_CATEGORY_TYPE = {
  VEHICLE: 'Vehicle',
  CHARGING: 'Charging',
  LOCATION: 'Location',
  BATTERY: 'Battery',
  DRIVER: 'Driver',
  TELEMETRY: 'Telemetry',
  UNKNOWN: 'unknown',
};

const SUPPORTED_MODULE_TYPE = {
  TESLA_MODEL_S: 'ModelS',
  TESLA_MODEL_3: 'Model3',
  TESLA_MODEL_X: 'ModelX',
  TESLA_MODEL_Y: 'ModelY',
};

const PARAMS = {
  VEHICLE_ID: 'vehicle_id',
  VEHICLE_NAME: 'vehicle_name',
  VEHICLE_VIN: 'vehicle_vin',
  VEHICLE_STATE: 'vehicle_state',
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
