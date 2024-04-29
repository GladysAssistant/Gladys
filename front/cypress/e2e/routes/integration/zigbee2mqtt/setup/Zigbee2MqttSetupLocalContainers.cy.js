describe('Zigbee2Mqtt setup wizard local mode from scratch', () => {
  before(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/status`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/status_ready_to_setup.json'
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

    cy.get('[data-cy=z2m-setup-local-panel]')
      .should('exist')
      .within(() => {
        cy.get('button').should('not.be.disabled');
        cy.get('.requirement').should('be.length', 3);
      });

    cy.get('[data-cy=z2m-toggle-status]').should('exist');
    cy.get('[data-cy=z2m-running-status]').should('exist');
  });

  it('Select local mode', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/usb/port`
      },
      {
        fixture: 'integration/routes/integration/usb/get_available_usb_ports.json'
      }
    ).as('usbPorts');

    cy.get('[data-cy=z2m-setup-local-panel]').within(() => {
      cy.get('button').click();
    });
    cy.wait('@usbPorts');

    // Setup panel should be hidden
    cy.get('[data-cy=z2m-setup-local-panel]').should('not.exist');
    // Save panel should be hidden
    cy.get('[data-cy=z2m-setup-save]').should('exist');
    cy.get('[data-cy=z2m-setup-reset]').should('exist');

    // Save button is disabled
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // Start typing on USB port and abort
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .type('invalid value{esc}');
    // Save button is still disabled
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // Start typing on USB port and confirm
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click()
      .type('{downArrow}{enter}');

    // Save button is still enabled
    cy.get('[data-cy=z2m-setup-save]').should('not.be.disabled');

    // Select a dongle name
    cy.get('[data-cy=z2m-setup-local-dongle-field]')
      .children()
      .click()
      .type('{downArrow}{enter}');
  });

  it('Check confirm configuration', () => {
    cy.get('[data-cy=z2m-setup-save]')
      .should('exist')
      .should('not.be.disabled');
    cy.get('[data-cy=z2m-setup-reset]')
      .should('exist')
      .should('not.be.disabled');
  });

  it('Save configuration with error', () => {
    // Check no error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');

    // Re-fill form
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click()
      .type('{downArrow}{enter}');

    // Enter TCP port
    cy.get('[data-cy=z2m-setup-local-tcp-field]').type('12345');

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
        ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
        ZIGBEE_DONGLE_NAME: "CircuitSetup's CC2652P2 USB Coordinator",
        Z2M_TCP_PORT: '12345',
        Z2M_MQTT_MODE: 'local'
      });

    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('exist');
  });

  it('Save configuration with success', () => {
    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('exist');

    // Select a dongle name
    cy.get('[data-cy=z2m-setup-local-dongle-field]')
      .children()
      .click()
      .type('{downArrow}{enter}');

    // Enter TCP port
    cy.get('[data-cy=z2m-setup-local-tcp-field]').clear();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        statusCode: 200,
        body: {
          ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
          ZIGBEE_DONGLE_NAME: "CircuitSetup's CC2652P2 USB Coordinator",
          Z2M_TCP_PORT: '12000'
        }
      }
    ).as('setup');

    cy.get('[data-cy=z2m-setup-save]').click();

    cy.wait('@setup')
      .its('request.body')
      .should('deep.eq', {
        ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
        ZIGBEE_DONGLE_NAME: "CircuitSetup's CC2652P2 USB Coordinator",
        Z2M_TCP_PORT: null,
        Z2M_MQTT_MODE: 'local'
      });

    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');

    // Check summary
    cy.get('[data-cy=z2m-setup-local-usb-summary]').should('have.text', '/dev/ttyUSB0');
    cy.get('[data-cy=z2m-setup-local-dongle-summary]').should('have.text', "CircuitSetup's CC2652P2 USB Coordinator");
    cy.get('[data-cy=z2m-setup-local-tcp-summary]').should('have.text', '12000');

    cy.sendWebSocket({
      type: 'zigbee2mqtt.status-change',
      payload: {
        usbConfigured: true,
        mqttExist: true,
        mqttRunning: true,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
        gladysConnected: true,
        zigbee2mqttConnected: true,
        z2mEnabled: true,
        dockerBased: true,
        networkModeValid: true
      }
    });
  });

  it('Reset configuration', () => {
    cy.get('[data-cy=z2m-setup-save]').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-summary]')
      .should('exist')
      .within(() => {
        cy.get('button')
          .contains('integration.zigbee2mqtt.setup.changeButtonLabel')
          .click();
      });
    cy.get('[data-cy=z2m-setup-reset]').click();
  });
});
