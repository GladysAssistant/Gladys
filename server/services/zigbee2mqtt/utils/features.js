const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../server/utils/constants');

const features = {
  presence: {
    category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Presence Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'presence',
  },
  motion: {
    category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Motion Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'occupancy',
  },
  door: {
    category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Opening Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'contact',
  },
  water: {
    category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Water Leak',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'water_leak',
  },
  smoke: {
    category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Smoke Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'smoke',
  },
  battery: {
    category: DEVICE_FEATURE_CATEGORIES.BATTERY,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    name: 'Battery',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 100,
    zigbeeField: 'battery',
  },
  illuminance: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.LUX,
    name: 'Light Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1000,
    zigbeeField: 'illuminance',
  },
  humidity: {
    category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    name: 'Humidity',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 100,
    zigbeeField: 'humidity',
  },
  temperature: {
    category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    name: 'Temperature',
    read_only: true,
    has_feedback: false,
    min: -50,
    max: 125,
    zigbeeField: 'temperature',
  },
  pressure: {
    category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.HECTO_PASCAL,
    name: 'Pressure Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 10000,
    zigbeeField: 'pressure',
  },
  button: {
    category: DEVICE_FEATURE_CATEGORIES.BUTTON,
    type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
    name: 'Button',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'action',
  },
  switch: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Switch (On/Off)',
    read_only: false,
    has_feedback: true,
    min: 0,
    max: 1,
    zigbeeField: 'state',
  },
  switch_sensor: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Switch Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'state',
  },
  power: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
    name: 'Power consumption',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'power',
  },
  current: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
    unit: DEVICE_FEATURE_UNITS.AMPERE,
    name: 'Switch Current',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1000,
    zigbeeField: 'current',
  },
  voltage: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
    unit: DEVICE_FEATURE_UNITS.VOLT,
    name: 'Switch Voltage',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1000,
    zigbeeField: 'voltage',
  },
  energy: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
    name: 'Energy consumption',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 10000,
    zigbeeField: 'energy',
  },
  light: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Light',
    read_only: false,
    has_feedback: true,
    min: 0,
    max: 1,
    zigbeeField: 'state',
  },
  brightness: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    name: 'Light Brightness',
    read_only: false,
    has_feedback: false,
    min: 0,
    max: 255,
    zigbeeField: 'brightness',
  },
  color_temperature: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    name: 'Light Temperature',
    read_only: false,
    has_feedback: false,
    min: 150,
    max: 500,
    zigbeeField: 'color_temp',
  },
  color: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    name: 'Light Color',
    read_only: false,
    has_feedback: false,
    min: 0,
    max: 16777215,
    zigbeeField: 'color',
  },
  gas: {
    category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    name: 'Smoke Sensor',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    zigbeeField: 'gas',
  },
  gas_density: {
    category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    name: 'Gas Density',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1000,
    zigbeeField: 'gas',
  },
  co2: {
    category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    name: 'CO2 Concentration',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 10000,
    zigbeeField: 'co2',
  },
  link_quality: {
    category: DEVICE_FEATURE_CATEGORIES.SIGNAL_STRENGTH,
    type: DEVICE_FEATURE_TYPES.SIGNAL_STRENGTH.LINK_QUALITY,
    unit: DEVICE_FEATURE_UNITS.LQI,
    name: 'Link Quality',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 255,
    zigbeeField: 'linkquality',
  },
};

module.exports = {
  features,
};
