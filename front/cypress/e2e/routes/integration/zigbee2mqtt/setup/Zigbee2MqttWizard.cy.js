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
    sendProgress({ ...doneInstallation, phases: phases({ connect_adapter: 'done' }) });
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
});
