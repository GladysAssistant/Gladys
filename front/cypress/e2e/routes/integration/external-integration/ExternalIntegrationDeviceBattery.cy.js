// The battery an external integration publishes is shown in the header of each
// device card, like the native integration device pages do. The integration is
// stubbed (it would need an installed Docker container), everything else is
// the real app.
const SELECTOR = 'ext-dev-weather';
const DEVICES_URL = `/dashboard/integration/device/external/${SELECTOR}`;

const INTEGRATION = {
  id: '2f7d9a4c-5b1e-4c3a-8d6f-0e9b8a7c6d02',
  name: 'Weather station',
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  running: true,
  version: '1.0.0',
  granted_devices: [],
  manifest: {
    name: 'Weather station',
    type: 'device',
    version: '1.0.0'
  }
};

const batteryFeature = (deviceSelector, lastValue) => ({
  name: 'Battery',
  selector: `${deviceSelector}-battery`,
  external_id: `${deviceSelector}:battery`,
  category: 'battery',
  type: 'integer',
  unit: 'percent',
  read_only: true,
  keep_history: true,
  has_feedback: false,
  min: 0,
  max: 100,
  last_value: lastValue
});

const temperatureFeature = deviceSelector => ({
  name: 'Temperature',
  selector: `${deviceSelector}-temperature`,
  external_id: `${deviceSelector}:temperature`,
  category: 'temperature-sensor',
  type: 'decimal',
  unit: 'celsius',
  read_only: true,
  keep_history: true,
  has_feedback: false,
  min: -50,
  max: 60,
  last_value: 21.5
});

const device = (name, deviceSelector, features) => ({
  id: `${deviceSelector}-id`,
  name,
  selector: deviceSelector,
  external_id: `${SELECTOR}:${deviceSelector}`,
  service_id: INTEGRATION.id,
  room_id: null,
  features,
  params: []
});

const DEVICES = [
  device('Outdoor module', 'outdoor-module', [
    batteryFeature('outdoor-module', 76),
    temperatureFeature('outdoor-module')
  ]),
  device('Rain gauge', 'rain-gauge', [batteryFeature('rain-gauge', 8)]),
  device('Wind gauge', 'wind-gauge', [batteryFeature('wind-gauge', null)]),
  device('Indoor module', 'indoor-module', [temperatureFeature('indoor-module')])
];

const cardHeader = name => cy.contains('.card-header', name);

describe('External integration - device battery level', () => {
  beforeEach(() => {
    cy.login();

    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, INTEGRATION).as('getIntegration');
    cy.intercept('GET', `**/api/v1/service/${SELECTOR}/device*`, DEVICES).as('getDevices');
  });

  it('shows the battery badge of the devices that report one', () => {
    cy.visit(DEVICES_URL);
    cy.wait('@getIntegration');
    cy.wait('@getDevices');

    cardHeader('Outdoor module').within(() => {
      cy.get('.tag.tag-green')
        .should('contain', '76')
        .find('.fe-battery')
        .should('exist');
    });
    cardHeader('Rain gauge').within(() => {
      cy.get('.tag.tag-danger')
        .should('contain', '8')
        .find('.fe-battery')
        .should('exist');
    });
    // no value received yet, and no battery at all: no badge
    cardHeader('Wind gauge')
      .find('.fe-battery')
      .should('not.exist');
    cardHeader('Indoor module')
      .find('.fe-battery')
      .should('not.exist');
  });
});
