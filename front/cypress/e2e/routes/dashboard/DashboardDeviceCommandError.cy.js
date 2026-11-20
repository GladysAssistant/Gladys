// A device command which fails (components/device/DeviceCommandError.jsx,
// docs/specs/dashboard-flexible-layout-and-widgets.md): the widget goes back to
// the state Gladys really holds, and the page which sent the command says why.
describe('Dashboard: a device command which fails', () => {
  const serverUrl = Cypress.env('serverUrl');
  const { device: i18n } = Cypress.env('i18n');
  const plug = index => `command-error-plug-${index}`;
  const toast = '[data-cy="device-command-error"]';
  const switchOf = index => cy.get('.custom-switch-input').eq(index);

  // What the server sends to every screen of the user when it could not drive the device
  const failure = (index, overrides) => ({
    type: 'device.set-value-error',
    payload: {
      client_id: null,
      cause: 'unreachable',
      device_feature_selector: plug(index),
      device_feature_name: 'On/Off',
      device_selector: plug(index),
      device_name: `Plug ${index}`,
      value: 1,
      last_value: 0,
      last_value_string: null,
      last_value_changed: new Date().toISOString(),
      ...overrides
    }
  });

  beforeEach(() => {
    cy.login();
    const { rooms } = Cypress.env('house');
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/room/${rooms[0].selector}` }).then(res => {
      [1, 2].forEach(index => {
        cy.createDevice(
          {
            name: `Plug ${index}`,
            external_id: plug(index),
            selector: plug(index),
            room_id: res.body.id,
            features: [
              {
                name: 'On/Off',
                category: 'switch',
                type: 'binary',
                external_id: plug(index),
                selector: plug(index),
                read_only: false,
                keep_history: true,
                has_feedback: true,
                min: 0,
                max: 1,
                last_value: 0
              }
            ]
          },
          'example'
        );
      });
    });
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [[{ type: 'devices', name: 'Plugs', device_features: [plug(1), plug(2)] }]]
      }
    });
  });

  afterEach(() => {
    cy.deleteDevices('example');
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/dashboard/test` });
  });

  const openDashboard = () => {
    cy.visit('/dashboard/test');
    cy.waitForWebSocket();
    cy.get('.custom-switch-input').should('have.length', 2);
    switchOf(0).should('not.be.checked');
  };

  it('Should say that Gladys could not be reached, and put the switch back, when the request cannot be sent', () => {
    cy.intercept('POST', '**/api/v1/device_feature/*/value', { forceNetworkError: true }).as('command');
    openDashboard();
    cy.get('.custom-switch-indicator')
      .eq(0)
      .click();
    cy.wait('@command');
    cy.get(toast)
      .should('have.attr', 'role', 'alert')
      .and('contain', i18n.setValueError.gladysUnreachable);
    switchOf(0).should('not.be.checked');
    // a tap dismisses it
    cy.get(toast).click();
    cy.get(toast).should('not.exist');
  });

  it('Should name the device and put the switch back when Gladys could not drive it', () => {
    cy.intercept('POST', '**/api/v1/device_feature/*/value', { statusCode: 200, body: {} }).as('command');
    openDashboard();
    cy.get('.custom-switch-indicator')
      .eq(0)
      .click();
    switchOf(0).should('be.checked');
    cy.wait('@command').then(({ request }) => {
      // the command carries the id of this page, which comes back with the failure
      expect(request.body.value).to.equal(1);
      expect(request.body.client_id).to.be.a('string');
      cy.sendWebSocket(failure(1, { client_id: request.body.client_id }));
    });
    cy.get(toast).should('contain', i18n.setValueError.unreachable.replace('{{name}}', 'Plug 1'));
    switchOf(0).should('not.be.checked');
  });

  it('Should say why the command failed', () => {
    cy.intercept('POST', '**/api/v1/device_feature/*/value', { statusCode: 200, body: {} }).as('command');
    openDashboard();
    cy.get('.custom-switch-indicator')
      .eq(0)
      .click();
    cy.wait('@command').then(({ request }) => {
      cy.sendWebSocket(failure(1, { client_id: request.body.client_id, cause: 'not-configured' }));
    });
    cy.get(toast).should('contain', i18n.setValueError.notConfigured.replace('{{name}}', 'Plug 1'));
  });

  it('Should count the devices when several commands fail together', () => {
    cy.intercept('POST', '**/api/v1/device_feature/*/value', { statusCode: 200, body: {} }).as('command');
    openDashboard();
    [0, 1].forEach(index => {
      cy.get('.custom-switch-indicator')
        .eq(index)
        .click();
      cy.wait('@command').then(({ request }) => {
        cy.sendWebSocket(failure(index + 1, { client_id: request.body.client_id }));
      });
    });
    cy.get(toast).should('contain', i18n.setValueError.several.replace('{{count}}', '2'));
    switchOf(0).should('not.be.checked');
    switchOf(1).should('not.be.checked');
  });

  it('Should go back to the real state without a word when the command was sent from another screen', () => {
    openDashboard();
    // another screen of the same user (or a script) asked for "on", and the device was in
    // fact already on: this screen only takes the state
    cy.sendWebSocket(failure(1, { client_id: 'another-screen', last_value: 1 }));
    switchOf(0).should('be.checked');
    cy.get(toast).should('not.exist');
  });
});
