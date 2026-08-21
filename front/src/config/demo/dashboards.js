import { uuid } from './helpers';

/**
 * Dashboards of the demo instance.
 *
 * They are built on the Horizon layout: a dashboard is a stack of sections,
 * each section owning its own columns (see
 * docs/specs/dashboard-flexible-layout-and-widgets.md). The main one is the
 * storefront of Gladys — a wall-panel-grade home screen with a chips bar, quick
 * actions, the house view and its live pins — and the two others show that a
 * dashboard can be built for one purpose, with its own background scene.
 */

const dashboard = ({ name, selector, position, icon, backgroundScene = null, width = 'standard', sections }) => ({
  id: uuid(`dashboard-${selector}`),
  name,
  selector,
  type: 'main',
  visibility: 'private',
  position,
  icon,
  background_scene: backgroundScene,
  width,
  boxes: sections.map(columns => ({ columns })),
  created_at: '2024-01-08T09:12:00.000Z',
  updated_at: '2024-01-08T09:12:00.000Z'
});

// --- Home ----------------------------------------------------------------

// The bar of compact states a wall panel is read from, across the room
const HOME_CHIPS = {
  type: 'chips',
  chips: [
    { chip_type: 'alarm', house: 'main-house' },
    { chip_type: 'openings', house: 'main-house' },
    { chip_type: 'device-feature', device_feature: 'living-room-temperature', label: 'Living room' },
    { chip_type: 'device-feature', device_feature: 'outdoor-temperature', label: 'Outside' },
    { chip_type: 'device-feature', device_feature: 'solar-power', label: 'Solar' },
    { chip_type: 'device-feature', device_feature: 'home-battery-level', label: 'Battery' },
    { chip_type: 'calendar-next-event' }
  ]
};

// One tap = one action, the command-side sibling of the chips bar
const HOME_ACTIONS = {
  type: 'actions',
  name: 'Quick actions',
  actions: [
    { action_type: 'scene', scene: 'good-morning' },
    { action_type: 'scene', scene: 'movie-night' },
    { action_type: 'scene', scene: 'leaving-home' },
    { action_type: 'device-feature', device_feature: 'living-room-ceiling-light-binary', label: 'Ceiling light' },
    { action_type: 'device-feature', device_feature: 'kitchen-spots-binary', label: 'Kitchen' },
    { action_type: 'device-feature', device_feature: 'living-room-shutter-state', value: 1, label: 'Open' },
    { action_type: 'device-feature', device_feature: 'living-room-shutter-state', value: -1, label: 'Close' }
  ]
};

// The signature widget: live values pinned on the house illustration
const HOUSE_VIEW = {
  type: 'house-view',
  name: 'My house',
  image: 'gallery:house-solar',
  pins: [
    { x_pct: 46, y_pct: 20, device_feature: 'solar-power', label: 'Solar' },
    { x_pct: 15, y_pct: 62, device_feature: 'outdoor-temperature' },
    { x_pct: 52, y_pct: 55, device_feature: 'living-room-temperature', label: 'Living room' },
    { x_pct: 78, y_pct: 70, device_feature: 'home-battery-level', label: 'Battery' }
  ]
};

const HOME_SECTIONS = [
  [[HOME_CHIPS]],
  [
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
        type: 'sun',
        house: 'main-house'
      }
    ],
    [
      HOUSE_VIEW,
      {
        type: 'camera',
        camera: 'garden-camera',
        name: 'Garden'
      }
    ],
    [
      HOME_ACTIONS,
      {
        type: 'scene',
        name: 'Scenes',
        scenes: ['good-morning', 'movie-night', 'leaving-home', 'good-night'],
        // each scene button carries a live state subtitle
        scene_status_features: {
          'good-morning': 'kitchen-coffee-binary',
          'movie-night': 'living-room-tv-binary',
          'leaving-home': 'living-room-ceiling-light-binary',
          'good-night': 'bedroom-thermostat-target'
        }
      },
      {
        type: 'alarm',
        house: 'main-house'
      }
    ]
  ],
  [
    [{ type: 'temperature-in-room', room: 'living-room' }],
    [{ type: 'temperature-in-room', room: 'bedroom' }],
    [{ type: 'temperature-in-room', room: 'kids-room' }],
    [{ type: 'temperature-in-room', room: 'office' }]
  ],
  [
    [
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
    ],
    [
      {
        type: 'user-presence'
      },
      {
        type: 'chart',
        chart_type: 'area',
        device_features: ['living-room-temperature', 'outdoor-temperature'],
        interval: 'last-week',
        units: ['celsius', 'celsius'],
        title: 'Temperature',
        display_variation: true
      }
    ]
  ]
];

// --- Energy --------------------------------------------------------------

const ENERGY_SECTIONS = [
  [
    [
      {
        type: 'chips',
        chips: [
          { chip_type: 'device-feature', device_feature: 'solar-power', label: 'Producing' },
          { chip_type: 'device-feature', device_feature: 'home-power', label: 'Consuming' },
          { chip_type: 'device-feature', device_feature: 'home-battery-level', label: 'Battery' },
          { chip_type: 'device-feature', device_feature: 'solar-daily-production', label: 'Produced today' },
          { chip_type: 'device-feature', device_feature: 'home-daily-consumption', label: 'Consumed today' }
        ]
      }
    ]
  ],
  [
    [
      {
        type: 'energy-consumption',
        name: 'Electricity consumption',
        device_features: ['home-index'],
        interval: 'last-week'
      }
    ],
    [
      {
        type: 'chart',
        chart_type: 'area',
        device_features: ['solar-power'],
        interval: 'last-day',
        units: ['watt'],
        title: 'Solar production',
        display_variation: true
      },
      {
        type: 'gauge',
        device_feature: 'home-battery-level',
        name: 'Home battery',
        gauge_use_custom_value: true,
        gauge_min: 0,
        gauge_max: 100
      }
    ]
  ],
  [
    [
      {
        type: 'gauge',
        device_feature: 'home-power',
        name: 'Home consumption',
        gauge_use_custom_value: true,
        gauge_min: 0,
        gauge_max: 6000
      }
    ],
    [{ type: 'edf-tempo' }],
    [{ type: 'ecowatt' }]
  ],
  [
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
      }
    ],
    [
      {
        type: 'actions',
        name: 'Car',
        actions: [
          { action_type: 'scene', scene: 'solar-car-charge' },
          { action_type: 'device-feature', device_feature: 'garage-door-lock', label: 'Garage door' }
        ]
      },
      {
        type: 'devices-in-room',
        room: 'garage',
        device_features: ['garage-wallbox-charge', 'garage-wallbox-power', 'garage-door-lock'],
        device_feature_names: ['Car charging', 'Charging power', 'Garage door']
      }
    ]
  ]
];

// --- Comfort -------------------------------------------------------------

const COMFORT_SECTIONS = [
  [
    [
      {
        type: 'chips',
        chips: [
          { chip_type: 'openings', house: 'main-house' },
          { chip_type: 'device-feature', device_feature: 'living-room-co2', label: 'Living room' },
          { chip_type: 'device-feature', device_feature: 'office-co2', label: 'Office' },
          { chip_type: 'device-feature', device_feature: 'kids-room-co2', label: 'Kids room' },
          { chip_type: 'device-feature', device_feature: 'bathroom-humidity', label: 'Bathroom' }
        ]
      }
    ]
  ],
  [
    [{ type: 'temperature-in-room', room: 'living-room' }],
    [{ type: 'humidity-in-room', room: 'living-room' }],
    [{ type: 'temperature-in-room', room: 'bathroom' }],
    [{ type: 'humidity-in-room', room: 'bathroom' }]
  ],
  [
    [
      {
        type: 'chart',
        chart_type: 'line',
        device_features: ['living-room-co2', 'office-co2', 'kids-room-co2'],
        interval: 'last-day',
        units: ['ppm', 'ppm', 'ppm'],
        title: 'CO2',
        display_variation: true
      }
    ],
    [
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
    ]
  ],
  [
    [
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
      }
    ],
    [
      {
        type: 'link',
        title: 'Gladys documentation',
        url: 'https://gladysassistant.com/docs/',
        icon: 'book-open'
      }
    ]
  ]
];

const dashboards = [
  dashboard({ name: 'Home', selector: 'home', position: 0, icon: 'home', sections: HOME_SECTIONS }),
  dashboard({
    name: 'Energy',
    selector: 'energy',
    position: 1,
    icon: 'zap',
    backgroundScene: 'dusk',
    width: 'full',
    sections: ENERGY_SECTIONS
  }),
  dashboard({
    name: 'Comfort',
    selector: 'comfort',
    position: 2,
    icon: 'thermometer',
    backgroundScene: 'lagoon',
    sections: COMFORT_SECTIONS
  })
];

export { dashboards };
