const DEVICE_PARAMS = {
  ID: 'ID',
  URL: 'URL',
  FIRMWARE: 'FIRMWARE',
  ONLINE: 'ONLINE',
  STATE: 'STATE',
};

const SUPPORTED_SERVERS = {
  atlantic_cozytouch: {
    name: 'Atlantic Cozytouch',
    host: 'ha110-1.overkiz.com',
    endpoint: 'https://ha110-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Atlantic',
    jwt: true,
    configuration: {
      COZYTOUCH_ATLANTIC_API: 'https://apis.groupe-atlantic.com',
      COZYTOUCH_CLIENT_ID: 'Q3RfMUpWeVRtSUxYOEllZkE3YVVOQmpGblpVYToyRWNORHpfZHkzNDJVSnFvMlo3cFNKTnZVdjBh',
    },
    configuration_url: undefined,
  },
  hi_kumo_asia: {
    name: 'Hitachi Hi Kumo (Asia)',
    host: 'ha203-1.overkiz.com',
    endpoint: 'https://ha203-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Hitachi',
    configuration_url: undefined,
  },
  hi_kumo_europe: {
    name: 'Hitachi Hi Kumo (Europe)',
    host: 'ha117-1.overkiz.com',
    endpoint: 'https://ha117-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Hitachi',
    configuration_url: undefined,
  },
  hi_kumo_oceania: {
    name: 'Hitachi Hi Kumo (Oceania)',
    host: 'ha203-1.overkiz.com',
    endpoint: 'https://ha203-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Hitachi',
    configuration_url: undefined,
  },
  nexity: {
    name: 'Nexity Eugénie',
    host: 'ha106-1.overkiz.com',
    endpoint: 'https://ha106-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Nexity',
    configuration: {
      NEXITY_API: 'https://api.egn.prd.aws-nexity.fr',
      NEXITY_COGNITO_CLIENT_ID: '3mca95jd5ase5lfde65rerovok',
      NEXITY_COGNITO_USER_POOL: 'eu-west-1_wj277ucoI',
      NEXITY_COGNITO_REGION: 'eu-west-1',
    },
    configuration_url: undefined,
  },
  rexel: {
    name: 'Rexel Energeasy Connect',
    endpoint: 'https://ha112-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Rexel',
    configuration_url: 'https://utilisateur.energeasyconnect.com/user/#/zone/equipements',
  },
  somfy_europe: {
    // uses https://ha101-1.overkiz.com
    name: 'Somfy (Europe)',
    endpoint: 'https://tahomalink.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Somfy',
    configuration_url: 'https://www.tahomalink.com',
  },
  somfy_america: {
    name: 'Somfy (North America)',
    endpoint: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Somfy',
    configuration_url: undefined,
  },
  somfy_oceania: {
    name: 'Somfy (Oceania)',
    endpoint: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI',
    manufacturer: 'Somfy',
    configuration_url: undefined,
  },
};

const OVERKIZ_API = {
  GET_DEVICES: 'setup/devices',
  GET_GATEWAYS: 'setup/gateways',
  GET_HISTORY_EXECUTIONS: 'history/executions',
  GET_DEVICE_DEFINITION: 'setup/devices/%',
  GET_DEVICE_STATE: 'setup/devices/%/states',
  REFRESH_DEVICES_STATE: 'setup/devices/states/refresh', // For device that supports refresh
};

const OVERKIZ_SERVER_PARAM = {
  OVERKIZ_TYPE: 'OVERKIZ_TYPE',
  OVERKIZ_SERVER_USERNAME: 'OVERKIZ_SERVER_USERNAME',
  OVERKIZ_SERVER_PASSWORD: 'OVERKIZ_SERVER_PASSWORD',
};

const DEVICE_TYPES = {
  SYSTEM: 1,
  SENSOR: 2,
};

const DEVICE_UID_CLASSES = {
  POD: 'Pod',
  PROTOCOL_GATEWAY: 'ProtocolGateway',
  HEATER: 'HeatingSystem',
  TEMPERATURE: 'TemperatureSensor',
  CONTACT: 'ContactSensor',
  OCCUPANCY: 'OccupancySensor',
  ELECTRICITY: 'ElectricitySensor',
};

const DEVICE_STATES = {
  MODEL_STATE: 'io:ModelState',
  POWER_STATE: 'io:PowerState',
  MANUFACTURER_NAME_STATE: 'core:ManufacturerNameState',
  FIRMWARE_REVISION_STATE: 'core:FirmwareRevision',
  STATUS_STATE: 'core:StatusState',
  AWAY_STATE: 'core:HolidaysModeState',
  HEATING_LEVEL_STATE: 'io:TargetHeatingLevelState',
  OCCUPANCY_STATE: 'core:OccupancyState',
  TEMPERATURE_STATE: 'core:TemperatureState',
  TARGET_TEMPERATURE_STATE: 'core:TargetTemperatureState',
  COMFORT_TEMPERATURE_STATE: 'core:ComfortRoomTemperatureState',
  ECO_TEMPERATURE_STATE: 'io:EffectiveTemperatureSetpointState', // 'core:EcoRoomTemperatureState',
  ON_OFF_STATE: 'core:OnOffState',
  ELECTRIC_ENERGY_CONSUMPTION_STATE: 'core:ElectricEnergyConsumptionState',
  OPERATING_MODE_STATE: 'core:OperatingModeState',
};

const DEVICE_COMMANDS = {
  SET_CURRENT_OPERATING_MODE: 'setCurrentOperatingMode',
  SET_HEATING_LEVEL: 'setHeatingLevel',
  SET_ECO_TEMP: 'setEcoTemperature',
  SET_COMFORT_TEMP: 'setComfortTemperature',
  SET_AWAY_MODE: 'setHolidays',
  REFRESH_HEATING_LEVEL: 'refreshHeatingLevel',
  REFRESH_ECO_TEMPERATURE: 'refreshEcoTemperature',
  REFRESH_COMFORT_TEMPERATURE: 'refreshComfortTemperature',
};

const HEATING_MODES = ['off', 'frostprotection', 'eco', 'comfort-2', 'comfort-1', 'comfort'];

const HEATING_STATES = {
  STOPPED: 'standby',
  BASIC: 'basic',
  PROG: 'internal', // mode suivant un planing horaire
  AUTO: 'auto',
};

module.exports = {
  SUPPORTED_SERVERS,
  OVERKIZ_SERVER_PARAM,
  OVERKIZ_API,
  DEVICE_PARAMS,
  DEVICE_TYPES,
  DEVICE_UID_CLASSES,
  DEVICE_STATES,
  DEVICE_COMMANDS,
  HEATING_MODES,
  HEATING_STATES,
};
