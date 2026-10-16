// The photo of a device (reserved GLADYS_DEVICE_IMAGE param) is served by the
// image route of the integration, like the widget images. The integration and
// its image route are stubbed (they would need an installed Docker container),
// everything else is the real app.
const SELECTOR = 'ext-dev-netatmo';
const DEVICES_URL = `/dashboard/integration/device/external/${SELECTOR}`;
const IMAGE_KEY = 'model-nacamera';

// a 1×1 transparent PNG, the shape the image route answers with
const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const INTEGRATION = {
  id: '8d2e4f6a-1b3c-4d5e-9f7a-2c4e6a8b0d03',
  name: 'Netatmo',
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  running: true,
  version: '1.0.0',
  granted_devices: [],
  manifest: {
    name: 'Netatmo',
    type: 'device',
    version: '1.0.0'
  }
};

const device = (name, deviceSelector, params) => ({
  id: `${deviceSelector}-id`,
  name,
  selector: deviceSelector,
  external_id: `${SELECTOR}:${deviceSelector}`,
  service_id: INTEGRATION.id,
  room_id: null,
  features: [],
  params
});

const DEVICES = [
  device('Indoor camera', 'indoor-camera', [{ name: 'GLADYS_DEVICE_IMAGE', value: IMAGE_KEY }]),
  device('Unknown module', 'unknown-module', [])
];

// closest: the whole page sits in a card too, which holds every device
const deviceCard = name => cy.contains('.card-header', name).closest('.card');

describe('External integration - device image', () => {
  beforeEach(() => {
    cy.login();

    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, INTEGRATION).as('getIntegration');
    cy.intercept('GET', `**/api/v1/service/${SELECTOR}/device*`, DEVICES).as('getDevices');
    // any key: the device without a photo must not hit the route at all
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}/image/*`, { image: IMAGE }).as('getImage');
  });

  it('shows the photo of the device that declares one, and nothing for the other', () => {
    cy.visit(DEVICES_URL);
    cy.wait('@getIntegration');
    cy.wait('@getDevices');
    cy.wait('@getImage')
      .its('request.url')
      .should('include', `/image/${IMAGE_KEY}`);

    deviceCard('Indoor camera')
      .find('img')
      .should('have.attr', 'src', IMAGE)
      .and('have.attr', 'loading', 'lazy')
      .and('have.attr', 'alt', 'Indoor camera');
    deviceCard('Unknown module')
      .find('img')
      .should('not.exist');
    // only the device that declares a photo hits the image route
    cy.get('@getImage.all').should('have.length', 1);
    // the reserved param is not listed among the technical params
    cy.contains('GLADYS_DEVICE_IMAGE').should('not.exist');
  });
});
