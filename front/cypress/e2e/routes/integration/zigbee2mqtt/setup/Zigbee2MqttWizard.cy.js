import {
  readyToSetupStatus,
  machinePort,
  zbDongleE,
  zbDongleP,
  unknownDongle,
  ZBDONGLE_E,
  ZBDONGLE_P,
  phases,
  runningInstallation,
  failedInstallation,
  doneInstallation,
  usbSetup,
  sendProgress,
  sendStatus,
  answerSetup,
  visitWizard
} from './wizardFixtures';

describe('Zigbee2mqtt setup wizard', () => {
  const install = () => {
    cy.get('[data-cy=z2m-wizard-install]')
      .should('not.be.disabled')
      .click();
  };

  beforeEach(() => {
    cy.login();
  });

  it('should show the configured installation, not the wizard', () => {
    visitWizard({ setup: usbSetup });
    cy.get('[data-cy=z2m-toggle-status]').should('exist');
    cy.get('[data-cy=z2m-wizard]').should('not.exist');
  });

  it('should install the recognized dongle, then permit joining for the first device', () => {
    const serverUrl = Cypress.env('serverUrl');
    visitWizard();
    cy.get('[data-cy=z2m-wizard-key-one]').within(() => {
      cy.get('[data-cy=z2m-wizard-key-title]').i18n('integration.zigbee2mqtt.setup.wizard.key.detectedTitle');
      cy.get('[data-cy=z2m-wizard-key-name]').should('have.text', 'SONOFF Zigbee 3.0 USB Dongle Plus-E');
    });
    // The images are downloaded ahead for the dongle Gladys preselected
    cy.wait('@prefetch');
    answerSetup();
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', {
        Z2M_MQTT_MODE: 'local',
        Z2M_ADAPTER_MODE: 'usb',
        ZIGBEE2MQTT_DRIVER_PATH: zbDongleE.stablePath,
        ZIGBEE_DONGLE_NAME: ZBDONGLE_E
      });

    sendProgress(runningInstallation);
    cy.get('[data-cy=z2m-wizard-key-chip]').should('contain', 'SONOFF Zigbee 3.0 USB Dongle Plus-E');
    cy.get('[data-cy=z2m-wizard-progress]').should('have.text', '64 %');
    cy.get('[data-cy=z2m-wizard-phase]').should('have.length', 5);
    cy.get('[data-cy=z2m-wizard-phase][data-state=skipped]').i18n(
      'integration.zigbee2mqtt.setup.wizard.progress.alreadyDownloaded'
    );

    sendStatus({
      ...readyToSetupStatus,
      installation: runningInstallation,
      zigbee2mqttConnected: true,
      coordinatorFirmware: { revision: '7.4.4.0' }
    });
    sendProgress(doneInstallation);
    cy.get('[data-cy=z2m-wizard-ready]').should('exist');
    cy.get('[data-cy=z2m-wizard-summary-driver]').should('contain', 'ember');
    cy.get('[data-cy=z2m-wizard-summary-firmware]').should('contain', '7.4.4.0');
    cy.get('[data-cy=z2m-wizard-summary-duration]').should('contain', '1 min 42 s');

    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/permit_join` }, { body: {} }).as(
      'permitJoin'
    );
    cy.get('[data-cy=z2m-wizard-pair]').click();
    cy.get('[data-cy=z2m-wizard-allow-joining]').click();
    // Allowed, never toggled: an association already allowed stays allowed
    cy.wait('@permitJoin')
      .its('request.body')
      .should('deep.equal', { value: true });
    cy.get('[data-cy=z2m-wizard-permit-join-allowed]').should('exist');
    cy.get('[data-cy=z2m-wizard-go-to-discover]').should(
      'have.attr',
      'href',
      '/dashboard/integration/device/zigbee2mqtt/discover'
    );
    // Closed by Zigbee2mqtt after 254 s: joining can be permitted again
    cy.sendWebSocket({ type: 'zigbee2mqtt.permit-join', payload: false });
    cy.get('[data-cy=z2m-wizard-permit-join-allowed]').should('not.exist');
    cy.get('[data-cy=z2m-wizard-allow-joining]').should('not.be.disabled');
    // Permitted from another page: told here too
    cy.sendWebSocket({ type: 'zigbee2mqtt.permit-join', payload: true });
    cy.get('[data-cy=z2m-wizard-permit-join-allowed]').should('exist');

    // The wizard is left for the page of the installation
    cy.get('[data-cy=z2m-wizard-finish]').click();
    cy.get('[data-cy=z2m-wizard]').should('not.exist');
    cy.get('[data-cy=z2m-toggle-status]').should('exist');
  });

  it('should tell that joining could not be permitted', () => {
    const serverUrl = Cypress.env('serverUrl');
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendProgress(doneInstallation);
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/permit_join` }, { statusCode: 500 });
    cy.get('[data-cy=z2m-wizard-pair]').click();
    cy.get('[data-cy=z2m-wizard-allow-joining]').click();
    cy.get('[data-cy=z2m-wizard-permit-join-error]').i18n('integration.zigbee2mqtt.setup.wizard.pair.allowError');
    cy.get('[data-cy=z2m-wizard-allow-joining]').should('not.be.disabled');
  });

  it('should wait for a dongle, and show it once plugged in without reloading', () => {
    visitWizard({ ports: [[machinePort], [machinePort, zbDongleE]] });
    cy.get('[data-cy=z2m-wizard-key-none]').should('exist');
    cy.get('[data-cy=z2m-wizard-install]').should('be.disabled');
    cy.get('[data-cy=z2m-wizard-key-one]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy=z2m-wizard-just-plugged]').should('exist');
    cy.get('[data-cy=z2m-wizard-install]').should('not.be.disabled');
  });

  it('should let the user choose among several recognized dongles', () => {
    visitWizard({ ports: [[zbDongleE, zbDongleP]] });
    cy.get('[data-cy=z2m-wizard-key-several]').should('exist');
    cy.get('[data-cy=z2m-wizard-install]').should('be.disabled');
    cy.get('[data-cy=z2m-wizard-key-card]').should('have.length', 2);
    cy.get('[data-cy=z2m-wizard-key-card]')
      .contains('SONOFF Zigbee 3.0 USB Dongle Plus-P')
      .click();
    answerSetup();
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', { ZIGBEE2MQTT_DRIVER_PATH: zbDongleP.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_P });
  });

  it('should ask the model of a dongle it does not recognize, grouped by brand and searched by alias', () => {
    visitWizard({ ports: [[machinePort, unknownDongle]] });
    cy.get('[data-cy=z2m-wizard-key-unknown]').should('exist');
    // The only USB device plugged in is preselected; its model is to choose
    cy.get('[data-cy=z2m-wizard-port]').should('have.value', unknownDongle.stablePath);
    cy.get('[data-cy=z2m-wizard-install]').should('be.disabled');
    // No "(legacy ezsp)" model to choose
    cy.get('[data-cy=z2m-wizard-model-option]')
      .contains('legacy ezsp')
      .should('not.exist');
    cy.get('[data-cy=z2m-wizard-model-search]').type('dongle-e');
    cy.get('[data-cy=z2m-wizard-model-option]').should('have.length', 1);
    cy.get('[data-cy=z2m-wizard-model-option]')
      .should('contain', 'Zigbee 3.0 USB Dongle Plus-E')
      .click();
    answerSetup();
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', { ZIGBEE2MQTT_DRIVER_PATH: unknownDongle.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_E });
  });

  it('should find a model by its brand and a word of its name', () => {
    visitWizard({ ports: [[unknownDongle]] });
    cy.get('[data-cy=z2m-wizard-model-search]').type('sonoff p');
    cy.get('[data-cy=z2m-wizard-model-option]').should('contain', 'Zigbee 3.0 USB Dongle Plus-P');
    cy.get('[data-cy=z2m-wizard-model-option]').should('not.contain', 'Zigbee 3.0 USB Dongle Plus-E');
    // The model code, not an alias of another model (bench of 2026-11-17)
    cy.get('[data-cy=z2m-wizard-model-search]').clear();
    cy.get('[data-cy=z2m-wizard-model-search]').type('dongle-p');
    cy.get('[data-cy=z2m-wizard-model-option]').should('contain', 'Zigbee 3.0 USB Dongle Plus-P');
    cy.get('[data-cy=z2m-wizard-model-option]').should('not.contain', 'Zigbee 3.0 USB Dongle Plus-E');
    // An alias typed in full: the model it names, and the one whose model code it is
    cy.get('[data-cy=z2m-wizard-model-search]').clear();
    cy.get('[data-cy=z2m-wizard-model-search]').type('zbt-1');
    cy.get('[data-cy=z2m-wizard-model-option]').should('have.length', 2);
    cy.get('[data-cy=z2m-wizard-model-option]').should('contain', 'Connect ZBT-1');
    cy.get('[data-cy=z2m-wizard-model-option]').should('contain', 'SkyConnect');
    // The end of a name, without a model code
    cy.get('[data-cy=z2m-wizard-model-search]').clear();
    cy.get('[data-cy=z2m-wizard-model-search]').type('mg24');
    cy.get('[data-cy=z2m-wizard-model-option]').should('contain', 'XIAO MG24');
    cy.get('[data-cy=z2m-wizard-model-option]').should('contain', 'Dongle Plus MG24');
    cy.get('[data-cy=z2m-wizard-model-search]').clear();
    cy.get('[data-cy=z2m-wizard-model-search]').type('nothing like this');
    cy.get('[data-cy=z2m-wizard-model-none]').should('exist');
  });

  it('should let the user choose the dongle by hand, starting from the detected one', () => {
    visitWizard({ ports: [[machinePort, zbDongleE]] });
    cy.get('[data-cy=z2m-wizard-show-manual]').click();
    cy.get('[data-cy=z2m-wizard-manual]').should('exist');
    cy.get('[data-cy=z2m-wizard-port]').should('have.value', zbDongleE.stablePath);
    cy.get('[data-cy=z2m-wizard-model-option][aria-pressed=true]').should('contain', 'Zigbee 3.0 USB Dongle Plus-E');
    // The serial ports of the machine are offered on demand
    cy.get('[data-cy=z2m-wizard-port] option').should('have.length', 2);
    cy.get('[data-cy=z2m-wizard-show-all-ports]').click();
    cy.get('[data-cy=z2m-wizard-port] option').should('have.length', 3);
    cy.get('[data-cy=z2m-wizard-show-auto]').click();
    cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
  });

  it('should install a network coordinator', () => {
    visitWizard();
    cy.get('[data-cy=z2m-wizard-show-network]').click();
    cy.get('[data-cy=z2m-wizard-install]').should('be.disabled');
    cy.get('[data-cy=z2m-wizard-network-url]').type('tcp://192.168.1.20:6638');
    cy.get('[data-cy=z2m-wizard-network-type]').select('ember');
    answerSetup({ body: { Z2M_ADAPTER_MODE: 'network', Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638' } });
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', {
        Z2M_MQTT_MODE: 'local',
        Z2M_ADAPTER_MODE: 'network',
        Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
        Z2M_NETWORK_ADAPTER_TYPE: 'ember',
        ZIGBEE2MQTT_DRIVER_PATH: null
      });
  });

  it('should connect to a Zigbee2mqtt that runs elsewhere, and sum up what it tells', () => {
    visitWizard({ ports: [[machinePort]] });
    cy.get('[data-cy=z2m-wizard-show-external]').click();
    cy.get('[data-cy=z2m-wizard-install]')
      .should('be.disabled')
      .i18n('integration.zigbee2mqtt.setup.wizard.connect');
    cy.get('[data-cy=z2m-wizard-mqttUrl]').type('mqtt://192.168.1.10:1883');
    cy.get('[data-cy=z2m-wizard-mqttUsername]').type('gladys');
    cy.get('[data-cy=z2m-wizard-mqttPassword]').type('secret');
    answerSetup({ body: { Z2M_MQTT_MODE: 'external', Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883' } });
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', {
        Z2M_MQTT_MODE: 'external',
        Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883',
        GLADYS_MQTT_USERNAME: 'gladys',
        GLADYS_MQTT_PASSWORD: 'secret'
      });
    // Nothing is downloaded for an external broker
    cy.get('@prefetch.all').should('have.length', 0);
    // Only the connection is followed
    const externalInstallation = { ...runningInstallation, phases: phases({ connect_adapter: 'running' }) };
    sendProgress(externalInstallation);
    cy.get('[data-cy=z2m-wizard-phase]')
      .should('have.length', 1)
      .i18n('integration.zigbee2mqtt.setup.wizard.progress.phases.connectExternal');
    sendStatus({
      ...readyToSetupStatus,
      installation: externalInstallation,
      gladysConnected: true,
      z2mVersion: '2.14.2',
      deviceCount: 12
    });
    const connectedInstallation = { ...doneInstallation, phases: phases({ connect_adapter: 'done' }) };
    sendProgress(connectedInstallation);
    // Connected to the broker, Zigbee2mqtt not heard on it yet: not ready
    cy.get('[data-cy=z2m-wizard-waiting-zigbee2mqtt]').should('exist');
    cy.get('[data-cy=z2m-wizard-ready]').should('not.exist');
    cy.get('[data-cy=z2m-wizard-change-key]').i18n('integration.zigbee2mqtt.setup.wizard.failure.changeConnection');
    sendStatus({
      ...readyToSetupStatus,
      installation: connectedInstallation,
      gladysConnected: true,
      zigbee2mqttConnected: true,
      z2mVersion: '2.14.2',
      deviceCount: 12
    });
    cy.get('[data-cy=z2m-wizard-summary-broker]').should('contain', 'mqtt://192.168.1.10:1883');
    cy.get('[data-cy=z2m-wizard-summary-version]').should('contain', '2.14.2');
    cy.get('[data-cy=z2m-wizard-summary-devices]').should('contain', '12');
  });

  it('should only offer a Zigbee2mqtt that runs elsewhere when Gladys cannot install it', () => {
    visitWizard({ status: { ...readyToSetupStatus, dockerBased: false } });
    cy.get('[data-cy=z2m-wizard-incompatible]').should('exist');
    cy.get('[data-cy=z2m-wizard-install]').should('not.exist');
    cy.get('[data-cy=z2m-wizard-show-network]').should('not.exist');
    cy.get('[data-cy=z2m-wizard-use-external]').click();
    cy.get('[data-cy=z2m-wizard-external]').should('exist');
    cy.get('[data-cy=z2m-wizard-show-auto]').i18n('integration.zigbee2mqtt.setup.wizard.key.back');
  });

  it('should tell why the installation failed, then retry it without showing the previous failure', () => {
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendProgress(failedInstallation);
    cy.get('[data-cy=z2m-wizard-failure-title]').i18n(
      'integration.zigbee2mqtt.setup.wizard.failure.titles.ADAPTER_NO_RESPONSE'
    );
    cy.get('[data-cy=z2m-wizard-failure-details]').should('contain', 'HOST_FATAL_ERROR');
    cy.get('[data-cy=z2m-wizard-phase][data-state=failed]').i18n(
      'integration.zigbee2mqtt.setup.wizard.progress.phases.connectUsb'
    );

    answerSetup({ body: usbSetup, delay: 300 });
    cy.get('[data-cy=z2m-wizard-retry]').click();
    // The failure in the status is the previous installation's, until the new one shows up
    cy.get('[data-cy=z2m-wizard-failure]').should('not.exist');
    cy.wait('@setup')
      .its('request.body')
      .should('include', { ZIGBEE2MQTT_DRIVER_PATH: zbDongleE.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_E });
    cy.get('[data-cy=z2m-wizard-progress]').should('have.text', '0 %');
    sendProgress(runningInstallation);
    cy.get('[data-cy=z2m-wizard-progress]').should('have.text', '64 %');
  });

  it('should show the network ready when Zigbee2mqtt answers after the installation failed, and keep it', () => {
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendProgress(runningInstallation);
    cy.get('[data-cy=z2m-wizard-progress]').should('have.text', '64 %');
    sendProgress(failedInstallation);
    cy.get('[data-cy=z2m-wizard-failure]').should('exist');
    // Restarted by Docker, Zigbee2mqtt answers: the failure is cleared, the installation idle as before Install
    sendStatus({ ...readyToSetupStatus, installation: failedInstallation, zigbee2mqttConnected: true });
    sendProgress(readyToSetupStatus.installation);
    cy.get('[data-cy=z2m-wizard-ready]').should('exist');
    // Zigbee2mqtt restarting later does not take the wizard back to a failure
    sendStatus({ ...readyToSetupStatus, zigbee2mqttConnected: false });
    cy.get('[data-cy=z2m-wizard-ready]').should('exist');
    cy.get('[data-cy=z2m-wizard-failure]').should('not.exist');
  });

  it('should not take a failure cleared elsewhere for the installation it is starting', () => {
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendProgress(runningInstallation);
    cy.get('[data-cy=z2m-wizard-progress]').should('have.text', '64 %');
    sendProgress(failedInstallation);
    cy.get('[data-cy=z2m-wizard-failure]').should('exist');
    // Cleared by a stop made elsewhere: the installation idle as before Install, Zigbee2mqtt not answering
    sendProgress(readyToSetupStatus.installation);
    cy.get('[data-cy=z2m-wizard-failure-title]').i18n('integration.zigbee2mqtt.setup.wizard.failure.titles.unknown');
    cy.get('[data-cy=z2m-wizard-retry]').should('exist');
  });

  it('should explain refused MQTT credentials, and show the settings Zigbee2mqtt refused in clear', () => {
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendProgress({ ...failedInstallation, error: { code: 'BAD_CREDENTIALS', message: 'Connection refused' } });
    cy.get('[data-cy=z2m-wizard-failure-text]').i18n(
      'integration.zigbee2mqtt.setup.wizard.failure.texts.BAD_CREDENTIALS'
    );
    sendProgress({
      ...failedInstallation,
      error: { code: 'INVALID_CONFIGURATION', message: 'serial.adapter must be equal to one of the allowed values' },
      durationMs: 141000
    });
    cy.get('[data-cy=z2m-wizard-failure-details]')
      .should('be.visible')
      .and('contain', 'serial.adapter');
  });

  it('should retry with the ezsp driver Gladys switched to', () => {
    const serverUrl = Cypress.env('serverUrl');
    const legacySetup = { ...usbSetup, ZIGBEE_DONGLE_NAME: `${ZBDONGLE_E} (legacy ezsp)` };
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    // The saved model changes: the setup page loads it again
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: legacySetup }).as(
      'savedSetup'
    );
    sendStatus({ ...readyToSetupStatus, ezspFallback: true, installation: runningInstallation });
    cy.wait('@savedSetup');
    sendProgress({ ...failedInstallation, error: { code: 'NO_ANSWER', message: null } });
    answerSetup({ body: legacySetup });
    cy.get('[data-cy=z2m-wizard-retry]').click();
    cy.wait('@setup')
      .its('request.body')
      .should('include', { ZIGBEE_DONGLE_NAME: `${ZBDONGLE_E} (legacy ezsp)` });
  });

  it('should not tell the machine incompatible while its status cannot be read', () => {
    const serverUrl = Cypress.env('serverUrl');
    visitWizard();
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { statusCode: 500 });
    cy.reload();
    cy.get('[data-cy=z2m-wizard-status-error]').i18n('integration.zigbee2mqtt.setup.errorLoadingStatesLabel');
    cy.get('[data-cy=z2m-wizard-incompatible]').should('not.exist');
    // Told by the server later: the wizard shows up
    cy.waitForWebSocket();
    sendStatus(readyToSetupStatus);
    cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
  });

  it('should wait for the integration to start instead of telling the machine incompatible', () => {
    // Before init read the configuration: Docker not checked yet
    visitWizard({ status: { ...readyToSetupStatus, configured: null, dockerBased: false, networkModeValid: false } });
    cy.get('[data-cy=z2m-wizard-status-pending]').i18n('integration.zigbee2mqtt.setup.wizard.statusPending');
    cy.get('[data-cy=z2m-wizard-incompatible]').should('not.exist');
    sendStatus({ ...readyToSetupStatus, configured: false });
    cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
  });

  it('should tell that a Zigbee2mqtt that runs elsewhere is too old to be followed', () => {
    visitWizard({ ports: [[machinePort]] });
    cy.get('[data-cy=z2m-wizard-show-external]').click();
    cy.get('[data-cy=z2m-wizard-mqttUrl]').type('mqtt://192.168.1.10:1883');
    answerSetup({ body: { Z2M_MQTT_MODE: 'external', Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883' } });
    install();
    cy.wait('@setup');
    const connectedInstallation = { ...doneInstallation, phases: phases({ connect_adapter: 'done' }) };
    sendProgress(connectedInstallation);
    // It tells its version, but never answers the health check
    sendStatus({
      ...readyToSetupStatus,
      installation: connectedInstallation,
      gladysConnected: true,
      z2mVersion: '1.20.0'
    });
    cy.get('[data-cy=z2m-wizard-waiting-zigbee2mqtt]').should('contain', '1.20.0');
    cy.get('[data-cy=z2m-wizard-ready]').should('not.exist');
    // The broker lost meanwhile: told, with why
    sendStatus({
      ...readyToSetupStatus,
      installation: connectedInstallation,
      gladysConnected: false,
      mqttConnectionError: { code: 'BROKER_UNREACHABLE', message: 'connect ECONNREFUSED 192.168.1.10:1883' }
    });
    cy.get('[data-cy=z2m-wizard-broker-lost]').should('contain', 'ECONNREFUSED');
  });

  it('should go back to the dongle, chosen by hand, to change the model after a failure', () => {
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendProgress(failedInstallation);
    cy.get('[data-cy=z2m-wizard-change-key]').click();
    cy.get('[data-cy=z2m-wizard-manual]').should('exist');
    cy.get('[data-cy=z2m-wizard-port]').should('have.value', zbDongleE.stablePath);
    cy.get('[data-cy=z2m-wizard-model-option][aria-pressed=true]').should('contain', 'Zigbee 3.0 USB Dongle Plus-E');
  });

  it('should stay on the dongle and tell that it is not plugged in when the setup refuses it', () => {
    visitWizard();
    answerSetup({ statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' } });
    install();
    cy.wait('@setup');
    cy.get('[data-cy=z2m-wizard-save-error]').i18n('integration.zigbee2mqtt.setup.wizard.saveDongleNotFound');
    cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
  });

  it('should tell that an installation already runs when the setup is refused', () => {
    visitWizard();
    answerSetup({ statusCode: 409, body: { status: 409, code: 'CONFLICT' } });
    install();
    cy.wait('@setup');
    cy.get('[data-cy=z2m-wizard-save-conflict]').i18n('integration.zigbee2mqtt.setup.installation.alreadyRunning');
  });

  it('should tell that Gladys switches to the ezsp driver during the installation', () => {
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendStatus({ ...readyToSetupStatus, ezspFallback: true, installation: runningInstallation });
    cy.get('[data-cy=z2m-wizard-ezsp-note]').should('exist');
  });

  describe('downloads in the background', () => {
    const notEnoughDiskSpace = {
      state: 'failed',
      progress: 0,
      freeBytes: 120400000,
      neededBytes: 236700000,
      error: { code: 'NOT_ENOUGH_DISK_SPACE', message: 'Not enough disk space' }
    };
    const idleInstallation = readyToSetupStatus.installation;
    const { prefetch } = readyToSetupStatus;

    // Translation with its fields replaced
    const i18nText = (key, fields) =>
      Object.keys(fields).reduce(
        (text, field) => text.replace(`{{${field}}}`, fields[field]),
        Cypress._.get(Cypress.env('i18n'), key)
      );

    it('should not download as the page opens without dongle, but once a network coordinator is entered', () => {
      visitWizard({ ports: [[machinePort]] });
      cy.get('[data-cy=z2m-wizard-key-none]').should('exist');
      cy.get('[data-cy=z2m-wizard-show-network]').click();
      cy.get('@prefetch.all').should('have.length', 0);
      cy.get('[data-cy=z2m-wizard-network-url]').type('tcp://192.168.1.20:6638');
      cy.wait('@prefetch');
    });

    it('should download once the server tells that it runs in Docker, and only once', () => {
      const askedWhileDocker = [];
      let docker = false;
      visitWizard({
        status: { ...readyToSetupStatus, dockerBased: false, networkModeValid: false },
        prefetchResponse: req => {
          askedWhileDocker.push(docker);
          req.reply({ body: prefetch });
        }
      });
      // Gladys cannot install it yet: nothing is downloaded
      cy.get('[data-cy=z2m-wizard-incompatible]').should('exist');
      cy.then(() => {
        docker = true;
      });
      sendStatus({ ...readyToSetupStatus, installation: idleInstallation });
      cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
      cy.wait('@prefetch');
      sendStatus({ ...readyToSetupStatus, installation: idleInstallation });
      cy.get('[data-cy=z2m-wizard-show-manual]').click();
      cy.wrap(askedWhileDocker).should('deep.equal', [true]);
    });

    it('should tell how far the download is, until the installation starts', () => {
      visitWizard({ prefetchResponse: { ...prefetch, state: 'running', progress: 64 } });
      cy.wait('@prefetch');
      cy.get('[data-cy=z2m-prefetch-status]').should(
        'have.text',
        i18nText('integration.zigbee2mqtt.setup.prefetch.running', { progress: 64 })
      );
      sendProgress(idleInstallation);
      cy.sendWebSocket({
        type: 'zigbee2mqtt.install-progress',
        payload: { installation: idleInstallation, prefetch: { ...prefetch, state: 'done', progress: 100 } }
      });
      cy.get('[data-cy=z2m-prefetch-status]').i18n('integration.zigbee2mqtt.setup.prefetch.done');

      answerSetup();
      cy.get('[data-cy=z2m-wizard-install]').click();
      cy.wait('@setup');
      cy.get('[data-cy=z2m-prefetch-status]').should('not.exist');
    });

    it('should warn that the disk space is missing, without preventing the installation', () => {
      visitWizard({ prefetchResponse: notEnoughDiskSpace });
      cy.wait('@prefetch');
      cy.get('[data-cy=z2m-prefetch-disk-space]').should(
        'have.text',
        i18nText('integration.zigbee2mqtt.setup.prefetch.notEnoughDiskSpace', { free: 120, needed: 237 })
      );
      cy.get('[data-cy=z2m-wizard-install]').should('not.be.disabled');
    });
  });
});
