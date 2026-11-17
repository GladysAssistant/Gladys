// The setup page of a Zigbee2mqtt that runs elsewhere, Gladys connected to its broker (the wizard connects it: see
// Zigbee2MqttWizard.cy.js)
describe('Zigbee2Mqtt setup page with an external broker', () => {
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
        body: { Z2M_MQTT_MODE: 'external', Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883' }
      }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  });

  it('Show the page of the installation, not the wizard', () => {
    cy.get('[data-cy=z2m-setup-remote-summary]').should('exist');
    cy.get('[data-cy=z2m-toggle-status]').should('exist');
    cy.get('[data-cy=z2m-running-status]').should('exist');
    cy.get('[data-cy=z2m-wizard]').should('not.exist');
  });

  it('Display the MQTT connection error of a known error code', () => {
    cy.get('[data-cy=z2m-mqtt-connection-error]').should('not.exist');

    cy.sendWebSocket({
      type: 'zigbee2mqtt.status-change',
      payload: {
        usbConfigured: false,
        mqttExist: true,
        mqttRunning: true,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        gladysConnected: false,
        zigbee2mqttConnected: false,
        z2mEnabled: true,
        dockerBased: false,
        networkModeValid: false,
        mqttConnectionError: { code: 'BAD_CREDENTIALS', message: null }
      }
    });

    cy.get('[data-cy=z2m-mqtt-connection-error]').i18n(
      'integration.zigbee2mqtt.setup.mqttConnectionErrors.BAD_CREDENTIALS'
    );
  });

  it('Display the raw message when the error code is unknown', () => {
    cy.sendWebSocket({
      type: 'zigbee2mqtt.status-change',
      payload: {
        usbConfigured: false,
        mqttExist: true,
        mqttRunning: true,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        gladysConnected: false,
        zigbee2mqttConnected: false,
        z2mEnabled: true,
        dockerBased: false,
        networkModeValid: false,
        mqttConnectionError: { code: null, message: 'client disconnecting' }
      }
    });

    cy.get('[data-cy=z2m-mqtt-connection-error]')
      .i18n('integration.zigbee2mqtt.setup.mqttConnectionErrors.unknownErrorPrefix')
      .should('contain', 'client disconnecting');
  });

  it('Hide the alert when there is no MQTT connection error', () => {
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
        networkModeValid: false,
        mqttConnectionError: { code: null, message: null }
      }
    });

    cy.get('[data-cy=z2m-mqtt-connection-error]').should('not.exist');
  });
});
