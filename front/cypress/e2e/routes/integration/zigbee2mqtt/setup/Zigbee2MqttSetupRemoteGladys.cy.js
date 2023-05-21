describe('Zigbee2Mqtt setup wizard remote mode from scratch', () => {
  before(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/status`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/status_not_ready_to_setup.json'
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        body: {}
      }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  });

  it('Check list', () => {
    cy.get('[data-cy=z2m-setup-wizard]')
      .should('exist')
      .within(() => {
        cy.get('button').should('be.length', 2);
      });

    cy.get('[data-cy=z2m-setup-remote-panel]')
      .should('exist')
      .within(() => {
        cy.get('button').should('not.be.disabled');
        cy.get('.requirement').should('be.length', 2);
      });

    cy.get('[data-cy=z2m-toggle-status]').should('exist');
    cy.get('[data-cy=z2m-running-status]').should('exist');
  });

  it('Select remote mode', () => {
    cy.get('[data-cy=z2m-setup-remote-panel]').within(() => {
      cy.get('button').click();
    });

    cy.get('[data-cy=z2m-setup-remote-gladys-mqtt-mode]')
      .should('exist')
      .should('not.be.disabled');

    cy.get('[data-cy=z2m-setup-remote-external-mqtt-mode]')
      .should('exist')
      .should('be.disabled');
  });

  it('Select Gladys MQTT mode', () => {
    cy.get('[data-cy=z2m-setup-remote-gladys-mqtt-mode]').click();

    cy.get('[data-cy=z2m-setup-remote-gladys-mqtt-description]').should('exist');
  });

  it('Save configuration with error', () => {
    // Check no error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        statusCode: 400
      }
    ).as('setup');

    cy.get('[data-cy=z2m-setup-save]').click();

    cy.wait('@setup')
      .its('request.body')
      .should('deep.eq', {
        MQTT_MODE: 'gladys'
      });

    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('exist');
  });

  it('Save configuration with success', () => {
    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('exist');

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        statusCode: 200,
        body: {
          MQTT_MODE: 'gladys'
        }
      }
    ).as('setup');

    cy.get('[data-cy=z2m-setup-save]').click();

    cy.wait('@setup')
      .its('request.body')
      .should('deep.eq', {
        MQTT_MODE: 'gladys'
      });

    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');

    // Check summary
    cy.get('[data-cy=z2m-setup-remote-mqtt-mode-summary]').i18n(
      'integration.zigbee2mqtt.setup.modes.remote.gladys.modeLabel'
    );

    cy.sendWebSocket({
      type: 'zigbee2mqtt.status-change',
      payload: {
        usbConfigured: false,
        mqttExist: true,
        mqttRunning: true,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        gladysConnected: true,
        zigbee2mqttConnected: false,
        z2mEnabled: true,
        dockerBased: false,
        networkModeValid: false
      }
    });
  });
});
