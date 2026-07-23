const { fake } = require('sinon');

const ExternalIntegration = require('../../../lib/external-integration');
const StateManager = require('../../../lib/state');
const Variable = require('../../../lib/variable');
const { Cache } = require('../../../utils/cache');
const db = require('../../../models');
const { generateIntegrationToken } = require('../../../utils/integrationToken');
const { SERVICE_STATUS, SERVICE_TYPES } = require('../../../utils/constants');

const TEST_JWT_SECRET = 'secret';

const TEST_MANIFEST = {
  manifest_version: 1,
  type: 'device',
  name: 'Open-Meteo Demo',
  description: {
    en: 'Weather sensor and virtual switch demo integration.',
    fr: 'Intégration démo : capteur météo et interrupteur virtuel.',
  },
  version: '1.2.0',
  docker_image: 'ghcr.io/john/gladys-open-meteo-demo:1.2.0',
  gladys_version: '>=4.62.0',
  cover_image: 'https://raw.githubusercontent.com/john/gladys-open-meteo-demo/main/cover.jpg',
  config_schema: [
    {
      key: 'latitude',
      type: 'number',
      label: { en: 'Latitude', fr: 'Latitude' },
      required: true,
      default: 48.85,
      min: -90,
      max: 90,
    },
    {
      key: 'api_key',
      type: 'secret',
      label: { en: 'API key', fr: "Clé d'API" },
      required: false,
    },
    {
      key: 'unit',
      type: 'select',
      label: { en: 'Unit', fr: 'Unité' },
      default: 'celsius',
      options: [
        { value: 'celsius', label: { en: 'Celsius', fr: 'Celsius' } },
        { value: 'fahrenheit', label: { en: 'Fahrenheit', fr: 'Fahrenheit' } },
      ],
    },
    {
      key: 'name',
      type: 'string',
      label: { en: 'Name' },
    },
    {
      key: 'enabled',
      type: 'boolean',
      label: { en: 'Enabled' },
    },
  ],
};

// Communication-type fixture: a messaging channel (Telegram-like bot), no
// device screens, the user links their account with a short code.
const TEST_COMMUNICATION_MANIFEST = {
  manifest_version: 1,
  type: 'communication',
  name: 'Signal Bridge Demo',
  description: {
    en: 'Signal messaging channel demo integration.',
    fr: 'Intégration démo : canal de messagerie Signal.',
  },
  version: '1.0.0',
  docker_image: 'ghcr.io/john/gladys-signal-bridge:1.0.0',
  gladys_version: '>=4.62.0',
};

// Notification-channel fixture (the Free Mobile family): send only, no
// inbound path — the per-user identity comes from the contact_schema
// ("My account" block), never from a code-based link.
const TEST_NOTIFICATION_MANIFEST = {
  ...TEST_COMMUNICATION_MANIFEST,
  name: 'Free Mobile SMS Demo',
  description: {
    en: 'Free Mobile SMS notification channel demo.',
    fr: 'Intégration démo : notifications SMS Free Mobile.',
  },
  messaging: { receive: false },
  contact_schema: [
    // presentational intro block: skipped by the front view of the profile
    { key: 'intro', type: 'section', label: { en: 'Free Mobile account' } },
    { key: 'username', type: 'string', label: { en: 'Free Mobile username', fr: 'Identifiant Free Mobile' } },
    { key: 'access_token', type: 'secret', label: { en: 'SMS API access token' } },
  ],
};

// Netatmo-like fixture: inbound webhooks relayed by the Gladys Plus
// gateway — one fire-and-forget event stream (default mode) and one sync
// challenge/response registration callback.
const TEST_WEBHOOKS_MANIFEST = {
  ...TEST_MANIFEST,
  webhooks: [
    { key: 'events', label: { en: 'Netatmo events' } },
    { key: 'callback', label: { en: 'Subscription callback' }, mode: 'sync' },
  ],
};

// Frigate-like fixture: one manual sub-container (Mosquitto pattern: the
// password file is generated in /data before the first start) and one auto
// sub-container with volumes, a published port and hardware classes.
const TEST_CONTAINERS_MANIFEST = {
  ...TEST_MANIFEST,
  containers: [
    {
      name: 'mqtt',
      docker_image: 'eclipse-mosquitto:2.0.18',
      start: 'manual',
      volumes: ['/mosquitto/config', '/mosquitto/data'],
      memory_mb: 128,
    },
    {
      name: 'frigate',
      docker_image: 'ghcr.io/blakeblackshear/frigate:0.14.1',
      volumes: ['/config'],
      read_only: false,
      memory_mb: 1024,
      shm_mb: 128,
      cpu: 1,
      env: { LIBVA_DRIVER_NAME: 'i965' },
      command: ['python3', '-u', '-m', 'frigate'],
      ports: [{ container_port: 5000, label: { en: 'Frigate UI', fr: 'Interface Frigate' } }],
      devices: ['coral-usb', 'gpu'],
    },
  ],
};

const TEST_DETECTED_CLASSES = [
  { class: 'coral-usb', detected: true, paths: ['/dev/bus/usb'] },
  { class: 'coral-pcie', detected: false, paths: [] },
  { class: 'gpu', detected: true, paths: ['/dev/dri'] },
  { class: 'video', detected: false, paths: [] },
];

/**
 * @description Build a fake system manager for supervisor tests.
 * @param {object} [overrides] - Fakes to override.
 * @returns {object} The fake system.
 * @example
 * const system = buildFakeSystem();
 */
function buildFakeSystem(overrides = {}) {
  return {
    dockerode: {},
    gladysVersion: 'v4.82.0',
    pull: fake.resolves(true),
    createContainer: fake.resolves({ id: 'container-1' }),
    removeContainer: fake.resolves(true),
    stopContainer: fake.resolves(true),
    restartContainer: fake.resolves(true),
    // simulates a healthy container holding a CURRENT integration token
    // (the happy path of verifyContainerToken); tests exercising a stale
    // token override inspectContainer
    inspectContainer: fake(async (containerId) => {
      const serviceInDb = await db.Service.findOne({ where: { container_id: containerId } });
      const env = serviceInDb
        ? [
            `GLADYS_INTEGRATION_TOKEN=${generateIntegrationToken(
              serviceInDb.id,
              serviceInDb.token_version,
              TEST_JWT_SECRET,
            )}`,
          ]
        : [];
      return { State: { Running: true }, Config: { Env: env } };
    }),
    getContainers: fake.resolves([]),
    getContainerLogs: fake.resolves(Buffer.from('log line')),
    createNetwork: fake.resolves(true),
    removeNetwork: fake.resolves(true),
    getNetworks: fake.resolves([]),
    connectToNetwork: fake.resolves(true),
    inspectNetwork: fake.resolves({ IPAM: { Config: [{ Gateway: '172.30.0.1' }] } }),
    getNetworkMode: fake.resolves('host'),
    getGladysBasePath: fake.resolves({
      basePathOnContainer: '/var/lib/gladysassistant',
      basePathOnHost: '/var/lib/gladysassistant',
    }),
    getGladysContainerId: fake.resolves('gladys-container-id'),
    getImageLabels: fake.resolves({}),
    detectHardwareClasses: fake.resolves(TEST_DETECTED_CLASSES),
    ...overrides,
  };
}

/**
 * @description Build a supervisor wired with fakes for tests.
 * @param {object} [options] - Options.
 * @param {object} [options.system] - System fakes overrides.
 * @returns {object} { externalIntegration, event, system, stateManager, device, variable }.
 * @example
 * const { externalIntegration } = buildSupervisor();
 */
function buildSupervisor({ system: systemOverrides } = {}) {
  const event = { emit: fake.returns(null), on: fake.returns(null) };
  const system = buildFakeSystem(systemOverrides);
  const stateManager = new StateManager(event);
  const device = { destroy: fake.resolves(null) };
  const variable = new Variable(event);
  const serviceManager = {};
  const cache = new Cache();
  const externalIntegration = new ExternalIntegration(
    event,
    system,
    serviceManager,
    stateManager,
    device,
    variable,
    TEST_JWT_SECRET,
    cache,
  );
  externalIntegration.available = true;
  return { externalIntegration, event, system, stateManager, device, variable, cache };
}

/**
 * @description Seed one external integration service in DB.
 * @param {object} [overrides] - Columns to override.
 * @returns {Promise<object>} The created service (plain).
 * @example
 * const service = await seedExternalService();
 */
async function seedExternalService(overrides = {}) {
  const createdService = await db.Service.create({
    name: 'ext-dev-open-meteo-demo',
    selector: 'ext-dev-open-meteo-demo',
    version: '1.2.0',
    has_message_feature: false,
    status: SERVICE_STATUS.RUNNING,
    type: SERVICE_TYPES.EXTERNAL,
    docker_image: TEST_MANIFEST.docker_image,
    manifest: TEST_MANIFEST,
    container_id: 'container-1',
    token_version: 1,
    ...overrides,
  });
  return createdService.get({ plain: true });
}

module.exports = {
  TEST_JWT_SECRET,
  TEST_MANIFEST,
  TEST_COMMUNICATION_MANIFEST,
  TEST_NOTIFICATION_MANIFEST,
  TEST_WEBHOOKS_MANIFEST,
  TEST_CONTAINERS_MANIFEST,
  TEST_DETECTED_CLASSES,
  buildFakeSystem,
  buildSupervisor,
  seedExternalService,
};
