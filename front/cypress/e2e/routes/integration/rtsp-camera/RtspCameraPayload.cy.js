// The RTSP camera screen posts the camera twice: to test the connection and to save it. Neither body
// may carry the camera's images: the stored one (last_value_string of camera/image, up to 150 kB of
// base64) nor the one of the last "Test connection" (cameraImage, displayed only). Both routes sit
// under the 100 kB JSON bound of the API, and either image alone answered a 413. The routes are
// stubbed: the request the page sends is what is checked.
const API_JSON_BODY_LIMIT = 100 * 1024;
const STORED_IMAGE = `image/png;base64,${'A'.repeat(150 * 1024)}`;
const TEST_IMAGE = `image/jpg;base64,${'B'.repeat(120 * 1024)}`;
const STATE_COLUMNS = [
  'last_value',
  'last_value_string',
  'last_value_changed',
  'last_hourly_aggregate',
  'last_daily_aggregate',
  'last_monthly_aggregate'
];

const CAMERA = {
  id: '4f3e2d1c-0b9a-4876-9543-210fedcba901',
  name: 'Garage camera',
  selector: 'garage-camera',
  external_id: '4f3e2d1c-0b9a-4876-9543-210fedcba901',
  service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
  room_id: null,
  should_poll: true,
  poll_frequency: 60000,
  created_at: '2026-10-01T08:00:00.000Z',
  params: [
    { name: 'CAMERA_URL', value: 'rtsp://192.168.1.20/stream' },
    { name: 'CAMERA_ROTATION', value: '0' }
  ],
  features: [
    {
      id: '5a4b3c2d-1e0f-4a9b-8c7d-6e5f4a3b2c01',
      name: 'Garage camera',
      selector: 'garage-camera-image',
      external_id: '4f3e2d1c-0b9a-4876-9543-210fedcba901',
      category: 'camera',
      type: 'image',
      read_only: false,
      keep_history: false,
      has_feedback: false,
      min: 0,
      max: 0,
      last_value: null,
      last_value_string: STORED_IMAGE,
      last_value_changed: new Date().toISOString(),
      created_at: '2026-10-01T08:00:00.000Z'
    },
    {
      id: '5a4b3c2d-1e0f-4a9b-8c7d-6e5f4a3b2c02',
      name: 'Garage camera',
      selector: 'garage-camera-enabled',
      external_id: '4f3e2d1c-0b9a-4876-9543-210fedcba901:enabled',
      category: 'camera',
      type: 'enabled',
      read_only: false,
      keep_history: false,
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

const parseBody = request => (typeof request.body === 'string' ? JSON.parse(request.body) : request.body);

const expectNoImage = body => {
  expect(JSON.stringify(body).length).to.be.lessThan(API_JSON_BODY_LIMIT);
  expect(body).to.not.have.property('cameraImage');
  expect(body.params).to.deep.include({ name: 'CAMERA_URL', value: 'rtsp://192.168.1.20/stream' });
  expect(body.features.map(feature => feature.id)).to.deep.equal(CAMERA.features.map(feature => feature.id));
  body.features.forEach(feature => {
    STATE_COLUMNS.forEach(column => {
      expect(feature).to.not.have.property(column);
    });
  });
};

describe('RTSP camera - posted camera', () => {
  beforeEach(() => {
    cy.login();

    cy.intercept({ method: 'GET', pathname: '/api/v1/service/rtsp-camera' }, { id: CAMERA.service_id }).as(
      'getIntegration'
    );
    cy.intercept('POST', '**/api/v1/service/rtsp-camera/camera/test', { body: TEST_IMAGE }).as('testConnection');
    cy.intercept('POST', '**/api/v1/device', req => {
      // the server answers with the camera as stored, states included
      req.reply(CAMERA);
    }).as('saveCamera');
  });

  it('tests and saves a camera without posting its images', () => {
    cy.intercept('GET', '**/api/v1/service/rtsp-camera/device*', [CAMERA]).as('getCameras');
    cy.visit('/dashboard/integration/device/rtsp-camera');
    cy.wait('@getCameras');

    cy.contains('button', 'integration.rtspCamera.testConnectionButton').click();
    cy.wait('@testConnection').then(({ request }) => expectNoImage(parseBody(request)));
    cy.get('.card img.card-img-top').should('have.attr', 'src', `data:${TEST_IMAGE}`);

    // the second test and the save happen with the image of the first test on screen
    cy.contains('button', 'integration.rtspCamera.testConnectionButton').click();
    cy.wait('@testConnection').then(({ request }) => expectNoImage(parseBody(request)));

    cy.contains('button', 'integration.rtspCamera.saveButton').click();
    cy.wait('@saveCamera').then(({ request }) => expectNoImage(parseBody(request)));
    cy.get('.alert-danger').should('not.exist');
  });

  it('keeps the first value of the features of a new camera', () => {
    cy.intercept('GET', '**/api/v1/service/rtsp-camera/device*', []).as('getCameras');
    cy.visit('/dashboard/integration/device/rtsp-camera');
    cy.wait('@getCameras');

    cy.contains('button', 'scene.newButton').click();
    cy.contains('button', 'integration.rtspCamera.saveButton')
      .closest('.card')
      .within(() => {
        cy.get('input[type="text"]')
          .eq(0)
          .type('Porch camera');
        cy.get('input[type="text"]')
          .eq(1)
          .type('rtsp://192.168.1.21/stream');
      });
    cy.contains('button', 'integration.rtspCamera.saveButton').click();

    cy.wait('@saveCamera').then(({ request }) => {
      const body = parseBody(request);
      // a new feature has no created_at, even with an id: the server stores the first value it declares,
      // and the private-mode gate (camera-enable-disable.md) relies on camera/enabled starting at 1
      const enabledFeature = body.features.find(feature => feature.type === 'enabled');
      expect(enabledFeature).to.include({ category: 'camera', last_value: 1 });
      expect(body.params).to.deep.include({ name: 'CAMERA_URL', value: 'rtsp://192.168.1.21/stream' });
    });
  });
});
