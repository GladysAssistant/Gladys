// The API answers and messages the setup wizard specs share
// Nothing configured yet
const readyToSetupStatus = {
  usbConfigured: false,
  networkAdapterConfigured: false,
  mqttExist: false,
  mqttRunning: false,
  zigbee2mqttExist: false,
  zigbee2mqttRunning: false,
  gladysConnected: false,
  zigbee2mqttConnected: false,
  z2mEnabled: false,
  dockerBased: true,
  networkModeValid: true,
  ezspFallback: false,
  installation: { state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null },
  prefetch: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null }
};
const { prefetch } = readyToSetupStatus;
const LINK_E = 'usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_8e73883472d9ee11bb48b74c37b89984-if00-port0';
const LINK_P = 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_4c004e9c53c9ef1190b2f5d2c8b1b3a9-if00-port0';
const LINK_UNKNOWN = 'usb-Silicon_Labs_CP2102N_USB_to_UART_Bridge_Controller_0001-if00-port0';
const ZBDONGLE_E = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';
const ZBDONGLE_P = 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P';
const machinePort = { path: '/dev/ttyS0', stablePath: '/dev/ttyS0', name: null, adapter: null };
const zbDongleE = {
  path: '/dev/ttyUSB0',
  stablePath: `/dev/serial/by-id/${LINK_E}`,
  name: 'Itead Sonoff Zigbee 3.0 USB Dongle Plus V2',
  pnpId: LINK_E,
  adapter: ZBDONGLE_E
};
const zbDongleP = {
  path: '/dev/ttyUSB1',
  stablePath: `/dev/serial/by-id/${LINK_P}`,
  name: 'ITead Sonoff Zigbee 3.0 USB Dongle Plus',
  pnpId: LINK_P,
  adapter: ZBDONGLE_P
};
const unknownDongle = {
  path: '/dev/ttyUSB2',
  stablePath: `/dev/serial/by-id/${LINK_UNKNOWN}`,
  name: 'Silicon Labs CP2102N USB to UART Bridge Controller 0001',
  pnpId: LINK_UNKNOWN,
  adapter: null
};

const phases = states => Object.keys(states).map(key => ({ key, state: states[key], progress: 0 }));
const runningInstallation = {
  state: 'running',
  kind: 'install',
  phases: phases({
    pull_z2m: 'done',
    pull_mqtt: 'skipped',
    start_mqtt: 'done',
    start_z2m: 'running',
    connect_adapter: 'pending'
  }),
  progress: 64,
  error: null,
  durationMs: null
};
const failedInstallation = {
  ...runningInstallation,
  state: 'failed',
  phases: phases({
    pull_z2m: 'done',
    pull_mqtt: 'skipped',
    start_mqtt: 'done',
    start_z2m: 'done',
    connect_adapter: 'failed'
  }),
  progress: 80,
  error: {
    code: 'ADAPTER_NO_RESPONSE',
    message: '[zh:ember] Failed to start EZSP layer with status=HOST_FATAL_ERROR.'
  },
  durationMs: 140000
};
const doneInstallation = {
  ...runningInstallation,
  state: 'done',
  phases: phases({
    pull_z2m: 'done',
    pull_mqtt: 'skipped',
    start_mqtt: 'done',
    start_z2m: 'done',
    connect_adapter: 'done'
  }),
  progress: 100,
  durationMs: 102000
};
const usbSetup = {
  ZIGBEE2MQTT_DRIVER_PATH: zbDongleE.stablePath,
  ZIGBEE_DONGLE_NAME: ZBDONGLE_E,
  Z2M_ADAPTER_MODE: 'usb',
  Z2M_MQTT_MODE: 'local'
};

const sendProgress = installation =>
  cy.sendWebSocket({ type: 'zigbee2mqtt.install-progress', payload: { installation, prefetch } });
const sendStatus = status => cy.sendWebSocket({ type: 'zigbee2mqtt.status-change', payload: status });

// The ports listed by the server, one list after the other, the last one again
const listPorts = (...lists) => {
  const serverUrl = Cypress.env('serverUrl');
  let request = 0;
  cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port` }, req => {
    req.reply({ body: lists[Math.min(request, lists.length - 1)] });
    request += 1;
  }).as('usbPorts');
};

// The setup answers the saved configuration, which GET /setup then answers too
const answerSetup = (response = { body: usbSetup }) => {
  const serverUrl = Cypress.env('serverUrl');
  cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, response).as('setup');
  if (!response.statusCode) {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: response.body });
  }
};

const visitWizard = ({ status = readyToSetupStatus, setup = {}, ports = [[machinePort, zbDongleE]] } = {}) => {
  const serverUrl = Cypress.env('serverUrl');
  cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { body: status }).as('status');
  cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: setup });
  cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/prefetch` }, { body: prefetch }).as(
    'prefetch'
  );
  listPorts(...ports);
  cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  cy.waitForWebSocket();
};

export {
  readyToSetupStatus,
  prefetch,
  machinePort,
  zbDongleE,
  zbDongleP,
  unknownDongle,
  ZBDONGLE_E,
  ZBDONGLE_P,
  phases,
  runningInstallation,
  failedInstallation,
  doneInstallation,
  usbSetup,
  sendProgress,
  sendStatus,
  listPorts,
  answerSetup,
  visitWizard
};
