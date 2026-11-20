describe('Zigbee2mqtt status', () => {
  // Gladys is connected to the broker, the Zigbee2mqtt container is installed, but Zigbee2mqtt has not
  // answered: it is stopped, or crashing in a loop
  const notOnlineStatus = {
    usbConfigured: true,
    networkAdapterConfigured: false,
    mqttExist: true,
    mqttRunning: true,
    zigbee2mqttExist: true,
    zigbee2mqttRunning: false,
    gladysConnected: true,
    zigbee2mqttConnected: false,
    zigbee2mqttStarting: false,
    // The containers are deployed
    z2mEnabled: true,
    dockerBased: true,
    networkModeValid: true,
    coordinatorFirmware: null,
    z2mContainerError: null,
    mqttConnectionError: null
  };
  const onlineStatus = { ...notOnlineStatus, zigbee2mqttRunning: true, zigbee2mqttConnected: true };

  beforeEach(() => {
    // Each test visits its own page: the session stored in localStorage is cleared between tests
    cy.login();
    const serverUrl = Cypress.env('serverUrl');
    // Configured: the setup page shows the installation, not the wizard
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` },
      { body: { Z2M_MQTT_MODE: 'local', Z2M_ADAPTER_MODE: 'usb', ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0' } }
    );
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/discovered*` }, { body: [] });
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/permit_join` },
      { body: { allowed: false, remainingSeconds: null } }
    );
  });

  it('should tell that Zigbee2mqtt does not answer on the discover page, until it is online', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { body: notOnlineStatus });
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert]').i18n('integration.zigbee2mqtt.status.notRunning');
    cy.get('#permitJoin').should('be.disabled');

    cy.sendWebSocket({ type: 'zigbee2mqtt.status-change', payload: onlineStatus });

    cy.get('[data-cy=z2m-status-alert]').should('not.exist');
    cy.get('#permitJoin').should('not.be.disabled');
  });

  it('should tell that Zigbee2mqtt is stopped, not blame the broker, on the discover page', () => {
    const serverUrl = Cypress.env('serverUrl');
    // Stopped from the dashboard: Gladys disconnected from the broker, the containers kept
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      {
        body: {
          ...notOnlineStatus,
          stopped: true,
          gladysConnected: false,
          mqttConnectionError: { code: 'BROKER_UNREACHABLE', message: 'connect ECONNREFUSED' }
        }
      }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert]').i18n('integration.zigbee2mqtt.status.stopped');
    cy.get('[data-cy=z2m-status-alert-mqtt-error]').should('not.exist');
    cy.get('#permitJoin').should('be.disabled');
  });

  it('should tell that Zigbee2mqtt is not installed on the discover page, with the way to install it', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      {
        body: {
          ...notOnlineStatus,
          configured: false,
          usbConfigured: false,
          mqttExist: false,
          zigbee2mqttExist: false,
          gladysConnected: false,
          z2mEnabled: false
        }
      }
    );
    // Nothing set up: no interface URL to warn about
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: {} }).as(
      'emptySetup'
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-not-installed]').should(
      'contain',
      Cypress._.get(Cypress.env('i18n'), 'integration.zigbee2mqtt.status.notInstalled')
    );
    cy.get('[data-cy=z2m-status-alert]').should('not.exist');
    cy.get('[data-cy=z2m-status-not-installed] a').should(
      'have.attr',
      'href',
      '/dashboard/integration/device/zigbee2mqtt/setup'
    );
    // Its banner only, and nothing to permit joining to
    cy.wait('@emptySetup');
    cy.get('[data-cy=z2m-url-warning]').should('not.exist');
    cy.get('#permitJoin').should('be.disabled');
  });

  it('should show why Zigbee2mqtt does not start on the discover page', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, z2mContainerError: { code: null, message: 'error: Error: Resource busy' } } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert-error]').should('contain', 'error: Error: Resource busy');
  });

  it('should explain a known startup error with the action to take', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, z2mContainerError: { code: 'ADAPTER_NO_RESPONSE', message: null } } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert-error]').i18n(
      'integration.zigbee2mqtt.setup.modes.local.containerErrors.ADAPTER_NO_RESPONSE'
    );
    cy.get('[data-cy=z2m-container-error-details]').should('not.exist');
  });

  it('should list the settings refused by Zigbee2mqtt', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      {
        body: {
          ...notOnlineStatus,
          z2mContainerError: {
            code: 'INVALID_CONFIGURATION',
            message: 'serial/adapter must be equal to one of the allowed values'
          }
        }
      }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert-error]').should('contain', 'configuration.yaml');
    cy.get('[data-cy=z2m-container-error-details]').should(
      'have.text',
      'serial/adapter must be equal to one of the allowed values'
    );
  });

  it('should tell that Zigbee2mqtt does not answer with an external broker, without container', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, mqttExist: false, zigbee2mqttExist: false } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert]').i18n('integration.zigbee2mqtt.status.notRunning');
  });

  it('should blame the broker, not Zigbee2mqtt, when Gladys is not connected to it', () => {
    const serverUrl = Cypress.env('serverUrl');
    // The Gladys-managed broker is stopped or restarting: a network error is not reported as an MQTT error
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, gladysConnected: false } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert]').i18n('integration.zigbee2mqtt.status.mqttNotConnected');
    cy.get('[data-cy=z2m-status-alert-mqtt-error]').should('not.exist');
  });

  it('should show why Gladys cannot connect to an external broker', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      {
        body: {
          ...notOnlineStatus,
          gladysConnected: false,
          mqttExist: false,
          zigbee2mqttExist: false,
          mqttConnectionError: { code: 'BAD_CREDENTIALS', message: null }
        }
      }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    // Not "Zigbee2mqtt is not activated": the user configured an external broker that refuses Gladys
    cy.get('[data-cy=z2m-status-alert]').i18n('integration.zigbee2mqtt.status.mqttNotConnected');
    cy.get('[data-cy=z2m-status-alert-mqtt-error]').i18n(
      'integration.zigbee2mqtt.setup.mqttConnectionErrors.BAD_CREDENTIALS'
    );
  });
});
