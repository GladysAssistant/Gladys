import { readyToSetupStatus, prefetch, machinePort, zbDongleE, ZBDONGLE_E, listPorts } from './wizardFixtures';

// The API answers the dashboard specs share: Zigbee2mqtt installed by Gladys on a USB dongle, and online
const onlineStatus = {
  ...readyToSetupStatus,
  configured: true,
  usbConfigured: true,
  mqttExist: true,
  mqttRunning: true,
  zigbee2mqttExist: true,
  zigbee2mqttRunning: true,
  gladysConnected: true,
  zigbee2mqttConnected: true,
  zigbee2mqttStarting: false,
  z2mEnabled: true,
  dongleMissing: false,
  stopped: false,
  stoppedAt: null,
  updatePending: false,
  z2mVersion: '2.6.0',
  deviceCount: 12,
  coordinatorFirmware: { revision: '7.4.4.0' },
  z2mContainerError: null,
  mqttConnectionError: null
};
// Gladys is connected to the broker, but Zigbee2mqtt does not answer
const notAnsweringStatus = { ...onlineStatus, zigbee2mqttRunning: false, zigbee2mqttConnected: false };
const localSetup = {
  Z2M_MQTT_MODE: 'local',
  Z2M_ADAPTER_MODE: 'usb',
  ZIGBEE2MQTT_DRIVER_PATH: zbDongleE.stablePath,
  ZIGBEE_DONGLE_NAME: ZBDONGLE_E,
  Z2M_TCP_PORT: '12000',
  GLADYS_MQTT_USERNAME: 'gladys',
  GLADYS_MQTT_PASSWORD: 'generated-password'
};
const externalSetup = {
  Z2M_MQTT_MODE: 'external',
  Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883',
  GLADYS_MQTT_USERNAME: 'gladys',
  GLADYS_MQTT_PASSWORD: 'secret'
};
// Two devices of the network not added to Gladys yet, one already added
const discoveredDevices = [
  { name: 'Lamp', external_id: 'zigbee2mqtt:lamp' },
  { name: 'Plug', external_id: 'zigbee2mqtt:plug' },
  { id: 'a0b1c2d3', name: 'Sensor', external_id: 'zigbee2mqtt:sensor' }
];

// Answer of the server to a request it refuses (see refuseWhileInstalling)
const conflict = error => ({ statusCode: 409, body: { status: 409, code: 'CONFLICT', error } });

// Translation with its fields replaced
const i18nText = (key, fields = {}) =>
  Object.keys(fields).reduce(
    (text, field) => text.replace(`{{${field}}}`, fields[field]),
    Cypress._.get(Cypress.env('i18n'), key)
  );

const visitDashboard = ({
  status = onlineStatus,
  setup = localSetup,
  discovered = discoveredDevices,
  statusDelay = 0,
  ports = [[machinePort, zbDongleE]]
} = {}) => {
  const serverUrl = Cypress.env('serverUrl');
  cy.intercept(
    { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
    { body: status, delay: statusDelay }
  ).as('status');
  cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: setup }).as('config');
  cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/discovered*` }, { body: discovered }).as(
    'discovered'
  );
  cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/prefetch` }, { body: prefetch }).as(
    'prefetch'
  );
  listPorts(...ports);
  cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  cy.waitForWebSocket();
};

// The POST of an action, answered with `response`
const answerAction = (action, response = { body: {} }) => {
  const serverUrl = Cypress.env('serverUrl');
  cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/${action}` }, response).as(action);
};

export {
  onlineStatus,
  notAnsweringStatus,
  localSetup,
  externalSetup,
  discoveredDevices,
  conflict,
  i18nText,
  visitDashboard,
  answerAction
};
