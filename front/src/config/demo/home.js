import {
  uuid,
  solarPowerNow,
  solarEnergyToday,
  lightBinary,
  lightBrightness,
  lightColor,
  lightTemperature,
  switchBinary,
  switchPower,
  temperature,
  humidity,
  co2,
  battery,
  motion,
  presence,
  opening,
  leak,
  lightSensor,
  airQuality,
  shutterState,
  shutterPosition,
  thermostatTarget,
  acBinary,
  acMode,
  acTarget,
  energyPower,
  energyIndex,
  productionPower,
  feature
} from './helpers';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../server/utils/constants';

/**
 * The demo house: single source of truth of the demo instance.
 *
 * Every device/room/feature route served by the demo HTTP client is derived
 * from this description (see ./index.js), so the dashboard, the devices page,
 * the room pages and the scene editor always agree with each other. Add a
 * device here and it shows up everywhere, exactly like on a real instance.
 */

const HOUSE = {
  id: uuid('house-home'),
  name: 'Home',
  selector: 'main-house',
  latitude: 48.8566,
  longitude: 2.3522,
  alarm_mode: 'disarmed',
  alarm_delay_before_arming: 60
};

const service = (name, extra = {}) => ({ id: uuid(`service-${name}`), name, selector: name, ...extra });

const HUE = service('philips-hue');
const ZIGBEE = service('zigbee2mqtt');
const TASMOTA = service('tasmota');
const SONOS = service('sonos');
const GOOGLE_CAST = service('google-cast');
const NETATMO = service('netatmo');
const MELCLOUD = service('melcloud');
const RTSP_CAMERA = service('rtsp-camera');
const MATTER = service('matter');
const ENEDIS = service('enedis');
const MQTT = service('mqtt');

// A community integration, installed from the store: it is displayed with its
// manifest name and grouped apart from the built-in integrations.
const SOLAR = service('ext-gladysassistant-solar-inverter', {
  type: 'external',
  store_slug: 'gladysassistant/solar-inverter',
  manifest: { name: 'Solar Inverter' }
});

const ROOMS = [
  {
    name: 'Living room',
    selector: 'living-room',
    devices: [
      {
        name: 'Ceiling light',
        selector: 'living-room-ceiling-light',
        model: 'Hue White & Color Ambiance',
        service: HUE,
        features: [
          lightBinary('Ceiling light', 'living-room-ceiling-light-binary', 1, { updated: 42 }),
          lightBrightness('Brightness', 'living-room-ceiling-light-brightness', 72, { updated: 42 }),
          lightColor('Color', 'living-room-ceiling-light-color', 16769225, { updated: 42 })
        ]
      },
      {
        name: 'TV backlight',
        selector: 'living-room-tv-lamp',
        model: 'Hue Play',
        service: HUE,
        features: [
          lightBinary('TV backlight', 'living-room-tv-lamp-binary', 1, { updated: 42 }),
          lightBrightness('Brightness', 'living-room-tv-lamp-brightness', 40, { updated: 42 }),
          lightColor('Color', 'living-room-tv-lamp-color', 3978495, { updated: 42 })
        ]
      },
      {
        name: 'Sonos',
        selector: 'living-room-sonos',
        model: 'Sonos Era 100',
        service: SONOS,
        features: [
          feature({
            name: 'Play',
            selector: 'living-room-sonos-play',
            category: DEVICE_FEATURE_CATEGORIES.MUSIC,
            type: DEVICE_FEATURE_TYPES.MUSIC.PLAY,
            min: 0,
            max: 1,
            last_value: 1
          }),
          feature({
            name: 'Pause',
            selector: 'living-room-sonos-pause',
            category: DEVICE_FEATURE_CATEGORIES.MUSIC,
            type: DEVICE_FEATURE_TYPES.MUSIC.PAUSE,
            min: 0,
            max: 1,
            last_value: 0
          }),
          feature({
            name: 'Previous',
            selector: 'living-room-sonos-previous',
            category: DEVICE_FEATURE_CATEGORIES.MUSIC,
            type: DEVICE_FEATURE_TYPES.MUSIC.PREVIOUS,
            min: 0,
            max: 1,
            last_value: 0
          }),
          feature({
            name: 'Next',
            selector: 'living-room-sonos-next',
            category: DEVICE_FEATURE_CATEGORIES.MUSIC,
            type: DEVICE_FEATURE_TYPES.MUSIC.NEXT,
            min: 0,
            max: 1,
            last_value: 0
          }),
          feature({
            name: 'Volume',
            selector: 'living-room-sonos-volume',
            category: DEVICE_FEATURE_CATEGORIES.MUSIC,
            type: DEVICE_FEATURE_TYPES.MUSIC.VOLUME,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            last_value: 24
          }),
          feature({
            name: 'Playback state',
            selector: 'living-room-sonos-playback-state',
            category: DEVICE_FEATURE_CATEGORIES.MUSIC,
            type: DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE,
            min: 0,
            max: 2,
            read_only: true,
            last_value: 1
          })
        ]
      },
      {
        name: 'Television',
        selector: 'living-room-tv',
        model: 'Chromecast with Google TV',
        service: GOOGLE_CAST,
        features: [
          feature({
            name: 'Television',
            selector: 'living-room-tv-binary',
            category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
            type: DEVICE_FEATURE_TYPES.TELEVISION.BINARY,
            min: 0,
            max: 1,
            last_value: 0,
            updated: 320
          }),
          feature({
            name: 'Volume',
            selector: 'living-room-tv-volume',
            category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
            type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            last_value: 14,
            updated: 320
          })
        ]
      },
      {
        name: 'Air conditioning',
        selector: 'living-room-ac',
        model: 'MSZ-AP25VGK',
        service: MELCLOUD,
        features: [
          acBinary('Air conditioning', 'living-room-ac-binary', 0, { updated: 600 }),
          acMode('Mode', 'living-room-ac-mode', 2, { updated: 600 }),
          acTarget('Setpoint', 'living-room-ac-target', 23, { updated: 600 })
        ]
      },
      {
        name: 'Shutter',
        selector: 'living-room-shutter',
        model: 'Somfy io',
        service: ZIGBEE,
        features: [
          shutterState('Shutter', 'living-room-shutter-state', 0, { updated: 190 }),
          shutterPosition('Position', 'living-room-shutter-position', 100, { updated: 190 })
        ]
      },
      {
        name: 'Living room sensor',
        selector: 'living-room-sensor',
        model: 'Aqara WSDCGQ11LM',
        service: ZIGBEE,
        features: [
          temperature('Temperature', 'living-room-temperature', 21.4, { updated: 3 }),
          humidity('Humidity', 'living-room-humidity', 47, { updated: 3 }),
          co2('CO2', 'living-room-co2', 612, { updated: 3 }),
          motion('Motion', 'living-room-motion', 1, { updated: 1 }),
          lightSensor('Luminosity', 'living-room-luminosity', 312, { updated: 3 }),
          battery('Battery', 'living-room-sensor-battery', 87, { updated: 240 })
        ]
      }
    ]
  },
  {
    name: 'Kitchen',
    selector: 'kitchen',
    devices: [
      {
        name: 'Kitchen spots',
        selector: 'kitchen-spots',
        model: 'IKEA TRADFRI',
        service: ZIGBEE,
        features: [
          lightBinary('Kitchen spots', 'kitchen-spots-binary', 0, { updated: 95 }),
          lightBrightness('Brightness', 'kitchen-spots-brightness', 80, { updated: 95 }),
          lightTemperature('Color temperature', 'kitchen-spots-temperature', 60, { updated: 95 })
        ]
      },
      {
        name: 'Coffee machine',
        selector: 'kitchen-coffee-plug',
        model: 'Sonoff S31',
        service: TASMOTA,
        features: [
          switchBinary('Coffee machine', 'kitchen-coffee-binary', 0, { updated: 210 }),
          switchPower('Power', 'kitchen-coffee-power', 0, { updated: 5 })
        ]
      },
      {
        name: 'Dishwasher',
        selector: 'kitchen-dishwasher-plug',
        model: 'Shelly Plus Plug S',
        service: MQTT,
        features: [
          switchBinary('Dishwasher', 'kitchen-dishwasher-binary', 1, { updated: 62 }),
          switchPower('Power', 'kitchen-dishwasher-power', 1840, { updated: 2 })
        ]
      },
      {
        name: 'Kitchen sensor',
        selector: 'kitchen-sensor',
        model: 'Aqara WSDCGQ11LM',
        service: ZIGBEE,
        features: [
          temperature('Temperature', 'kitchen-temperature', 22.1, { updated: 4 }),
          humidity('Humidity', 'kitchen-humidity', 52, { updated: 4 }),
          battery('Battery', 'kitchen-sensor-battery', 92, { updated: 300 })
        ]
      },
      {
        name: 'Kitchen window',
        selector: 'kitchen-window',
        model: 'Aqara MCCGQ11LM',
        service: ZIGBEE,
        features: [
          opening('Kitchen window', 'kitchen-window-opening', 1, { updated: 140 }),
          battery('Battery', 'kitchen-window-battery', 78, { updated: 300 })
        ]
      },
      {
        name: 'Under the sink',
        selector: 'kitchen-leak-sensor',
        model: 'Aqara SJCGQ11LM',
        service: ZIGBEE,
        features: [
          leak('Water leak', 'kitchen-leak', 0, { updated: 30 }),
          battery('Battery', 'kitchen-leak-battery', 96, { updated: 300 })
        ]
      }
    ]
  },
  {
    name: 'Bedroom',
    selector: 'bedroom',
    devices: [
      {
        name: 'Bedside lamps',
        selector: 'bedroom-lamps',
        model: 'Hue White Ambiance',
        service: HUE,
        features: [
          lightBinary('Bedside lamps', 'bedroom-lamps-binary', 0, { updated: 480 }),
          lightBrightness('Brightness', 'bedroom-lamps-brightness', 35, { updated: 480 }),
          lightTemperature('Color temperature', 'bedroom-lamps-temperature', 20, { updated: 480 })
        ]
      },
      {
        name: 'Thermostat',
        selector: 'bedroom-thermostat',
        model: 'NATherm1',
        service: NETATMO,
        features: [
          thermostatTarget('Setpoint', 'bedroom-thermostat-target', 19.5, { updated: 150 }),
          feature({
            name: 'Mode',
            selector: 'bedroom-thermostat-mode',
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
            min: 0,
            max: 3,
            last_value: 1,
            updated: 150
          })
        ]
      },
      {
        name: 'Bedroom shutter',
        selector: 'bedroom-shutter',
        model: 'Somfy io',
        service: ZIGBEE,
        features: [
          shutterState('Bedroom shutter', 'bedroom-shutter-state', 0, { updated: 500 }),
          shutterPosition('Position', 'bedroom-shutter-position', 100, { updated: 500 })
        ]
      },
      {
        name: 'Bedroom sensor',
        selector: 'bedroom-sensor',
        model: 'Aqara WSDCGQ11LM',
        service: ZIGBEE,
        features: [
          temperature('Temperature', 'bedroom-temperature', 19.8, { updated: 6 }),
          humidity('Humidity', 'bedroom-humidity', 51, { updated: 6 }),
          battery('Battery', 'bedroom-sensor-battery', 81, { updated: 300 })
        ]
      }
    ]
  },
  {
    name: 'Kids room',
    selector: 'kids-room',
    devices: [
      {
        name: 'Kids room light',
        selector: 'kids-room-light',
        model: 'Hue White & Color Ambiance',
        service: HUE,
        features: [
          lightBinary('Kids room light', 'kids-room-light-binary', 0, { updated: 660 }),
          lightBrightness('Brightness', 'kids-room-light-brightness', 25, { updated: 660 }),
          lightColor('Color', 'kids-room-light-color', 10233776, { updated: 660 })
        ]
      },
      {
        name: 'Kids room sensor',
        selector: 'kids-room-sensor',
        model: 'NAModule4',
        service: NETATMO,
        features: [
          temperature('Temperature', 'kids-room-temperature', 20.2, { updated: 7 }),
          humidity('Humidity', 'kids-room-humidity', 49, { updated: 7 }),
          co2('CO2', 'kids-room-co2', 743, { updated: 7 })
        ]
      }
    ]
  },
  {
    name: 'Bathroom',
    selector: 'bathroom',
    devices: [
      {
        name: 'Water heater',
        selector: 'bathroom-water-heater',
        model: 'Thermor Aeromax',
        service: MQTT,
        features: [
          feature({
            name: 'Water heater',
            selector: 'bathroom-water-heater-binary',
            category: DEVICE_FEATURE_CATEGORIES.WATER_HEATER,
            type: DEVICE_FEATURE_TYPES.WATER_HEATER.BINARY,
            min: 0,
            max: 1,
            last_value: 1,
            updated: 90
          }),
          feature({
            name: 'Hot water available',
            selector: 'bathroom-water-heater-remaining',
            category: DEVICE_FEATURE_CATEGORIES.WATER_HEATER,
            type: DEVICE_FEATURE_TYPES.WATER_HEATER.REMAINING_HOT_WATER,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            read_only: true,
            last_value: 82,
            updated: 12
          })
        ]
      },
      {
        name: 'Towel rail',
        selector: 'bathroom-towel-rail',
        model: 'Sonoff S31',
        service: TASMOTA,
        features: [
          switchBinary('Towel rail', 'bathroom-towel-rail-binary', 1, { updated: 45 }),
          switchPower('Power', 'bathroom-towel-rail-power', 480, { updated: 3 })
        ]
      },
      {
        name: 'Bathroom sensor',
        selector: 'bathroom-sensor',
        model: 'Aqara WSDCGQ11LM',
        service: ZIGBEE,
        features: [
          temperature('Temperature', 'bathroom-temperature', 22.6, { updated: 8 }),
          humidity('Humidity', 'bathroom-humidity', 63, { updated: 8 }),
          battery('Battery', 'bathroom-sensor-battery', 74, { updated: 300 })
        ]
      }
    ]
  },
  {
    name: 'Office',
    selector: 'office',
    devices: [
      {
        name: 'Desk lamp',
        selector: 'office-light',
        model: 'Hue Go',
        service: HUE,
        features: [
          lightBinary('Desk lamp', 'office-light-binary', 1, { updated: 55 }),
          lightBrightness('Brightness', 'office-light-brightness', 65, { updated: 55 })
        ]
      },
      {
        name: 'Desk plug',
        selector: 'office-plug',
        model: 'Shelly Plus Plug S',
        service: MQTT,
        features: [
          switchBinary('Desk plug', 'office-plug-binary', 1, { updated: 320 }),
          switchPower('Power', 'office-plug-power', 165, { updated: 2 })
        ]
      },
      {
        name: 'Presence sensor',
        selector: 'office-presence-sensor',
        model: 'Aqara FP2',
        service: ZIGBEE,
        features: [
          presence('Presence', 'office-presence', 1, { updated: 1 }),
          lightSensor('Luminosity', 'office-luminosity', 428, { updated: 5 })
        ]
      },
      {
        name: 'Office sensor',
        selector: 'office-sensor',
        model: 'NAModule4',
        service: NETATMO,
        features: [
          temperature('Temperature', 'office-temperature', 21.9, { updated: 5 }),
          humidity('Humidity', 'office-humidity', 45, { updated: 5 }),
          co2('CO2', 'office-co2', 986, { updated: 5 })
        ]
      }
    ]
  },
  {
    name: 'Garage',
    selector: 'garage',
    devices: [
      {
        name: 'Garage door',
        selector: 'garage-door',
        model: 'Nuki Smart Lock',
        service: MATTER,
        features: [
          feature({
            name: 'Garage door',
            selector: 'garage-door-lock',
            category: DEVICE_FEATURE_CATEGORIES.LOCK,
            type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
            min: 0,
            max: 1,
            last_value: 1,
            updated: 420
          })
        ]
      },
      {
        name: 'Wallbox',
        selector: 'garage-wallbox',
        model: 'Wallbox Pulsar Plus',
        service: MQTT,
        features: [
          feature({
            name: 'Charging',
            selector: 'garage-wallbox-charge',
            category: DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE,
            type: DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_ON,
            min: 0,
            max: 1,
            last_value: 0,
            updated: 400
          }),
          energyPower('Charging power', 'garage-wallbox-power', 0, { updated: 3 })
        ]
      }
    ]
  },
  {
    name: 'Garden',
    selector: 'garden',
    devices: [
      {
        name: 'Garden camera',
        selector: 'garden-camera',
        model: 'Reolink RLC-810A',
        service: RTSP_CAMERA,
        features: [
          feature({
            name: 'Garden camera',
            selector: 'garden-camera-image',
            category: DEVICE_FEATURE_CATEGORIES.CAMERA,
            type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
            min: 0,
            max: 0,
            read_only: true,
            keep_history: false,
            last_value: null,
            updated: 1
          })
        ]
      },
      {
        name: 'Weather station',
        selector: 'garden-weather-station',
        model: 'NAMain',
        service: NETATMO,
        features: [
          temperature('Outdoor temperature', 'outdoor-temperature', 24.3, { updated: 6 }),
          humidity('Outdoor humidity', 'outdoor-humidity', 58, { updated: 6 }),
          feature({
            name: 'Pressure',
            selector: 'outdoor-pressure',
            category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
            unit: DEVICE_FEATURE_UNITS.HECTO_PASCAL,
            min: 900,
            max: 1100,
            read_only: true,
            last_value: 1017,
            updated: 6
          })
        ]
      },
      {
        name: 'Air quality',
        selector: 'garden-air-quality',
        model: 'Airparif',
        service: MQTT,
        features: [airQuality('Air quality index', 'outdoor-aqi', 34, { updated: 25 })]
      },
      {
        name: 'Garden lights',
        selector: 'garden-lights',
        model: 'Hue Lily',
        service: HUE,
        features: [
          lightBinary('Garden lights', 'garden-lights-binary', 0, { updated: 600 }),
          lightBrightness('Brightness', 'garden-lights-brightness', 60, { updated: 600 })
        ]
      },
      {
        name: 'Watering',
        selector: 'garden-watering',
        model: 'SONOFF SWV',
        service: ZIGBEE,
        features: [switchBinary('Watering', 'garden-watering-binary', 0, { updated: 700 })]
      }
    ]
  },
  {
    name: 'Technical room',
    selector: 'technical-room',
    devices: [
      {
        name: 'Electric meter',
        selector: 'electric-meter',
        model: 'Linky',
        service: ENEDIS,
        features: [
          energyPower('Current power', 'home-power', 1180, { updated: 1 }),
          energyIndex('Meter index', 'home-index', 24817, { updated: 1 }),
          feature({
            name: 'Consumption today',
            selector: 'home-daily-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
            min: 0,
            max: 200,
            read_only: true,
            last_value: 9.4,
            updated: 20
          })
        ]
      },
      {
        name: 'Solar inverter',
        selector: 'solar-inverter',
        model: 'Enphase IQ8',
        service: SOLAR,
        features: [
          // Follows the sun: zero at night, like the curve of the chart
          productionPower('Solar production', 'solar-power', solarPowerNow(3400), { updated: 1 }),
          feature({
            name: 'Production today',
            selector: 'solar-daily-production',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.DAILY_PRODUCTION,
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
            min: 0,
            max: 100,
            read_only: true,
            last_value: solarEnergyToday(18),
            updated: 20
          })
        ]
      },
      {
        name: 'Home battery',
        selector: 'home-battery',
        model: 'Enphase IQ Battery 5P',
        service: SOLAR,
        features: [
          feature({
            name: 'Battery level',
            selector: 'home-battery-level',
            category: DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE,
            type: DEVICE_FEATURE_TYPES.BATTERY_STORAGE.BATTERY_LEVEL,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            read_only: true,
            last_value: 68,
            updated: 2
          }),
          feature({
            name: 'Charging power',
            selector: 'home-battery-charge-power',
            category: DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE,
            type: DEVICE_FEATURE_TYPES.BATTERY_STORAGE.CHARGE_POWER,
            unit: DEVICE_FEATURE_UNITS.WATT,
            min: 0,
            max: 5000,
            read_only: true,
            // The battery charges on the solar surplus, so it also stops at night
            last_value: Math.round(solarPowerNow(3400) * 0.4),
            updated: 2
          })
        ]
      }
    ]
  }
];

// Rooms and devices, with the ids and back-references the API returns
const rooms = ROOMS.map(room => ({
  id: uuid(`room-${room.selector}`),
  name: room.name,
  selector: room.selector,
  house_id: HOUSE.id,
  devices: room.devices
}));

const roomSummary = room => ({ id: room.id, name: room.name, selector: room.selector });

const devices = [];
rooms.forEach(room => {
  room.devices = room.devices.map(device => {
    const fullDevice = {
      id: uuid(`device-${device.selector}`),
      name: device.name,
      selector: device.selector,
      external_id: `${device.service.name}:${device.selector}`,
      model: device.model,
      should_poll: false,
      room_id: room.id,
      room: roomSummary(room),
      service_id: device.service.id,
      service: device.service,
      features: device.features,
      params: []
    };
    devices.push(fullDevice);
    return fullDevice;
  });
});

// The integrations actually installed on the demo instance: the services of
// the devices above, so the integration pages and the services page describe
// the same house as the dashboard.
const services = [];
devices.forEach(device => {
  if (!services.some(oneService => oneService.name === device.service.name)) {
    services.push(device.service);
  }
});

const house = {
  ...HOUSE,
  rooms: rooms.map(roomSummary)
};

const USERS = [
  {
    id: uuid('user-tony'),
    firstname: 'Tony',
    lastname: 'Stark',
    selector: 'tony',
    email: 'tony.stark@gladysassistant.com',
    birthdate: '1970-05-29',
    language: 'en',
    role: 'admin',
    temperature_unit_preference: 'celsius',
    distance_unit_preference: 'metric'
  },
  {
    id: uuid('user-pepper'),
    firstname: 'Pepper',
    lastname: 'Potts',
    selector: 'pepper',
    email: 'pepper.potts@gladysassistant.com',
    birthdate: '1973-04-04',
    language: 'en',
    role: 'admin',
    temperature_unit_preference: 'celsius',
    distance_unit_preference: 'metric'
  }
];

const findFeature = selector => {
  let found = null;
  devices.forEach(device => {
    device.features.forEach(deviceFeature => {
      if (deviceFeature.selector === selector) {
        found = { device, feature: deviceFeature };
      }
    });
  });
  return found;
};

export { HOUSE, house, rooms, devices, services, roomSummary, USERS, findFeature };
