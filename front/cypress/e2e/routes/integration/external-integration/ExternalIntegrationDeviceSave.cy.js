// Saving a device from the Devices screen must not depend on the size of its states. A camera
// carries its last image (camera/image, up to 150 kB of base64) in last_value_string: posted back
// with the device, it pushed the save past the 100 kB JSON bound of the API, and moving a camera to
// another room failed with a 413. The integration is stubbed (it would need an installed Docker
// container), the request the page sends is what is checked.
const SELECTOR = 'ext-dev-cameras';
const DEVICE_PAGE_URL = `/dashboard/integration/device/external/${SELECTOR}`;
const API_JSON_BODY_LIMIT = 100 * 1024;
// the camera image bound of camera.setImage, base64-encoded
const CAMERA_IMAGE = `image/png;base64,${'A'.repeat(150 * 1024)}`;

const INTEGRATION = {
  id: '0b6f2c1e-7d3a-4c5b-9e8f-2a1b3c4d5e01',
  name: 'Cameras',
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  running: true,
  version: '1.0.0',
  granted_devices: [],
  manifest: {
    name: 'Cameras',
    type: 'device',
    version: '1.0.0'
  }
};

const HOUSES = [
  {
    id: '3c5b0a1e-1f2d-4e3c-8b9a-0d1e2f3a4b01',
    name: 'Home',
    selector: 'home',
    rooms: [
      { id: '6a7b8c9d-0e1f-4a2b-9c3d-4e5f6a7b8c01', name: 'Garden', selector: 'garden' },
      { id: '6a7b8c9d-0e1f-4a2b-9c3d-4e5f6a7b8c02', name: 'Entrance', selector: 'entrance' }
    ]
  }
];

const CAMERA = {
  id: '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b01',
  name: 'Outdoor camera',
  selector: 'outdoor-camera',
  external_id: `ext:${SELECTOR}:outdoor-camera`,
  service_id: INTEGRATION.id,
  room_id: HOUSES[0].rooms[0].id,
  created_at: '2026-10-01T08:00:00.000Z',
  params: [],
  features: [
    {
      id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c01',
      name: 'Outdoor camera image',
      selector: 'outdoor-camera-image',
      external_id: `ext:${SELECTOR}:outdoor-camera:image`,
      category: 'camera',
      type: 'image',
      read_only: true,
      keep_history: false,
      has_feedback: false,
      min: 0,
      max: 0,
      last_value: null,
      last_value_string: CAMERA_IMAGE,
      last_value_changed: new Date().toISOString(),
      created_at: '2026-10-01T08:00:00.000Z'
    },
    {
      id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c02',
      name: 'Outdoor camera motion',
      selector: 'outdoor-camera-motion',
      external_id: `ext:${SELECTOR}:outdoor-camera:motion`,
      category: 'motion-sensor',
      type: 'binary',
      read_only: true,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 1,
      last_value: 1,
      last_value_string: null,
      last_value_changed: new Date().toISOString(),
      created_at: '2026-10-01T08:00:00.000Z'
    }
  ]
};

const STATE_COLUMNS = [
  'last_value',
  'last_value_string',
  'last_value_changed',
  'last_hourly_aggregate',
  'last_daily_aggregate',
  'last_monthly_aggregate'
];

describe('External integration - device save', () => {
  beforeEach(() => {
    cy.login();

    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, INTEGRATION).as('getIntegration');
    cy.intercept('GET', `**/api/v1/service/${SELECTOR}/device`, [CAMERA]).as('getDevices');
    cy.intercept('GET', '**/api/v1/house*', HOUSES).as('getHouses');
    cy.intercept('POST', '**/api/v1/device', req => {
      // the server answers with the device as stored, states included
      req.reply({ ...CAMERA, room_id: req.body.room_id });
    }).as('saveDevice');
  });

  it('moves a camera to another room without posting its image', () => {
    cy.visit(DEVICE_PAGE_URL);
    cy.wait(['@getIntegration', '@getDevices', '@getHouses']);

    cy.get('#room_0').select('Entrance');
    cy.contains('button', 'integration.externalIntegration.device.saveButton').click();

    cy.wait('@saveDevice').then(({ request }) => {
      const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      expect(body.room_id).to.equal(HOUSES[0].rooms[1].id);
      expect(JSON.stringify(body).length).to.be.lessThan(API_JSON_BODY_LIMIT);
      // every feature is still sent, with its identity and settings, so the save keeps them
      expect(body.features.map(feature => feature.id)).to.deep.equal(CAMERA.features.map(feature => feature.id));
      body.features.forEach((feature, index) => {
        const { external_id: externalId, category, type, keep_history: keepHistory } = CAMERA.features[index];
        expect(feature).to.include({ external_id: externalId, category, type, keep_history: keepHistory });
        STATE_COLUMNS.forEach(column => {
          expect(feature).to.not.have.property(column);
        });
      });
    });

    cy.get('.alert-danger').should('not.exist');
    cy.get('#room_0')
      .find('option:selected')
      .should('have.text', 'Entrance');
  });
});
