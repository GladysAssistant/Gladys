import {
  ZBDONGLE_E,
  phases,
  runningInstallation,
  failedInstallation,
  doneInstallation,
  sendProgress,
  sendStatus
} from './wizardFixtures';
import {
  onlineStatus,
  notAnsweringStatus,
  localSetup,
  conflict,
  i18nText,
  visitDashboard,
  answerAction
} from './dashboardFixtures';
import { answerPairing, sendPermitJoin } from './pairingFixtures';

const T = 'integration.zigbee2mqtt.setup.dashboard';

// The setup page of a configured installation (docs/specs/zigbee2mqtt-installation.md, N); a first installation goes
// through the wizard (Zigbee2MqttWizard.cy.js)
describe('Zigbee2mqtt dashboard', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('state', () => {
    it('should show an online network, its coordinator and the devices to add', () => {
      visitDashboard();

      cy.get('[data-cy=z2m-wizard]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-status]').should('have.attr', 'data-state', 'online');
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
      cy.get('[data-cy=z2m-dashboard-subtitle]').should(
        'have.text',
        i18nText(`${T}.states.online.devices.other`, { count: 12 })
      );
      cy.get('[data-cy=z2m-dashboard-new-devices]')
        .should('have.attr', 'href', '/dashboard/integration/device/zigbee2mqtt/discover')
        .and('contain', i18nText(`${T}.newDevices.other`, { count: 2 }));

      cy.get('[data-cy=z2m-dashboard-key-name]').should('have.text', 'SONOFF Zigbee 3.0 USB Dongle Plus-E');
      cy.get('[data-cy=z2m-dashboard-fact-driver]').should('contain', 'ember');
      cy.get('[data-cy=z2m-dashboard-fact-firmware]').should('contain', '7.4.4.0');
      cy.get('[data-cy=z2m-dashboard-fact-version]').should('contain', '2.6.0');

      cy.get('[data-cy=z2m-dashboard-restart]').should('exist');
      cy.get('[data-cy=z2m-dashboard-stop]').should('exist');
      cy.get('[data-cy=z2m-dashboard-interface]')
        .should('have.attr', 'href')
        .and('match', /:12000$/);
      cy.get('[data-cy=z2m-dashboard-ezsp]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-update-pending]').should('not.exist');
    });

    it('should count the devices to add again from the discovered devices sent by the server', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-new-devices]').should('exist');

      cy.sendWebSocket({
        type: 'zigbee2mqtt.discover',
        payload: [{ name: 'Lamp', external_id: 'zigbee2mqtt:lamp' }]
      });
      cy.get('[data-cy=z2m-dashboard-new-devices]').should('contain', i18nText(`${T}.newDevices.one`));

      cy.sendWebSocket({ type: 'zigbee2mqtt.discover', payload: [] });
      cy.get('[data-cy=z2m-dashboard-new-devices]').should('not.exist');
    });

    it('should open the pairing window from the status card, and come back to the dashboard', () => {
      visitDashboard();
      answerPairing();

      cy.get('[data-cy=z2m-dashboard-pair]').click();
      // The window asks Zigbee2mqtt to permit joining as it opens (docs/specs/zigbee2mqtt-pairing.md, D)
      cy.get('[data-cy=z2m-dashboard-pairing]').should('exist');
      cy.wait('@permitJoin')
        .its('request.body')
        .should('deep.equal', { value: true });
      sendPermitJoin({ allowed: true, remainingSeconds: 254 });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');

      // Joining goes on by itself: nothing is sent when the window closes
      cy.get('[data-cy=z2m-pairing-close]').click();
      cy.get('[data-cy=z2m-dashboard-pairing]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-status]').should('have.attr', 'data-state', 'online');
      cy.get('@permitJoin.all').should('have.length', 1);
    });

    it('should show Zigbee2mqtt as starting, until it is online', () => {
      // Gladys has just (re)started the container, and is not connected to the broker again yet
      visitDashboard({ status: { ...notAnsweringStatus, gladysConnected: false, zigbee2mqttStarting: true } });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.starting.title`);
      cy.get('[data-cy=z2m-dashboard-restart]').should('exist');

      sendStatus(onlineStatus);
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
      // Online again: the devices to add are read again
      cy.wait('@discovered');
      cy.get('[data-cy=z2m-dashboard-new-devices]').should('exist');
    });

    it('should restart a Zigbee2mqtt that does not answer', () => {
      visitDashboard({ status: notAnsweringStatus });
      answerAction('restart');

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.notAnswering.title`);
      cy.get('[data-cy=z2m-dashboard-subtitle]').i18n(`${T}.states.notAnswering.text`);
      cy.get('[data-cy=z2m-dashboard-new-devices]').should('not.exist');
      // The main action, not a tile again
      cy.get('[data-cy=z2m-dashboard-tiles] [data-cy=z2m-dashboard-restart]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-status] [data-cy=z2m-dashboard-restart]').click();
      cy.wait('@restart');
      cy.get('[data-cy=z2m-dashboard-action-error]').should('not.exist');
    });

    it('should tell why Zigbee2mqtt does not start, with the way to restart it or to change the dongle', () => {
      visitDashboard({
        status: { ...notAnsweringStatus, z2mContainerError: { code: 'EZSP_PROTOCOL_VERSION', message: null } }
      });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.failed.title`);
      cy.get('[data-cy=z2m-dashboard-error] [data-cy=z2m-wizard-failure]').should('exist');
      cy.get('[data-cy=z2m-dashboard-status] [data-cy=z2m-dashboard-restart]').should('exist');
      cy.get('[data-cy=z2m-dashboard-tiles] [data-cy=z2m-dashboard-restart]').should('not.exist');

      cy.get('[data-cy=z2m-dashboard-failure-change-key]').click();
      cy.get('[data-cy=z2m-wizard-cancel]').should('exist');
    });

    it('should show the failure of the last installation, until Zigbee2mqtt answers', () => {
      visitDashboard({ status: { ...notAnsweringStatus, installation: failedInstallation } });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.failed.title`);
      cy.get('[data-cy=z2m-wizard-failure-title]').i18n(
        'integration.zigbee2mqtt.setup.wizard.failure.titles.ADAPTER_NO_RESPONSE'
      );
      cy.get('[data-cy=z2m-wizard-failure-text]').i18n(
        'integration.zigbee2mqtt.setup.wizard.failure.texts.ADAPTER_NO_RESPONSE.usb'
      );

      // Restarted by Docker after the failure
      sendStatus({ ...onlineStatus, installation: failedInstallation });
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
      cy.get('[data-cy=z2m-dashboard-error]').should('not.exist');
    });

    it('should tell that the dongle is unplugged', () => {
      visitDashboard({ status: { ...notAnsweringStatus, dongleMissing: true } });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.dongleMissing.title`);
      cy.get('[data-cy=z2m-dashboard-subtitle]').i18n(`${T}.states.dongleMissing.text`);
      // Zigbee2mqtt starts again once the dongle is plugged back: nothing to restart
      cy.get('[data-cy=z2m-dashboard-restart]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-stop]').should('exist');
    });

    it('should keep the missing dongle told while the status was being read', () => {
      // Long enough for the message to come before the answer
      visitDashboard({ status: notAnsweringStatus, statusDelay: 5000 });
      sendStatus({ ...notAnsweringStatus, dongleMissing: true });
      cy.wait('@status');
      cy.wait('@config');

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.dongleMissing.title`);
    });

    it('should tell that an update waits for the next start, and that the network has no device', () => {
      visitDashboard({ status: { ...onlineStatus, updatePending: true, deviceCount: 0 } });

      cy.get('[data-cy=z2m-dashboard-update-pending]').i18n(`${T}.updatePending`);
      cy.get('[data-cy=z2m-dashboard-subtitle]').should('have.text', i18nText(`${T}.states.online.devices.zero`));
    });

    it('should tell that Gladys runs the dongle with the ezsp driver once it falls back on it', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-fact-driver]').should('contain', 'ember');

      // The ember driver refused the firmware of the dongle: Gladys switched to its "(legacy ezsp)" model
      const serverUrl = Cypress.env('serverUrl');
      cy.intercept(
        { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` },
        { body: { ...localSetup, ZIGBEE_DONGLE_NAME: `${ZBDONGLE_E} (legacy ezsp)` } }
      ).as('configAfterFallback');
      sendStatus({ ...onlineStatus, ezspFallback: true });
      cy.wait('@configAfterFallback');

      cy.get('[data-cy=z2m-dashboard-fact-driver]').i18n('integration.zigbee2mqtt.setup.wizard.ready.ezspDriver');
      cy.get('[data-cy=z2m-dashboard-ezsp]').should('exist');
    });

    it('should show a network coordinator by its address and type', () => {
      visitDashboard({
        setup: {
          ...localSetup,
          Z2M_ADAPTER_MODE: 'network',
          ZIGBEE2MQTT_DRIVER_PATH: null,
          ZIGBEE_DONGLE_NAME: null,
          Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
          Z2M_NETWORK_ADAPTER_TYPE: 'zstack'
        }
      });

      cy.get('[data-cy=z2m-dashboard-key-name]').i18n(`${T}.network.title`);
      cy.get('[data-cy=z2m-dashboard-key]').should('contain', 'tcp://192.168.1.20:6638');
      cy.get('[data-cy=z2m-dashboard-fact-driver]').should('contain', 'zstack');

      // It does not answer: what to do with a network coordinator
      sendStatus({ ...notAnsweringStatus, installation: failedInstallation });
      cy.get('[data-cy=z2m-wizard-failure-text]').i18n(
        'integration.zigbee2mqtt.setup.wizard.failure.texts.ADAPTER_NO_RESPONSE.network'
      );
    });

    it('should hide the link to the Zigbee2mqtt interface until its port is saved', () => {
      // A failed first installation saved no port: the default one would be wrong
      visitDashboard({
        status: { ...notAnsweringStatus, installation: failedInstallation },
        setup: { ...localSetup, Z2M_TCP_PORT: null }
      });

      cy.get('[data-cy=z2m-dashboard-error]').should('exist');
      cy.get('[data-cy=z2m-dashboard-interface]').should('not.exist');
    });

    it('should send to Settings > Services while the service is not started, then follow it once started', () => {
      // Stopped in the settings, or not started yet: the containers removed, Gladys disconnected
      const notStartedStatus = {
        ...onlineStatus,
        serviceStarted: false,
        configured: null,
        z2mEnabled: false,
        zigbee2mqttExist: false,
        mqttExist: false,
        gladysConnected: false,
        zigbee2mqttConnected: false
      };
      visitDashboard({ status: notStartedStatus });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.inactive.title`);
      cy.get('[data-cy=z2m-dashboard-services]').should('have.attr', 'href', '/dashboard/settings/service');
      cy.get('[data-cy=z2m-dashboard-tiles]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-restart]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-start]').should('not.exist');
      // Nothing installed meanwhile: the server refuses it
      cy.get('[data-cy=z2m-dashboard-change-key]').should('be.disabled');

      // Started from the settings
      sendStatus({ ...onlineStatus, serviceStarted: true });
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
      cy.get('[data-cy=z2m-dashboard-change-key]').should('not.be.disabled');
    });

    it('should wait for init to read the configuration, without an action', () => {
      // Started, the configuration not read yet: Zigbee2mqtt not answering is not a failure meanwhile
      visitDashboard({
        status: { ...onlineStatus, configured: null, gladysConnected: false, zigbee2mqttConnected: false }
      });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.pending.title`);
      cy.get('[data-cy=z2m-dashboard-restart]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-tiles]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-services]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-change-key]').should('be.disabled');

      sendStatus(onlineStatus);
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
    });

    it('should offer to stop again the containers Docker refused to stop', () => {
      visitDashboard({
        status: {
          ...onlineStatus,
          stopped: true,
          stoppedAt: '2026-11-17T08:00:00.000Z',
          gladysConnected: false,
          zigbee2mqttConnected: false
        }
      });
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.stopped.title`);
      cy.get('[data-cy=z2m-dashboard-stop]').should('exist');
      cy.get('[data-cy=z2m-dashboard-restart]').should('not.exist');
    });

    it('should give up a stop not confirmed once the user went to another screen', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-stop]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('exist');

      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-back]').click();
      cy.get('[data-cy=z2m-dashboard-tiles]').should('exist');
      cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('not.exist');
    });

    it('should tell that the status cannot be loaded instead of a state guessed from nothing', () => {
      const serverUrl = Cypress.env('serverUrl');
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { statusCode: 500 });
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: localSetup });
      cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

      cy.get('[data-cy=z2m-dashboard-status-error]').i18n('integration.zigbee2mqtt.setup.errorLoadingStatesLabel');
      cy.get('[data-cy=z2m-dashboard-restart]').should('not.exist');
    });

    it('should tell that the status cannot be loaded', () => {
      const serverUrl = Cypress.env('serverUrl');
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { statusCode: 500 });
      cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

      cy.get('[data-cy=z2m-setup-loading-error]').i18n('integration.zigbee2mqtt.setup.errorLoadingStatesLabel');
    });
  });

  describe('stop and start', () => {
    it('should stop Zigbee2mqtt once confirmed', () => {
      visitDashboard();
      // Answered once the containers are stopped
      answerAction('stop', { body: {}, delay: 1000 });

      cy.get('[data-cy=z2m-dashboard-stop]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-stop]').i18n(`${T}.confirmStop.text`);
      cy.get('[data-cy=z2m-dashboard-cancel-stop]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('not.exist');
      cy.get('@stop.all').should('have.length', 0);

      cy.get('[data-cy=z2m-dashboard-stop]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-stop-button]').click();
      // Told stopped by the server before its containers are
      sendStatus({
        ...onlineStatus,
        stopped: true,
        stoppedAt: '2026-11-17T08:00:00.000Z',
        zigbee2mqttConnected: false
      });
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.stopping.title`);
      cy.get('[data-cy=z2m-dashboard-tiles]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-start]').should('not.exist');
      cy.wait('@stop');
      cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('not.exist');

      // The status the server sends tells the outcome
      sendStatus({
        ...onlineStatus,
        stopped: true,
        stoppedAt: '2026-11-17T08:00:00.000Z',
        mqttRunning: false,
        zigbee2mqttRunning: false,
        gladysConnected: false,
        zigbee2mqttConnected: false
      });
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.stopped.title`);
      cy.get('[data-cy=z2m-dashboard-tiles]').should('not.exist');
    });

    it('should start a stopped Zigbee2mqtt and follow its start', () => {
      const stoppedStatus = {
        ...onlineStatus,
        stopped: true,
        stoppedAt: '2026-11-17T08:00:00.000Z',
        mqttRunning: false,
        zigbee2mqttRunning: false,
        gladysConnected: false,
        zigbee2mqttConnected: false
      };
      visitDashboard({ status: stoppedStatus });
      answerAction('start');

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.stopped.title`);
      cy.get('[data-cy=z2m-dashboard-subtitle]').should('contain', '2026');
      cy.get('[data-cy=z2m-dashboard-tiles]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-start]').click();
      cy.wait('@start');

      const startInstallation = { ...runningInstallation, kind: 'start' };
      sendStatus({ ...stoppedStatus, stopped: false, stoppedAt: null, installation: startInstallation });
      cy.get('[data-cy=z2m-dashboard-title]').i18n('integration.zigbee2mqtt.setup.installation.titles.start');
      cy.get('[data-cy=z2m-dashboard-progress]').should('contain', '64 %');
      cy.get('[data-cy=z2m-dashboard-change-key]').should('be.disabled');

      sendProgress({ ...doneInstallation, kind: 'start' });
      cy.get('[data-cy=z2m-dashboard-installation-success]').should(
        'have.text',
        i18nText('integration.zigbee2mqtt.setup.installation.success.start', { duration: '1 min 42 s' })
      );
      cy.get('[data-cy=z2m-dashboard-progress]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-change-key]').should('not.be.disabled');

      // Until the installation is cleared
      sendProgress({ state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null });
      cy.get('[data-cy=z2m-dashboard-installation-success]').should('not.exist');
    });

    it('should stop telling the success of an installation once another action runs, until the next one', () => {
      visitDashboard();
      answerAction('restart');
      sendProgress(runningInstallation);
      cy.get('[data-cy=z2m-dashboard-progress]').should('exist');
      sendProgress(doneInstallation);
      cy.get('[data-cy=z2m-dashboard-installation-success]').should('exist');

      cy.get('[data-cy=z2m-dashboard-tiles] [data-cy=z2m-dashboard-restart]').click();
      cy.wait('@restart');
      cy.get('[data-cy=z2m-dashboard-installation-success]').should('not.exist');

      sendProgress(runningInstallation);
      cy.get('[data-cy=z2m-dashboard-progress]').should('exist');
      sendProgress(doneInstallation);
      cy.get('[data-cy=z2m-dashboard-installation-success]').should('exist');
    });

    it('should not tell the success of an installation ended before the page opened', () => {
      visitDashboard({ status: { ...onlineStatus, installation: doneInstallation } });

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
      cy.get('[data-cy=z2m-dashboard-installation-success]').should('not.exist');
    });

    it('should tell that the integration is busy, until the installation that refused the action ends', () => {
      visitDashboard({ status: notAnsweringStatus });
      answerAction('restart', conflict('Zigbee2mqtt: cannot restart Zigbee2mqtt while an installation is running'));

      cy.get('[data-cy=z2m-dashboard-status] [data-cy=z2m-dashboard-restart]').click();
      cy.wait('@restart');
      cy.get('[data-cy=z2m-dashboard-action-error]').i18n(`${T}.actionErrors.busy`);

      sendProgress(runningInstallation);
      cy.get('[data-cy=z2m-dashboard-progress]').should('exist');
      sendProgress(doneInstallation);
      cy.get('[data-cy=z2m-dashboard-action-error]').should('not.exist');
    });

    it('should stop telling that the integration was busy once Zigbee2mqtt changed state', () => {
      visitDashboard({ status: notAnsweringStatus });
      // Refused by an operation (an init, the watch of the dongle), not by an installation
      answerAction('restart', conflict('Zigbee2mqtt: cannot restart Zigbee2mqtt while the integration is busy'));

      cy.get('[data-cy=z2m-dashboard-status] [data-cy=z2m-dashboard-restart]').click();
      cy.wait('@restart');
      cy.get('[data-cy=z2m-dashboard-action-error]').i18n(`${T}.actionErrors.busy`);

      sendStatus(onlineStatus);
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
      cy.get('[data-cy=z2m-dashboard-action-error]').should('not.exist');
    });

    it('should tell that an action failed', () => {
      visitDashboard();
      answerAction('stop', { statusCode: 500 });

      cy.get('[data-cy=z2m-dashboard-stop]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-stop-button]').click();
      cy.wait('@stop');
      cy.get('[data-cy=z2m-dashboard-action-error]').i18n(`${T}.actionErrors.error`);
      // Asked again until it is confirmed or cancelled
      cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('exist');
    });
  });

  describe('installation', () => {
    it('should follow an installation through its progress messages, then its failure', () => {
      visitDashboard();

      sendProgress({ ...runningInstallation, kind: 'switch' });
      cy.get('[data-cy=z2m-dashboard-title]').i18n('integration.zigbee2mqtt.setup.installation.titles.switch');
      cy.get('[data-cy=z2m-dashboard-phase]').i18n('integration.zigbee2mqtt.setup.installation.phases.start_z2m');
      cy.get('[data-cy=z2m-dashboard-tiles]').should('not.exist');

      sendStatus({ ...notAnsweringStatus, installation: { ...runningInstallation, kind: 'switch' } });
      sendProgress({ ...failedInstallation, kind: 'switch' });
      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.failed.title`);
      cy.get('[data-cy=z2m-wizard-failure-title]').i18n(
        'integration.zigbee2mqtt.setup.wizard.failure.titles.ADAPTER_NO_RESPONSE'
      );
    });

    it('should name the running phase rather than a pending one above it', () => {
      // Zigbee2mqtt is downloaded after the broker is started
      visitDashboard({
        status: {
          ...onlineStatus,
          installation: {
            ...runningInstallation,
            phases: phases({
              pull_z2m: 'pending',
              pull_mqtt: 'done',
              start_mqtt: 'running',
              start_z2m: 'pending',
              connect_adapter: 'pending'
            })
          }
        }
      });

      cy.get('[data-cy=z2m-dashboard-phase]').i18n('integration.zigbee2mqtt.setup.installation.phases.start_mqtt');
    });

    it('should keep the end of an installation received before the status, read while it was running', () => {
      // Long enough for the message and the check that the configuration is not read meanwhile
      visitDashboard({ status: { ...onlineStatus, installation: runningInstallation }, statusDelay: 5000 });
      sendProgress(doneInstallation);
      // Read after the status, the configuration is the one saved by the installation
      cy.get('@config.all').should('have.length', 0);
      cy.wait('@status');
      cy.wait('@config');

      cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
      cy.get('[data-cy=z2m-dashboard-progress]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-change-key]').should('not.be.disabled');
    });
  });
});
