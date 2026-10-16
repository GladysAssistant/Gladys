// Who decides whether a light is lit (light / operating-mode): forced off, forced on, or the light
// itself on detection. The device goes through the real API; only its state is stubbed, the example
// service having no way to report one, and so is the command, which it could not execute.
describe('Dashboard Devices Box light operating mode', () => {
  const serverUrl = Cypress.env('serverUrl');

  const FLOODLIGHT = 'floodlight-operating-mode';
  // AUTO, the mode an outdoor floodlight spends most of its time in
  const lastValues = { [FLOODLIGHT]: 2 };

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
        boxes: [[{ type: 'devices', name: 'Garden', device_features: [FLOODLIGHT] }], [], []]
      }
    });

    cy.createDevice(
      {
        name: 'Floodlight',
        external_id: 'floodlight',
        selector: 'floodlight',
        features: [
          {
            name: 'Floodlight',
            category: 'light',
            type: 'operating-mode',
            external_id: FLOODLIGHT,
            selector: FLOODLIGHT,
            read_only: false,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 3,
            // this light has no timetable of its own: SCHEDULE is not offered
            supported_options: [
              { value: 0, label: 'Off', sort_order: 0 },
              { value: 1, label: 'On', sort_order: 1 },
              { value: 2, label: 'Auto', sort_order: 2 }
            ]
          }
        ]
      },
      'example'
    );

    cy.intercept({ method: 'GET', pathname: '/api/v1/device' }, req => {
      // without these headers a second visit gets a bodyless 304 and there is no state to stub
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
              feature.last_value_changed = new Date().toISOString();
              feature.last_value_is_too_old = false;
            }
          });
        });
      });
    }).as('getDevices');

    cy.intercept({ method: 'POST', pathname: `/api/v1/device_feature/${FLOODLIGHT}/value` }, { body: {} }).as(
      'setValue'
    );
  });

  afterEach(() => {
    setLanguage(Cypress.env('language'));
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  const modeButtons = () => cy.contains('tr', 'Floodlight').find('.btn-group[role="group"] button');

  it('offers the modes the light supports and sends the one picked', () => {
    setLanguage('en');
    cy.visit('/dashboard/test');
    cy.wait('@getDevices');

    modeButtons().should($buttons => {
      expect($buttons.toArray().map(button => button.innerText.trim())).to.deep.equal(['Off', 'On', 'Auto']);
    });
    modeButtons()
      .filter('.active')
      .should('have.text', 'Auto');

    modeButtons()
      .contains('On')
      .click();
    cy.wait('@setValue')
      .its('request.body')
      .should('deep.equal', { value: 1 });
    modeButtons()
      .filter('.active')
      .should('have.text', 'On');

    setLanguage('fr');
    cy.visit('/dashboard/test');
    cy.wait('@getDevices');

    modeButtons().should($buttons => {
      expect($buttons.toArray().map(button => button.innerText.trim())).to.deep.equal(['Éteint', 'Allumé', 'Auto']);
    });
  });
});
