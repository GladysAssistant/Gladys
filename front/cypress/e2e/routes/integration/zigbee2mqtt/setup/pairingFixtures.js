// The API answers of the pairing window (docs/specs/zigbee2mqtt-pairing.md)

const closedJoining = { allowed: false, remainingSeconds: null };

const houses = [{ id: 'house-1', name: 'Home', rooms: [{ id: 'room-1', name: 'Kitchen' }] }];

// A device whose interview succeeded: the Gladys device the Discover tab gets
const readyBulb = {
  ieee_address: '0x000b57fffec6a5b2',
  friendly_name: '0x000b57fffec6a5b2',
  status: 'ready',
  model: 'LED1545G12',
  vendor: 'IKEA',
  description: 'TRADFRI bulb E27',
  updated_at: '2026-11-20T10:00:00.000Z',
  device: {
    name: '0x000b57fffec6a5b2',
    external_id: 'zigbee2mqtt:0x000b57fffec6a5b2',
    selector: 'zigbee2mqtt-0x000b57fffec6a5b2',
    model: 'LED1545G12',
    ieee_address: '0x000b57fffec6a5b2',
    should_poll: false,
    features: [
      {
        name: 'state',
        category: 'light',
        type: 'binary',
        external_id: 'zigbee2mqtt:0x000b57fffec6a5b2:light:binary:state',
        selector: 'zigbee2mqtt-0x000b57fffec6a5b2-light-binary-state',
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1
      }
    ],
    params: []
  }
};

// A model Zigbee2mqtt does not know, with the generic features it deduced (docs/specs/zigbee2mqtt-pairing.md, E)
const genericSwitch = {
  ieee_address: '0xa4c138000000f00d',
  friendly_name: '0xa4c138000000f00d',
  status: 'generic',
  model: 'TS0001',
  vendor: '_TZ3000_abcd',
  description: 'Automatically generated definition',
  updated_at: '2026-11-20T10:00:00.000Z',
  device: {
    name: '0xa4c138000000f00d',
    external_id: 'zigbee2mqtt:0xa4c138000000f00d',
    selector: 'zigbee2mqtt-0xa4c138000000f00d',
    model: 'TS0001',
    ieee_address: '0xa4c138000000f00d',
    should_poll: false,
    zigbee2mqtt_support: 'generic',
    zigbee2mqtt_info: {
      model_id: 'TS0001',
      manufacturer: '_TZ3000_abcd',
      power_source: 'Mains (single phase)',
      interview_state: 'SUCCESSFUL',
      definition: {
        model: 'TS0001',
        vendor: '_TZ3000_abcd',
        description: 'Automatically generated definition',
        exposes: []
      },
      endpoints: { 1: { clusters: { input: ['genBasic', 'genOnOff'], output: ['genOta'] } } }
    },
    features: [
      {
        name: 'state',
        category: 'switch',
        type: 'binary',
        external_id: 'zigbee2mqtt:0xa4c138000000f00d:switch:binary:state',
        selector: 'zigbee2mqtt-0xa4c138000000f00d-switch-binary-state',
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1
      }
    ],
    params: []
  }
};

// The same device at an earlier step
const atStep = (entry, status) => ({
  ...entry,
  status,
  model: null,
  vendor: null,
  description: null,
  device: null
});

/**
 * @description The requests of the pairing window when it opens: joining, the devices being paired, the houses, the
 * Zigbee2mqtt devices of Gladys (names taken), and the request that permits joining.
 * @param {object} [options] - Answers.
 * @example
 * answerPairing({ pairing: [readyBulb] });
 */
const answerPairing = ({
  permitJoin = closedJoining,
  pairing = [],
  pairingDelay = 0,
  devices = [],
  devicesDelay = 0,
  permitJoinResponse = { body: {} }
} = {}) => {
  const serverUrl = Cypress.env('serverUrl');
  cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/permit_join` }, { body: permitJoin }).as(
    'getPermitJoin'
  );
  cy.intercept(
    { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/pairing` },
    { body: pairing, delay: pairingDelay }
  ).as('getPairing');
  cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/house*` }, { body: houses }).as('houses');
  cy.intercept(
    { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/device*` },
    { body: devices, delay: devicesDelay }
  ).as('gladysDevices');
  cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/permit_join` }, permitJoinResponse).as(
    'permitJoin'
  );
};

const sendPermitJoin = payload => cy.sendWebSocket({ type: 'zigbee2mqtt.permit-join', payload });

const sendPairing = payload => cy.sendWebSocket({ type: 'zigbee2mqtt.pairing', payload });

export { closedJoining, houses, readyBulb, genericSwitch, atStep, answerPairing, sendPermitJoin, sendPairing };
