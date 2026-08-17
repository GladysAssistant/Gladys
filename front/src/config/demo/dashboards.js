import { uuid } from './helpers';

/**
 * Dashboards of the demo instance.
 *
 * The main one is the storefront of Gladys: it shows the widgets a real user
 * would put on a home screen (clock, weather, alarm, camera, scenes, rooms,
 * music, charts), and the two others show that a dashboard can be built for a
 * specific purpose (energy, comfort).
 */

const dashboard = (name, selector, type, boxes) => ({
  id: uuid(`dashboard-${selector}`),
  name,
  selector,
  type,
  visibility: 'private',
  position: 0,
  boxes,
  created_at: '2024-01-08T09:12:00.000Z',
  updated_at: '2024-01-08T09:12:00.000Z'
});

const HOME_BOXES = [
  [
    {
      type: 'clock',
      clock_type: 'digital',
      clock_display_second: false
    },
    {
      type: 'weather',
      house: 'main-house',
      modes: {
        dateLocation: true,
        currentWeather: true,
        advancedWeather: true,
        hourlyForecast: true,
        dailyForecast: true,
        alerts: true
      }
    },
    {
      type: 'user-presence'
    },
    {
      type: 'sun',
      house: 'main-house'
    }
  ],
  [
    {
      type: 'camera',
      camera: 'garden-camera',
      name: 'Garden'
    },
    {
      type: 'scene',
      name: 'Scenes',
      scenes: ['good-morning', 'movie-night', 'leaving-home', 'good-night']
    },
    {
      type: 'devices-in-room',
      room: 'living-room',
      device_features: [
        'living-room-ceiling-light-binary',
        'living-room-ceiling-light-brightness',
        'living-room-tv-lamp-binary',
        'living-room-tv-lamp-color',
        'living-room-shutter-state',
        'living-room-ac-binary',
        'living-room-ac-target'
      ],
      device_feature_names: [
        'Ceiling light',
        'Brightness',
        'TV backlight',
        'Color',
        'Shutter',
        'Air conditioning',
        'Setpoint'
      ]
    },
    {
      type: 'music',
      device: 'living-room-sonos'
    }
  ],
  [
    {
      type: 'alarm',
      house: 'main-house'
    },
    {
      type: 'chart',
      chart_type: 'area',
      device_features: ['living-room-temperature', 'outdoor-temperature'],
      interval: 'last-week',
      units: ['celsius', 'celsius'],
      title: 'Temperature',
      display_variation: true
    },
    {
      type: 'gauge',
      device_feature: 'solar-power',
      name: 'Solar production',
      gauge_use_custom_value: true,
      gauge_min: 0,
      gauge_max: 4500
    },
    {
      type: 'devices-in-room',
      room: 'kitchen',
      device_features: [
        'kitchen-spots-binary',
        'kitchen-spots-brightness',
        'kitchen-coffee-binary',
        'kitchen-window-opening',
        'kitchen-leak',
        'kitchen-temperature'
      ],
      device_feature_names: ['Kitchen spots', 'Brightness', 'Coffee machine', 'Window', 'Water leak', 'Temperature']
    }
  ]
];

const ENERGY_BOXES = [
  [
    {
      type: 'gauge',
      device_feature: 'home-power',
      name: 'Home consumption',
      gauge_use_custom_value: true,
      gauge_min: 0,
      gauge_max: 6000
    },
    {
      type: 'gauge',
      device_feature: 'home-battery-level',
      name: 'Home battery',
      gauge_use_custom_value: true,
      gauge_min: 0,
      gauge_max: 100
    },
    {
      type: 'edf-tempo'
    }
  ],
  [
    {
      type: 'energy-consumption',
      name: 'Electricity consumption',
      device_features: ['home-index'],
      interval: 'last-week'
    },
    {
      type: 'chart',
      chart_type: 'area',
      device_features: ['solar-power'],
      interval: 'last-day',
      units: ['watt'],
      title: 'Solar production',
      display_variation: true
    }
  ],
  [
    {
      type: 'devices',
      name: 'Energy',
      device_features: [
        'home-power',
        'solar-power',
        'home-battery-level',
        'home-daily-consumption',
        'solar-daily-production'
      ],
      device_feature_names: ['Grid power', 'Solar power', 'Battery', 'Consumed today', 'Produced today']
    },
    {
      type: 'devices-in-room',
      room: 'garage',
      device_features: ['garage-wallbox-charge', 'garage-wallbox-power', 'garage-door-lock'],
      device_feature_names: ['Car charging', 'Charging power', 'Garage door']
    },
    {
      type: 'ecowatt'
    }
  ]
];

const COMFORT_BOXES = [
  [
    {
      type: 'temperature-in-room',
      room: 'living-room'
    },
    {
      type: 'humidity-in-room',
      room: 'living-room'
    },
    {
      type: 'devices-in-room',
      room: 'bedroom',
      device_features: [
        'bedroom-thermostat-target',
        'bedroom-temperature',
        'bedroom-humidity',
        'bedroom-shutter-state',
        'bedroom-lamps-binary'
      ],
      device_feature_names: ['Setpoint', 'Temperature', 'Humidity', 'Shutter', 'Bedside lamps']
    }
  ],
  [
    {
      type: 'chart',
      chart_type: 'line',
      device_features: ['living-room-co2', 'office-co2', 'kids-room-co2'],
      interval: 'last-day',
      units: ['ppm', 'ppm', 'ppm'],
      title: 'CO2',
      display_variation: true
    },
    {
      type: 'devices-in-room',
      room: 'bathroom',
      device_features: [
        'bathroom-water-heater-binary',
        'bathroom-water-heater-remaining',
        'bathroom-towel-rail-binary',
        'bathroom-humidity'
      ],
      device_feature_names: ['Water heater', 'Hot water', 'Towel rail', 'Humidity']
    }
  ],
  [
    {
      type: 'devices',
      name: 'Temperatures',
      device_features: [
        'living-room-temperature',
        'kitchen-temperature',
        'bedroom-temperature',
        'kids-room-temperature',
        'office-temperature',
        'outdoor-temperature'
      ],
      device_feature_names: ['Living room', 'Kitchen', 'Bedroom', 'Kids room', 'Office', 'Outside']
    },
    {
      type: 'link',
      title: 'Gladys documentation',
      url: 'https://gladysassistant.com/docs/',
      icon: 'book-open'
    }
  ]
];

const dashboards = [
  dashboard('Home', 'home', 'main', HOME_BOXES),
  dashboard('Energy', 'energy', 'main', ENERGY_BOXES),
  dashboard('Comfort', 'comfort', 'main', COMFORT_BOXES)
];

export { dashboards };
