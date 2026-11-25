import {
  machinePort,
  zbDongleE,
  zbDongleP,
  ZBDONGLE_P,
  runningInstallation,
  failedInstallation,
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
  i18nText,
  visitDashboard,
  answerAction
} from './dashboardFixtures';

const T = 'integration.zigbee2mqtt.setup.dashboard';

// The settings of a configured installation (docs/specs/zigbee2mqtt-installation.md, N): the change of dongle, the
// advanced settings, an external broker.
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
        .should('include', { ZIGBEE2MQTT_DRIVER_PATH: zbDongleP.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_P })
        // The port of the interface is kept: not sent, its stored value stays
        .and('not.have.property', 'Z2M_TCP_PORT');

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

    it('should not tell the refusal of a save made before the change of dongle opened', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerSetup(conflict('Zigbee2mqtt: cannot connect while the integration is busy'));
      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('12001');
      cy.get('[data-cy=z2m-dashboard-port-save]').click();
      cy.wait('@setup');
      cy.get('[data-cy=z2m-dashboard-save-conflict]').should('exist');

      // The port refused is still not saved: left without it
      cy.get('[data-cy=z2m-dashboard-back]').click();
      cy.get('[data-cy=z2m-dashboard-leave-discard]').click();
      cy.get('[data-cy=z2m-dashboard-change-key]').click();
      cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
      cy.get('[data-cy=z2m-wizard-save-conflict]').should('not.exist');
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

    it('should open the interface with its password, and show the password for another browser', () => {
      visitDashboard({ setup: { ...localSetup, Z2M_FRONTEND_AUTH_TOKEN: 'interface-password' } });
      cy.get('[data-cy=z2m-dashboard-interface]')
        .should('have.attr', 'href')
        .and('match', /:12000\/\?token=interface-password$/);
      // The first time in a browser, the interface still asks for it: said next to the link
      cy.get('[data-cy=z2m-dashboard-interface-hint]').should('contain', i18nText(`${T}.actions.interfaceHint`));

      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-open-interface]')
        .should('have.attr', 'href')
        .and('match', /:12000\/\?token=interface-password$/);
      cy.get('[data-cy=z2m-dashboard-interface-password]').should(
        'contain',
        i18nText(`${T}.advanced.interface.passwordHelp`)
      );
      cy.get('[data-cy=z2m-dashboard-interface-password-value]').should('not.contain', 'interface-password');
      cy.get('[data-cy=z2m-dashboard-interface-password-reveal]')
        .should('have.attr', 'aria-label', i18nText('mobileKit.togglePassword'))
        .click();
      cy.get('[data-cy=z2m-dashboard-interface-password-value]').should('have.text', 'interface-password');
    });

    it('should only tell to paste the password of the interface when Gladys has no link to it', () => {
      visitDashboard({ setup: { ...localSetup, Z2M_TCP_PORT: null, Z2M_FRONTEND_AUTH_TOKEN: 'interface-password' } });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-open-interface]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-interface-password]')
        .should('contain', i18nText(`${T}.advanced.interface.passwordHelpNoLink`))
        .and('not.contain', i18nText(`${T}.advanced.interface.passwordHelp`));
    });

    it('should copy the password of the interface without the clipboard API, as on the plain-HTTP local address', () => {
      visitDashboard({ setup: { ...localSetup, Z2M_FRONTEND_AUTH_TOKEN: 'interface-password' } });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.window().then(win => {
        // navigator.clipboard only exists in a secure context: the legacy copy of the plain-HTTP local address
        cy.stub(win.navigator.clipboard, 'writeText').rejects(new Error('not allowed'));
        cy.stub(win.document, 'execCommand')
          .returns(true)
          .as('execCommand');
      });
      cy.get('[data-cy=z2m-dashboard-interface-password-copy]')
        .should('have.attr', 'aria-label', i18nText(`${T}.mobile.copy`))
        .click();
      cy.get('@execCommand').should('have.been.calledWith', 'copy');
      cy.get('[data-cy=z2m-dashboard-interface-password-copied]')
        .should('have.attr', 'aria-live', 'polite')
        .and('contain', i18nText('integration.zigbee2mqtt.setup.modes.local.externalMqtt.copied'));
      cy.get('[data-cy=z2m-dashboard-interface-password-value]').should('not.contain', 'interface-password');
    });

    it('should reveal the password of the interface when the browser refuses to copy it', () => {
      visitDashboard({ setup: { ...localSetup, Z2M_FRONTEND_AUTH_TOKEN: 'interface-password' } });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.window().then(win => {
        cy.stub(win.navigator.clipboard, 'writeText').rejects(new Error('not allowed'));
        cy.stub(win.document, 'execCommand').returns(false);
      });
      cy.get('[data-cy=z2m-dashboard-interface-password-copy]').click();
      // Shown for the user to select it
      cy.get('[data-cy=z2m-dashboard-interface-password-value]').should('have.text', 'interface-password');
      cy.get('[data-cy=z2m-dashboard-interface-password-copied]').should('be.empty');
    });

    it('should show no password of the interface when Gladys does not know it', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-interface]').should('exist');
      cy.get('[data-cy=z2m-dashboard-interface-hint]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-port]').should('exist');
      cy.get('[data-cy=z2m-dashboard-interface-password]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-open-interface]')
        .should('have.attr', 'href')
        .and('match', /:12000$/);
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
      visitDashboard({ status: onlineStatus, setup: externalSetup });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.onlineExternal.title`);
      cy.get('[data-cy=z2m-dashboard-pair]').should('exist');
      cy.get('[data-cy=z2m-dashboard-key]').should('contain', 'mqtt://192.168.1.10:1883');
      cy.get('[data-cy=z2m-dashboard-change-key]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-tiles] [data-cy=z2m-dashboard-restart]').should('not.exist');
      // Only Gladys disconnects: Zigbee2mqtt runs on, the words say so
      cy.get('[data-cy=z2m-dashboard-stop]').i18n(`${T}.actions.disconnect`);
      cy.get('[data-cy=z2m-dashboard-stop]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-stop]').i18n(`${T}.confirmStopExternal.text`);
      cy.get('[data-cy=z2m-dashboard-cancel-stop]').click();

      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-broker]').should('exist');
      cy.get('[data-cy=z2m-dashboard-port]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-component-broker]').should('not.exist');
      // The reset forgets the connection, it does not touch the Zigbee2mqtt that runs elsewhere
      cy.get('[data-cy=z2m-dashboard-reset]').i18n(`${T}.advanced.reset.textExternal`);
      cy.get('[data-cy=z2m-reset-button]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-reset]').i18n(`${T}.advanced.reset.confirmExternal`);
    });

    it('should tell that Zigbee2mqtt does not answer on the broker Gladys is connected to, as the wizard does', () => {
      visitDashboard({ status: { ...notAnsweringStatus, z2mVersion: null, deviceCount: null }, setup: externalSetup });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.notAnsweringExternal.title`);
      cy.get('[data-cy=z2m-dashboard-subtitle]').should('contain', 'base_topic');
      // Nothing would receive a request to permit joining
      cy.get('[data-cy=z2m-dashboard-pair]').should('not.exist');
      // Gladys is connected to the broker: it can disconnect
      cy.get('[data-cy=z2m-dashboard-stop]').i18n(`${T}.actions.disconnect`);

      // Older than the health check: it never answers
      sendStatus({ ...notAnsweringStatus, z2mVersion: '1.20.0' });
      cy.get('[data-cy=z2m-dashboard-status]').should(
        'contain',
        i18nText('integration.zigbee2mqtt.setup.wizard.progress.zigbee2mqttTooOldTitle', { version: '1.20.0' })
      );

      sendStatus(onlineStatus);
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.onlineExternal.title`);
    });

    it('should not tell an installation success for a connection to an external broker', () => {
      visitDashboard({ status: { ...onlineStatus, installation: runningInstallation }, setup: externalSetup });
      cy.get('[data-cy=z2m-dashboard-progress]').should('exist');
      sendProgress(doneInstallation);
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.onlineExternal.title`);
      cy.get('[data-cy=z2m-dashboard-installation-success]').should('not.exist');
    });

    it('should tell the broker out of reach, with the way to edit the connection and nothing to disconnect', () => {
      visitDashboard({
        status: {
          ...notAnsweringStatus,
          gladysConnected: false,
          mqttConnectionError: null,
          installation: {
            ...failedInstallation,
            error: { code: 'BROKER_UNREACHABLE', message: 'connect ECONNREFUSED 192.168.1.10:1883' }
          }
        },
        setup: externalSetup
      });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.mqttError.title`);
      // Told by the installation that tried to connect
      cy.get('[data-cy=z2m-dashboard-mqtt-error]').i18n(
        'integration.zigbee2mqtt.setup.mqttConnectionErrors.BROKER_UNREACHABLE'
      );
      cy.get('[data-cy=z2m-dashboard-stop]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-restart]').should('not.exist');

      cy.get('[data-cy=z2m-dashboard-editConnection]')
        .i18n('integration.zigbee2mqtt.setup.wizard.failure.changeConnection')
        .click();
      cy.get('[data-cy=z2m-dashboard-advanced]').should('exist');
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').should('have.value', 'mqtt://192.168.1.10:1883');
    });

    it('should tell Gladys disconnected from a Zigbee2mqtt that runs elsewhere, and connect it again', () => {
      visitDashboard({
        status: {
          ...notAnsweringStatus,
          stopped: true,
          stoppedAt: '2026-11-17T08:00:00.000Z',
          gladysConnected: false
        },
        setup: externalSetup
      });
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.stoppedExternal.title`);
      cy.get('[data-cy=z2m-dashboard-start]').i18n(`${T}.actions.connect`);
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

      // A code without a text of its own: shown as an unknown error, not as an empty alert
      sendStatus({ ...brokerError, mqttConnectionError: { code: 'ECONNRESET', message: 'read ECONNRESET' } });
      cy.get('[data-cy=z2m-dashboard-mqtt-error]')
        .should(
          'contain',
          Cypress._.get(Cypress.env('i18n'), 'integration.zigbee2mqtt.setup.mqttConnectionErrors.unknownErrorPrefix')
        )
        .and('contain', 'read ECONNRESET');

      sendStatus({ ...notAnsweringStatus, mqttConnectionError: null });
      cy.get('[data-cy=z2m-dashboard-mqtt-error]').should('not.exist');
    });

    it('should save the broker from the advanced settings as the wizard saves it', () => {
      visitDashboard({ setup: { ...externalSetup, Z2M_FRONTEND_URL: 'http://192.168.1.10:8080' } });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerSetup({ body: { ...externalSetup, Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883' } });

      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').should('have.value', 'mqtt://192.168.1.10:1883');
      cy.get('[data-cy=z2m-dashboard-broker-save]').should('be.disabled');
      cy.get('[data-cy=z2m-dashboard-broker-cancel]').should('not.exist');

      // Cancel: the fields back to what is saved
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').type('mqtt://typo');
      cy.get('[data-cy=z2m-dashboard-broker-cancel]').click();
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').should('have.value', 'mqtt://192.168.1.10:1883');

      // An anonymous broker: the fields left empty are erased, the URL trimmed
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').type('  mqtt://192.168.1.11:1883  ');
      cy.get('[data-cy=z2m-dashboard-broker-mqttUsername]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-mqttPassword]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-z2mFrontendUrl]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-save]').click();
      cy.wait('@setup')
        .its('request.body')
        .should('deep.equal', {
          Z2M_MQTT_MODE: 'external',
          Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883',
          GLADYS_MQTT_USERNAME: null,
          GLADYS_MQTT_PASSWORD: null,
          Z2M_FRONTEND_URL: null
        });
      cy.get('[data-cy=z2m-dashboard-key]').should('contain', 'mqtt://192.168.1.11:1883');
    });

    it('should ask before leaving the advanced settings with a broker not saved', () => {
      visitDashboard({ setup: externalSetup });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').type('mqtt://192.168.1.11:1883');

      cy.get('[data-cy=z2m-dashboard-back]').click();
      cy.get('[data-cy=z2m-dashboard-leave-confirm]').should('exist');
      cy.get('[data-cy=z2m-dashboard-leave-keep-editing]').click();
      cy.get('[data-cy=z2m-dashboard-leave-confirm]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').should('have.value', 'mqtt://192.168.1.11:1883');

      // Saved, then back on the dashboard
      answerSetup({ body: { ...externalSetup, Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883' } });
      cy.get('[data-cy=z2m-dashboard-back]').click();
      cy.get('[data-cy=z2m-dashboard-leave-save]').click();
      cy.wait('@setup')
        .its('request.body')
        .should('include', { Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883', GLADYS_MQTT_USERNAME: 'gladys' });
      cy.get('[data-cy=z2m-dashboard]').should('exist');
    });

    it('should leave the advanced settings without saving once asked', () => {
      visitDashboard();
      answerSetup({ body: localSetup });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('12001');
      cy.get('[data-cy=z2m-dashboard-back]').click();
      cy.get('[data-cy=z2m-dashboard-leave-discard]').click();
      cy.get('[data-cy=z2m-dashboard]').should('exist');
      cy.get('@setup.all').should('have.length', 0);
    });
  });
});
