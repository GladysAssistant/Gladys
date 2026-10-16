// The overall air quality as a named level (airquality-sensor / level, Matter's
// AirQualityEnum): the core translates the level, the integration only reports
// an integer. The device goes through the real API; only its states are stubbed,
// the example service having no way to report one.
describe('Dashboard Devices Box air quality level', () => {
  const serverUrl = Cypress.env('serverUrl');

  const LIVING_ROOM = 'air-monitor-living-room';
  const BEDROOM = 'air-monitor-bedroom';
  const levelFeature = (name, selector) => ({
    name,
    category: 'airquality-sensor',
    type: 'level',
    external_id: selector,
    selector,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 6
  });

  // the states the integration would report: MODERATE, and a value no level
  // matches (a newer standard revision, a buggy integration)
  const lastValues = { [LIVING_ROOM]: 3, [BEDROOM]: 9 };

  const setLanguage = language =>
    cy.request({
      method: 'PATCH',
      url: `${serverUrl}/api/v1/me`,
      body: { language }
    });

  beforeEach(() => {
    cy.login();

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [[{ type: 'devices', name: 'Air', device_features: [LIVING_ROOM, BEDROOM] }], [], []]
      }
    });

    cy.createDevice(
      {
        name: 'Air monitor',
        external_id: 'air-monitor',
        selector: 'air-monitor',
        features: [levelFeature('Living room', LIVING_ROOM), levelFeature('Bedroom', BEDROOM)]
      },
      'example'
    );

    // the device list only: a '**/api/v1/device?*' glob would also catch
    // /api/v1/device/:selector and /api/v1/device_feature/... (? is one character)
    cy.intercept({ method: 'GET', pathname: '/api/v1/device' }, req => {
      // the test visits the dashboard twice: without these headers the second
      // answer is a bodyless 304 and there would be no state to stub
      delete req.headers['if-none-match'];
      delete req.headers['if-modified-since'];
      req.continue(res => {
        if (!Array.isArray(res.body)) {
          return;
        }
        res.body.forEach(device => {
          (device.features || []).forEach(feature => {
            if (lastValues[feature.selector] !== undefined) {
              feature.last_value = lastValues[feature.selector];
              // a fresh state: without it the dashboard shows "No recent value"
              // instead of the level (the device API flags stale features)
              feature.last_value_changed = new Date().toISOString();
              feature.last_value_is_too_old = false;
            }
          });
        });
      });
    }).as('getDevices');
  });

  afterEach(() => {
    setLanguage(Cypress.env('language'));
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  const badge = name => cy.contains('tr', name).find('.badge');

  it('shows the level as a coloured word in the user language', () => {
    setLanguage('en');
    cy.visit('/dashboard/test');
    cy.wait('@getDevices');

    badge('Living room')
      .should('have.text', 'Moderate')
      .and('have.class', 'bg-orange');
    badge('Bedroom')
      .should('have.text', '9 (unknown)')
      .and('have.class', 'bg-secondary');

    setLanguage('fr');
    cy.visit('/dashboard/test');
    cy.wait('@getDevices');

    badge('Living room').should('have.text', 'Moyenne');
    badge('Bedroom').should('have.text', '9 (inconnu)');
  });
});
