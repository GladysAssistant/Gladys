import {
  machinePort,
  zbDongleE,
  zbDongleP,
  ZBDONGLE_P,
  runningInstallation,
  doneInstallation,
  sendProgress,
  sendStatus,
  answerSetup
} from './wizardFixtures';
import {
  onlineStatus,
  notAnsweringStatus,
  localSetup,
  externalSetup,
  conflict,
  visitDashboard,
  answerAction
} from './dashboardFixtures';

const T = 'integration.zigbee2mqtt.setup.dashboard';

// The settings of a configured installation (docs/specs/zigbee2mqtt-installation.md, N): the change of dongle, the
// advanced settings, an external broker. Apart from Zigbee2MqttDashboard.cy.js: the browser of the run stops
// connecting the websocket of the pages after about thirty tests in one file.
describe('Zigbee2mqtt dashboard settings', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('change of dongle', () => {
    it('should change the dongle through the first step of the wizard, then follow the switch', () => {
      visitDashboard({ ports: [[machinePort, zbDongleE, zbDongleP]] });
      cy.get('[data-cy=z2m-dashboard-change-key]').click();

      cy.get('[data-cy=z2m-wizard-key-several]').should('exist');
      cy.get('[data-cy=z2m-wizard-key-card]')
        .contains('SONOFF Zigbee 3.0 USB Dongle Plus-E')
        .parents('[data-cy=z2m-wizard-key-card]')
        .find('[data-cy=z2m-wizard-current-key]')
        .should('exist');
      cy.get('[data-cy=z2m-wizard-other-family]').should('not.exist');

      // A Texas Instruments dongle after a Silicon Labs one: a new network
      cy.get('[data-cy=z2m-wizard-key-card]')
        .contains('SONOFF Zigbee 3.0 USB Dongle Plus-P')
        .click();
      cy.get('[data-cy=z2m-wizard-other-family]').should('exist');

      answerSetup({
        body: { ...localSetup, ZIGBEE2MQTT_DRIVER_PATH: zbDongleP.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_P }
      });
      cy.get('[data-cy=z2m-wizard-install]')
        .should('not.be.disabled')
        .click();
      cy.wait('@setup')
        .its('request.body')
        .should('include', { ZIGBEE2MQTT_DRIVER_PATH: zbDongleP.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_P });

      // Back on the dashboard, which follows the switch
      cy.get('[data-cy=z2m-wizard]').should('not.exist');
      sendProgress({ ...runningInstallation, kind: 'switch' });
      cy.get('[data-cy=z2m-dashboard-title]').i18n('integration.zigbee2mqtt.setup.installation.titles.switch');
      cy.get('[data-cy=z2m-dashboard-key-name]').should('have.text', 'SONOFF Zigbee 3.0 USB Dongle Plus-P');
    });

    it('should go back to the dashboard without saving when the change is cancelled', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-change-key]').click();
      cy.get('[data-cy=z2m-wizard-key-one]').should('exist');

      cy.get('[data-cy=z2m-wizard-cancel]').click();
      cy.get('[data-cy=z2m-dashboard]').should('exist');
      cy.get('[data-cy=z2m-wizard]').should('not.exist');
    });

    it('should stay on the dongle and tell that it is not plugged in when the setup refuses it', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-change-key]').click();
      answerSetup({ statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' } });
      cy.get('[data-cy=z2m-wizard-install]')
        .should('not.be.disabled')
        .click();
      cy.wait('@setup');

      cy.get('[data-cy=z2m-wizard-save-error]').i18n('integration.zigbee2mqtt.setup.wizard.saveDongleNotFound');
      cy.get('[data-cy=z2m-dashboard]').should('not.exist');
    });
  });

  describe('advanced settings', () => {
    it('should save another port of the interface, and only it', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();

      cy.get('[data-cy=z2m-dashboard-port-input]').should('have.value', '12000');
      cy.get('[data-cy=z2m-dashboard-port-save]').should('be.disabled');
      cy.get('[data-cy=z2m-dashboard-component-gladys]').i18n(`${T}.advanced.components.connected`);
      cy.get('[data-cy=z2m-dashboard-component-broker]').i18n(`${T}.advanced.components.running`);
      cy.get('[data-cy=z2m-dashboard-component-zigbee2mqtt]').i18n(`${T}.advanced.components.answers`);
      cy.get('[data-cy=z2m-mqtt-external-credentials]').should('exist');

      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('70000');
      cy.get('[data-cy=z2m-dashboard-port-save]').should('be.disabled');
      answerSetup({ body: { ...localSetup, Z2M_TCP_PORT: '12001' } });
      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('12001');
      cy.get('[data-cy=z2m-dashboard-port-save]').click();
      // A partial setup: the other settings are kept by the server
      cy.wait('@setup')
        .its('request.body')
        .should('deep.equal', { Z2M_TCP_PORT: '12001' });

      cy.get('[data-cy=z2m-dashboard]').should('exist');
      cy.get('[data-cy=z2m-dashboard-interface]')
        .should('have.attr', 'href')
        .and('match', /:12001$/);
    });

    it('should tell why the port was not saved', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerSetup({ statusCode: 409 });
      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('12001');
      cy.get('[data-cy=z2m-dashboard-port-save]').click();
      cy.wait('@setup');
      cy.get('[data-cy=z2m-dashboard-save-conflict]').i18n('integration.zigbee2mqtt.setup.installation.alreadyRunning');

      answerSetup({ statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' } });
      cy.get('[data-cy=z2m-dashboard-port-save]').click();
      cy.wait('@setup');
      cy.get('[data-cy=z2m-dashboard-save-error]').i18n(`${T}.advanced.saveDongleNotFound`);
      cy.get('[data-cy=z2m-dashboard-save-conflict]').should('not.exist');
    });

    it('should show the port saved by the end of an installation', () => {
      visitDashboard({
        status: { ...onlineStatus, installation: runningInstallation },
        setup: { ...localSetup, Z2M_TCP_PORT: null }
      });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-port-input]').should('have.value', '');
      cy.get('[data-cy=z2m-dashboard-open-interface]').should('not.exist');

      const serverUrl = Cypress.env('serverUrl');
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: localSetup }).as(
        'configAfterInstallation'
      );
      sendProgress(doneInstallation);
      cy.wait('@configAfterInstallation');

      cy.get('[data-cy=z2m-dashboard-port-input]').should('have.value', '12000');
      cy.get('[data-cy=z2m-dashboard-open-interface]').should('exist');
    });

    it('should reset the integration once confirmed, back to the wizard', () => {
      visitDashboard();
      const serverUrl = Cypress.env('serverUrl');
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerAction('reset');
      cy.get('[data-cy=z2m-reset-button]').click();
      cy.get('[data-cy=z2m-reset-cancel-button]').click();
      cy.get('[data-cy=z2m-reset-button]').click();

      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: {} });
      cy.get('[data-cy=z2m-reset-confirm-button]').click();
      cy.wait('@reset');
      cy.get('[data-cy=z2m-wizard]').should('exist');
    });

    it('should tell that the integration is busy when the reset is refused', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerAction('reset', conflict('Zigbee2mqtt: cannot reset while an installation is running'));
      cy.get('[data-cy=z2m-reset-button]').click();
      cy.get('[data-cy=z2m-reset-confirm-button]').click();
      cy.wait('@reset');

      cy.get('[data-cy=z2m-reset-conflict]').i18n('integration.zigbee2mqtt.setup.installation.busy');
      cy.get('[data-cy=z2m-reset-error]').should('not.exist');
    });

    it('should go back to the dashboard', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-back]').click();
      cy.get('[data-cy=z2m-dashboard]').should('exist');
    });
  });

  describe('external broker', () => {
    it('should show Gladys connected to the broker of a Zigbee2mqtt that runs elsewhere', () => {
      visitDashboard({ status: { ...notAnsweringStatus, z2mVersion: null, deviceCount: null }, setup: externalSetup });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.onlineExternal.title`);
      cy.get('[data-cy=z2m-dashboard-key]').should('contain', 'mqtt://192.168.1.10:1883');
      cy.get('[data-cy=z2m-dashboard-change-key]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-tiles] [data-cy=z2m-dashboard-restart]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-stop]').should('exist');

      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-broker]').should('exist');
      cy.get('[data-cy=z2m-dashboard-port]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-component-broker]').should('not.exist');
    });

    it('should show why Gladys cannot connect to the broker, a known error explained', () => {
      const brokerError = { ...notAnsweringStatus, gladysConnected: false };
      visitDashboard({
        status: { ...brokerError, mqttConnectionError: { code: 'BAD_CREDENTIALS', message: null } },
        setup: externalSetup
      });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.mqttError.title`);
      cy.get('[data-cy=z2m-dashboard-mqtt-error]').i18n(
        'integration.zigbee2mqtt.setup.mqttConnectionErrors.BAD_CREDENTIALS'
      );
      // Nothing to restart on the side of Gladys
      cy.get('[data-cy=z2m-dashboard-status] [data-cy=z2m-dashboard-restart]').should('not.exist');

      sendStatus({ ...brokerError, mqttConnectionError: { code: null, message: 'client disconnecting' } });
      cy.get('[data-cy=z2m-dashboard-mqtt-error]')
        .i18n('integration.zigbee2mqtt.setup.mqttConnectionErrors.unknownErrorPrefix')
        .should('contain', 'client disconnecting');

      sendStatus({ ...notAnsweringStatus, mqttConnectionError: null });
      cy.get('[data-cy=z2m-dashboard-mqtt-error]').should('not.exist');
    });

    it('should save the broker from the advanced settings', () => {
      visitDashboard({ setup: externalSetup });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerSetup({ body: { ...externalSetup, Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883' } });

      cy.get('[data-cy=z2m-setup-remote-broker-url-field]').clear();
      cy.get('[data-cy=z2m-setup-remote-broker-url-field]').type('mqtt://192.168.1.11:1883');
      cy.get('[data-cy=z2m-setup-save]').click();
      cy.wait('@setup')
        .its('request.body')
        .should('include', { Z2M_MQTT_MODE: 'external', Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883' });
      cy.get('[data-cy=z2m-dashboard-key]').should('contain', 'mqtt://192.168.1.11:1883');
    });
  });
});
