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
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: {} });
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/discovered*` }, { body: [] });
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/permit_join` }, { body: false });
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

  it('should show why Zigbee2mqtt does not start on the discover page', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, z2mContainerError: { code: null, message: 'error: Error: Resource busy' } } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/discover');

    cy.get('[data-cy=z2m-status-alert-error]').should('contain', 'error: Error: Resource busy');
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

  it('should show Zigbee2mqtt as starting on the setup page, until it is online', () => {
    const serverUrl = Cypress.env('serverUrl');
    // Gladys has just (re)started the Zigbee2mqtt container
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, zigbee2mqttStarting: true } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

    cy.get('[data-cy=z2m-running-status-explanation]').i18n('integration.zigbee2mqtt.setup.zigbee2mqttStarting');
    // The enable switch follows the deployment, not Zigbee2mqtt answering
    cy.get('#enableZigbee2mqtt').should('be.checked');

    cy.sendWebSocket({ type: 'zigbee2mqtt.status-change', payload: onlineStatus });

    cy.get('[data-cy=z2m-running-status-explanation]').should('not.exist');
    cy.get('#enableZigbee2mqtt').should('be.checked');
  });

  it('should turn off a Zigbee2mqtt that does not answer', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { body: notOnlineStatus });
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/disconnect` }, { body: {} }).as(
      'disconnect'
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

    // Crashing in a loop: the user can still stop and remove its containers
    cy.get('#enableZigbee2mqtt').should('be.checked');
    cy.get('[data-cy=z2m-toggle-status] .custom-switch-indicator').click();

    cy.wait('@disconnect');
  });

  it('should show Zigbee2mqtt as starting before Gladys is connected to the broker again', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, gladysConnected: false, zigbee2mqttStarting: true } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

    cy.get('[data-cy=z2m-running-status-explanation]').i18n('integration.zigbee2mqtt.setup.zigbee2mqttStarting');
  });

  it('should not show a stopped Zigbee2mqtt as starting on the setup page', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { body: notOnlineStatus });
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

    cy.get('[data-cy=z2m-running-status-explanation]').i18n('integration.zigbee2mqtt.setup.zigbee2mqttNotResponding');
  });

  it('should tell that Zigbee2mqtt fails to start on the setup page', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: { ...notOnlineStatus, z2mContainerError: { code: 'EZSP_PROTOCOL_VERSION', message: null } } }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

    cy.get('[data-cy=z2m-running-status-explanation]').i18n('integration.zigbee2mqtt.setup.zigbee2mqttNotStarting');
  });
});
