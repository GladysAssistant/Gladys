const GLADYS_VARIABLES = {
  API_KEY: 'TESSIE_API_KEY',
  VEHICLES_API: 'TESSIE_VEHICLES_API',
  DRIVERS_API: 'TESSIE_DRIVERS_API',
  TELEMETRY_API: 'TESSIE_TELEMETRY_API',
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
    CONTENT_TYPE: 'application/json',
  },
  OAUTH2: `${BASE_API}/oauth2/authorize`,
  TOKEN: `${BASE_API}/oauth2/token`,
  VEHICLES: `${BASE_API}/vehicles?only_active=false`,
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

const SUPPORTED_MODULE_MODEL = {
  TESLA_MODEL_S: 'ModelS',
  TESLA_MODEL_3: 'Model3',
  TESLA_MODEL_X: 'ModelX',
  TESLA_MODEL_Y: 'ModelY',
};

const SUPPORTED_MODULE_TYPE = {
  BASE: 'base',
};

const SUPPORTED_MODULE_VERSION = {
  BASE: 'base',
  LONG_RANGE: 'long_range',
  AWD: 'awd',
  PERFORMANCE: 'performance',
  STANDARD: 'standard',
};

const EFFICIENCY_PACKAGE_YEAR = {
  MY2021: '2021',
  MY2022: '2022',
  MY2023: '2023',
  MY2024: '2024',
};

const BATTERY_CAPACITY = {
  MODELS: {
    STANDARD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    AWD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    LONG_RANGE: {
      BATTERY_CAPACITY: 74,
      BATTERY_RANGE: 300,
    },
    PERFORMANCE: {
      BATTERY_CAPACITY: 82,
      BATTERY_RANGE: 300,
    },
  },
  MODEL3: {
    STANDARD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    AWD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    LONG_RANGE: {
      BATTERY_CAPACITY: 74,
      BATTERY_RANGE: 300,
    },
    PERFORMANCE: {
      BATTERY_CAPACITY: 82,
      BATTERY_RANGE: 300,
    },
  },
  HIGHLAND: {
    STANDARD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    AWD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    LONG_RANGE: {
      BATTERY_CAPACITY: 74,
      BATTERY_RANGE: 300,
    },
    PERFORMANCE: {
      BATTERY_CAPACITY: 82,
      BATTERY_RANGE: 300,
    },
  },
  MODELY: {
    STANDARD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    AWD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    LONG_RANGE: {
      BATTERY_CAPACITY: 74,
      BATTERY_RANGE: 523,
    },
    PERFORMANCE: {
      BATTERY_CAPACITY: 82,
      BATTERY_RANGE: 300,
    },
  },
  JUNIPER: {
    STANDARD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    AWD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    LONG_RANGE: {
      BATTERY_CAPACITY: 74,
      BATTERY_RANGE: 300,
    },
    PERFORMANCE: {
      BATTERY_CAPACITY: 82,
      BATTERY_RANGE: 300,
    },
  },
  MODELX: {
    STANDARD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    AWD: {
      BATTERY_CAPACITY: 60,
      BATTERY_RANGE: 250,
    },
    LONG_RANGE: {
      BATTERY_CAPACITY: 74,
      BATTERY_RANGE: 300,
    },
    PERFORMANCE: {
      BATTERY_CAPACITY: 82,
      BATTERY_RANGE: 300,
    },
  },
};

const PARAMS = {
  VEHICLE_ID: 'vehicle_id',
  VEHICLE_NAME: 'vehicle_name',
  VEHICLE_VIN: 'vehicle_vin',
  VEHICLE_STATE: 'vehicle_state',
};

const CAR_SPECIAL_TYPE = {
  STANDARD: 'standard',
  LONG_RANGE: 'long_range',
  AWD: 'awd',
  PERFORMANCE: 'performance',
};

module.exports = {
  GLADYS_VARIABLES,
  STATUS,
  GITHUB_BASE_URL,
  BASE_API,
  API,
  SUPPORTED_CATEGORY_TYPE,
  SUPPORTED_MODULE_MODEL,
  SUPPORTED_MODULE_TYPE,
  SUPPORTED_MODULE_VERSION,
  PARAMS,
  EFFICIENCY_PACKAGE_YEAR,
  BATTERY_CAPACITY,
};
