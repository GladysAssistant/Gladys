import dayjs from 'dayjs';

import { TONY_PICTURE, PEPPER_PICTURE, CAMERA_IMAGE, REFRESH_TOKEN, ACCESS_TOKEN } from './assets';
import { house, rooms, devices, services, roomSummary, USERS } from './home';
import { dashboards } from './dashboards';
import { getWeather, getSunState } from './weather';
import { scenes, sceneTags, calendars, calendarEvents, messages } from './scenes';
import { getAggregatedStates, getEnergyConsumption, getStatesHistory } from './history';
import { uuid, hoursAgo, minutesAgo, solarPowerNow } from './helpers';
import integrations from './integrations';
import system from './system';

/**
 * Responses served by the demo HTTP client (see utils/DemoHttpClient.js).
 *
 * A key is "<method> <url>", optionally followed by the query string: the
 * client looks for the key with the query first, then falls back to the key
 * without it. A value can be a function: it then receives the query
 * parameters, which is how the demo answers charts, history and device
 * filters like a real server would.
 *
 * Everything about the house itself is derived from ./home.js, so a device
 * added there immediately appears on the dashboard, on the devices page, in
 * the room pages and in the scene editor.
 */

const PICTURES = {
  tony: TONY_PICTURE,
  pepper: PEPPER_PICTURE
};

const average = values =>
  values.length === 0 ? null : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;

const featuresOfRoom = (room, category) =>
  room.devices
    .reduce((features, device) => features.concat(device.features), [])
    .filter(feature => feature.category === category)
    .map(feature => feature.last_value);

// Rooms as the API returns them with ?expand=temperature,humidity,devices:
// the aggregate is an object carrying its unit, like the server returns it
const aggregate = (values, key, unit) => {
  const value = average(values);
  return value === null ? null : { [key]: value, unit };
};

const roomsWithDevices = rooms.map(room => ({
  ...room,
  temperature: aggregate(featuresOfRoom(room, 'temperature-sensor'), 'temperature', 'celsius'),
  humidity: aggregate(featuresOfRoom(room, 'humidity-sensor'), 'humidity', 'percent')
}));

const roomBySelector = {};
roomsWithDevices.forEach(room => {
  roomBySelector[`get /api/v1/room/${room.selector}`] = room;
});

const deviceBySelector = {};
// Acting on a device from the demo does not change anything, but it must not
// fail either: every feature answers its "set value" route.
const deviceFeatureValues = {};
devices.forEach(device => {
  deviceBySelector[`get /api/v1/device/${device.selector}`] = device;
  device.features.forEach(feature => {
    deviceFeatureValues[`post /api/v1/device_feature/${feature.selector}/value`] = { success: true };
  });
});

// Integration pages list the devices of their own service: derived from the
// house too, so opening an integration shows the devices the dashboard and the
// devices page display, and not another installation.
const devicesByService = {};
services.forEach(oneService => {
  devicesByService[`get /api/v1/service/${oneService.name}/device`] = devices.filter(
    device => device.service.name === oneService.name
  );
});

// Services of the house, plus the ones that have no device but a page of their
// own in the demo (messaging, weather, protocols...)
const EXTRA_SERVICES = ['telegram', 'nextcloud-talk', 'caldav', 'openweather', 'usb'];

const serviceList = [
  ...services.map(oneService => ({
    id: oneService.id,
    pod_id: null,
    name: oneService.name,
    selector: oneService.selector,
    version: '0.1.0',
    has_message_feature: false,
    status: 'RUNNING',
    created_at: '2024-01-08T09:12:00.000Z',
    updated_at: '2024-01-08T09:12:00.000Z'
  })),
  ...EXTRA_SERVICES.map(name => ({
    id: uuid(`service-${name}`),
    pod_id: null,
    name,
    selector: name,
    version: '0.1.0',
    has_message_feature: name === 'telegram' || name === 'nextcloud-talk',
    status: 'RUNNING',
    created_at: '2024-01-08T09:12:00.000Z',
    updated_at: '2024-01-08T09:12:00.000Z'
  }))
];

// The community integration installed on the demo instance, as the "Installed"
// view of the catalog lists it, plus the routes of its own pages
const externalIntegrations = services
  .filter(oneService => oneService.type === 'external')
  .map(oneService => ({
    id: oneService.id,
    name: oneService.name,
    selector: oneService.selector,
    store_slug: oneService.store_slug,
    manifest: {
      ...oneService.manifest,
      type: 'device',
      description: 'Reads the production of your solar inverter.'
    },
    status: 'RUNNING',
    connection_status: 'connected',
    docker_image: `ghcr.io/${oneService.store_slug}:1.2.0`,
    version: '1.2.0',
    latest_version: '1.2.0',
    update_available: false,
    started_at: hoursAgo(52),
    containers: []
  }));

const externalIntegrationRoutes = {};
externalIntegrations.forEach(integration => {
  const base = `/api/v1/external_integration/${integration.selector}`;
  externalIntegrationRoutes[`get ${base}`] = integration;
  externalIntegrationRoutes[`get ${base}/config`] = { config: {}, configured_secrets: [] };
  externalIntegrationRoutes[`get ${base}/contact`] = {};
  externalIntegrationRoutes[`get ${base}/logs`] = {
    logs: [
      `${hoursAgo(52)} info: Solar Inverter integration started`,
      `${hoursAgo(52)} info: Connected to inverter at 192.168.1.42`,
      `${hoursAgo(2)} info: Published production power: 2380 W`,
      `${minutesAgo(4)} info: Published production power: ${solarPowerNow(3400)} W`
    ].join('\n')
  };
  externalIntegrationRoutes[`get ${base}/discover`] = [];
  externalIntegrationRoutes[`get ${base}/discovered_device`] = [];
});

// Areas of the map, and the fixture each one needs when it is opened for edit
const AREAS = [
  {
    id: uuid('area-home'),
    name: 'Home',
    selector: 'home-area',
    radius: 300,
    color: '#5f6ac4',
    latitude: house.latitude,
    longitude: house.longitude
  },
  {
    id: uuid('area-office'),
    name: 'Office',
    selector: 'office-area',
    radius: 500,
    color: '#f1c40f',
    latitude: 48.8698,
    longitude: 2.3078
  }
];

const areaBySelector = {};
AREAS.forEach(area => {
  areaBySelector[`get /api/v1/area/${area.selector}`] = area;
  areaBySelector[`patch /api/v1/area/${area.selector}`] = area;
  areaBySelector[`delete /api/v1/area/${area.selector}`] = { success: true };
});

const sceneBySelector = {};
scenes.forEach(scene => {
  sceneBySelector[`get /api/v1/scene/${scene.selector}`] = scene;
  sceneBySelector[`post /api/v1/scene/${scene.selector}/start`] = { success: true };
  sceneBySelector[`post /api/v1/scene/${scene.selector}/stop`] = { success: true };
  sceneBySelector[`patch /api/v1/scene/${scene.selector}`] = scene;
});

const dashboardBySelector = {};
dashboards.forEach(dashboard => {
  dashboardBySelector[`get /api/v1/dashboard/${dashboard.selector}`] = dashboard;
  dashboardBySelector[`patch /api/v1/dashboard/${dashboard.selector}`] = dashboard;
  dashboardBySelector[`delete /api/v1/dashboard/${dashboard.selector}`] = { success: true };
});

/** `GET /device`, optionally filtered by feature selectors or by room. */
const getDevices = (query = {}) => {
  if (query.device_feature_selectors) {
    const selectors = query.device_feature_selectors.split(',');
    return devices
      .filter(device => device.features.some(feature => selectors.includes(feature.selector)))
      .map(device => ({
        ...device,
        features: device.features.filter(feature => selectors.includes(feature.selector))
      }));
  }
  if (query.room_id) {
    return devices.filter(device => device.room_id === query.room_id);
  }
  return devices;
};

/** `GET /scene`, with the filters of the scene list and of the scene widget. */
const getScenes = (query = {}) => {
  let result = scenes;
  if (query.selectors) {
    const selectors = query.selectors.split(',');
    result = selectors.map(selector => result.find(scene => scene.selector === selector)).filter(scene => scene);
  }
  if (query.search) {
    const search = query.search.toLowerCase();
    result = result.filter(scene => scene.name.toLowerCase().includes(search));
  }
  if (query.tags) {
    const tags = query.tags.split(',');
    result = result.filter(scene => scene.tags.some(tag => tags.includes(tag.name)));
  }
  if (query.order_dir === 'desc') {
    result = [...result].reverse();
  }
  return result;
};

/**
 * RTE Ecowatt signals: 1 (green) all along, with a couple of hours in orange
 * so the widget shows what a tense hour looks like.
 */
const ecowattDay = (date, values) => ({
  jour: date.toISOString(),
  dvalue: Math.max(...values),
  values: values.map((hvalue, pas) => ({ pas, hvalue }))
});

const getEcowattSignals = () => {
  const today = new Array(24).fill(1);
  today[19] = 2;
  today[20] = 2;
  const tomorrow = new Array(24).fill(1);
  return {
    today: ecowattDay(dayjs().startOf('day'), today),
    tomorrow: ecowattDay(
      dayjs()
        .add(1, 'day')
        .startOf('day'),
      tomorrow
    ),
    days: [0, 1, 2, 3].map(offset =>
      ecowattDay(
        dayjs()
          .add(offset, 'day')
          .startOf('day'),
        offset === 0 ? today : tomorrow
      )
    )
  };
};

/**
 * Credentials the integration pages read before showing their setup form. The
 * demo has none - it talks to no third party - so they answer an empty value,
 * which is what an instance that was never configured returns.
 */
const SERVICE_VARIABLES = {
  telegram: ['TELEGRAM_API_KEY'],
  openweather: ['OPENWEATHER_API_KEY'],
  caldav: ['CALDAV_HOST', 'CALDAV_URL', 'CALDAV_USERNAME', 'CALDAV_PASSWORD', 'CALDAV_CHECK_SSL'],
  'nextcloud-talk': ['NEXTCLOUD_URL', 'NEXTCLOUD_BOT_USERNAME', 'NEXTCLOUD_BOT_PASSWORD', 'NEXTCLOUD_TALK_TOKEN'],
  callmebot: ['CALLMEBOT_API_KEY', 'CALLMEBOT_PHONE_NUMBER', 'CALLMEBOT_MESSAGING_SERVICE'],
  'free-mobile': ['FREE_MOBILE_USERNAME', 'FREE_MOBILE_ACCESS_TOKEN'],
  ewelink: ['EWELINK_EMAIL', 'EWELINK_PASSWORD'],
  homekit: ['HOMEKIT_SETUP_URI', 'HOMEKIT_EXPOSED_DEVICES', 'HOMEKIT_EXPOSURE_MODE', 'HOMEKIT_MDNS_ADVERTISER'],
  'node-red': ['NODE_RED_USERNAME', 'NODE_RED_PASSWORD', 'NODE_RED_PORT'],
  melcloud: ['MELCLOUD_USERNAME', 'MELCLOUD_PASSWORD'],
  matter: ['MATTER_ENABLED'],
  tuya: [
    'TUYA_ACCESS_KEY',
    'TUYA_SECRET_KEY',
    'TUYA_ENDPOINT',
    'TUYA_APP_USERNAME',
    'TUYA_APP_ACCOUNT_UID',
    'TUYA_APP_PASSWORD'
  ]
};

const serviceVariables = {};
Object.entries(SERVICE_VARIABLES).forEach(([serviceName, names]) => {
  names.forEach(name => {
    serviceVariables[`get /api/v1/service/${serviceName}/variable/${name}`] = {
      value: name === 'MATTER_ENABLED' ? 'true' : null
    };
    serviceVariables[`post /api/v1/service/${serviceName}/variable/${name}`] = { success: true };
  });
});

// System variables read by the settings pages. Saving one from the demo
// always succeeds and changes nothing.
const VARIABLE_VALUES = {
  TIMEZONE: 'Europe/Paris',
  DEVICE_STATE_HISTORY_IN_DAYS: '90',
  DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED: '24',
  DEVICE_BATTERY_LEVEL_WARNING_ENABLED: 'true',
  DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD: '15',
  AI_WEEKLY_DIGEST_ENABLED: 'false',
  AI_WEEKLY_DIGEST_DAY: '1',
  AI_WEEKLY_DIGEST_HOUR: '9'
};

const variables = {};
Object.entries(VARIABLE_VALUES).forEach(([name, value]) => {
  variables[`get /api/v1/variable/${name}`] = { name, value };
  variables[`post /api/v1/variable/${name}`] = { name, value };
});

const home = {
  // --- Session & users ---------------------------------------------------
  'post /api/v1/login': {
    ...USERS[0],
    refresh_token: REFRESH_TOKEN,
    access_token: ACCESS_TOKEN
  },
  'post /api/v1/access-token': {
    access_token: ACCESS_TOKEN
  },
  // The locked screen checks the token through this route before unlocking
  'post /api/v1/access_token': {
    access_token: ACCESS_TOKEN
  },
  'get /api/v1/me': {
    ...USERS[0],
    language: (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en',
    refresh_token: REFRESH_TOKEN,
    access_token: ACCESS_TOKEN
  },
  'get /api/v1/me/picture': TONY_PICTURE,
  'post /api/v1/user': USERS[0],
  'patch /api/v1/user': USERS[0],
  'get /api/v1/user': USERS.map((user, index) => ({
    ...user,
    picture: PICTURES[user.selector],
    current_house_id: index === 0 ? house.id : null,
    last_house_changed: dayjs()
      .subtract(index === 0 ? 25 : 320, 'minute')
      .toISOString(),
    last_latitude: index === 0 ? house.latitude : 48.8698,
    last_longitude: index === 0 ? house.longitude : 2.3078,
    last_altitude: 35,
    last_accuracy: 12,
    last_location_changed: dayjs()
      .subtract(index === 0 ? 25 : 320, 'minute')
      .toISOString()
  })),
  'get /api/v1/user/tony': USERS[0],
  'get /api/v1/user/pepper': USERS[1],
  'get /api/v1/user/variable/INTEGRATION_FAVORITES': {
    name: 'INTEGRATION_FAVORITES',
    value: JSON.stringify(['zigbee2mqtt', 'philips-hue', 'sonos'])
  },
  'post /api/v1/user/variable/INTEGRATION_FAVORITES': { success: true },
  'get /api/v1/session/tablet_mode': {
    tablet_mode: false,
    current_house_id: house.id
  },

  // --- Dashboards --------------------------------------------------------
  'get /api/v1/dashboard': dashboards.map(({ id, name, type, selector, visibility, position }) => ({
    id,
    name,
    type,
    selector,
    visibility,
    position
  })),
  'post /api/v1/dashboard': dashboards[0],
  ...dashboardBySelector,

  // --- House, rooms & devices --------------------------------------------
  'get /api/v1/house': [house],
  'get /api/v1/house/main-house': house,
  'post /api/v1/house': house,
  'post /api/v1/house/main-house/room': rooms[0],
  'post /api/v1/house/main-house/arm': { ...house, alarm_mode: 'armed' },
  'post /api/v1/house/main-house/partial_arm': { ...house, alarm_mode: 'partially-armed' },
  'post /api/v1/house/main-house/disarm': { ...house, alarm_mode: 'disarmed' },
  'post /api/v1/house/main-house/panic': { ...house, alarm_mode: 'panic' },
  'get /api/v1/house/main-house/weather': getWeather,
  'get /api/v1/house/main-house/sun': getSunState,
  'get /api/v1/weather/provider': ['openweather'],
  'get /api/v1/service': serviceList,
  ...serviceVariables,
  'post /api/v1/service/mqtt/debug_mode': { success: true },
  ...devicesByService,
  'get /api/v1/external_integration': externalIntegrations,
  ...externalIntegrationRoutes,
  'get /api/v1/service/ecowatt/signals': getEcowattSignals,
  // Messaging channels a "send a message" scene action can target
  'get /api/v1/service/message': [
    { name: 'telegram', status: 'RUNNING' },
    { name: 'nextcloud-talk', status: 'RUNNING' }
  ],
  'get /api/v1/room': rooms.map(roomSummary),
  'get /api/v1/room?expand=devices': roomsWithDevices,
  ...roomBySelector,
  'get /api/v1/device': getDevices,
  ...deviceBySelector,
  ...deviceFeatureValues,
  'post /api/v1/device': devices[0],
  'get /api/v1/camera': devices.filter(device => device.features.some(feature => feature.category === 'camera')),
  'get /api/v1/camera/garden-camera/image': CAMERA_IMAGE,
  'get /api/v1/area': AREAS,
  ...areaBySelector,
  'post /api/v1/area': AREAS[0],

  // --- Device states -----------------------------------------------------
  'get /api/v1/device_feature/aggregated_states': getAggregatedStates,
  'get /api/v1/device_feature/energy_consumption': getEnergyConsumption,
  'get /api/v1/device_feature/states_history': getStatesHistory,

  // --- Scenes ------------------------------------------------------------
  'get /api/v1/scene': getScenes,
  'get /api/v1/scene/running': [],
  'post /api/v1/scene': scenes[0],
  'get /api/v1/tag_scene': sceneTags,
  ...sceneBySelector,

  // --- Calendar ----------------------------------------------------------
  'get /api/v1/calendar': calendars,
  'get /api/v1/calendar/event': calendarEvents,

  // --- Chat --------------------------------------------------------------
  'get /api/v1/message': messages,
  'post /api/v1/message': messages[0],

  // --- Settings ----------------------------------------------------------
  ...variables,
  'get /api/v1/device/duckdb_migration_state': {
    is_migration_needed: false,
    is_duck_db_migrated: true,
    sqlite_db_device_state_count: 0,
    duck_db_device_count: 1284530
  }
};

const data = {
  ...home,
  ...integrations,
  ...system
};

export default data;
