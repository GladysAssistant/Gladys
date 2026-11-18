import {
  readyToSetupStatus,
  machinePort,
  zbDongleE,
  zbDongleP,
  unknownDongle,
  ZBDONGLE_E,
  phases,
  runningInstallation,
  failedInstallation,
  doneInstallation,
  sendProgress,
  sendStatus,
  answerSetup,
  visitWizard
} from './wizardFixtures';

// The setup wizard on a phone (docs/specs/zigbee2mqtt-installation.md, M.3)
describe('Zigbee2mqtt setup wizard on a phone', () => {
  const install = () => {
    cy.get('[data-cy=z2m-wizard-install]')
      .should('not.be.disabled')
      .click();
  };

  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  it('should install the recognized dongle from the bottom bar, then permit joining', () => {
    const serverUrl = Cypress.env('serverUrl');
    visitWizard();
    // A focus page: its own navigation bar leads back to the integrations
    cy.get('[data-cy=z2m-wizard-mobile]').should('exist');
    cy.get('[data-cy=mobile-nav-back]').should('have.attr', 'href');
    cy.get('[data-cy=mobile-steps-label]').should('contain', '1');
    cy.get('[data-cy=z2m-wizard-key-one]').within(() => {
      cy.get('[data-cy=z2m-wizard-key-name]').should('have.text', 'SONOFF Zigbee 3.0 USB Dongle Plus-E');
    });
    answerSetup();
    cy.get('[data-cy=z2m-wizard-bottom-bar]').within(() => install());
    cy.wait('@setup')
      .its('request.body')
      .should('include', { ZIGBEE2MQTT_DRIVER_PATH: zbDongleE.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_E });

    sendProgress(runningInstallation);
    cy.get('[data-cy=z2m-wizard-progress]').should('have.text', '64 %');
    cy.get('[data-cy=z2m-wizard-current-phase]').i18n('integration.zigbee2mqtt.setup.installation.phases.start_z2m');
    // Nothing to do while the installation runs
    cy.get('[data-cy=z2m-wizard-bottom-bar]').should('not.exist');

    sendStatus({
      ...readyToSetupStatus,
      installation: runningInstallation,
      zigbee2mqttConnected: true,
      coordinatorFirmware: { revision: '7.4.4.0' }
    });
    sendProgress(doneInstallation);
    cy.get('[data-cy=z2m-wizard-ready]').should('exist');
    cy.get('[data-cy=z2m-wizard-summary-firmware]').should('contain', '7.4.4.0');

    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/permit_join` }, { body: {} }).as(
      'permitJoin'
    );
    cy.get('[data-cy=z2m-wizard-pair]').click();
    cy.get('[data-cy=z2m-wizard-allow-joining]').click();
    cy.wait('@permitJoin')
      .its('request.body')
      .should('deep.equal', { value: true });
    cy.get('[data-cy=z2m-wizard-permit-join-allowed]').should('exist');
    cy.get('[data-cy=z2m-wizard-go-to-discover]').should(
      'have.attr',
      'href',
      '/dashboard/integration/device/zigbee2mqtt/discover'
    );
  });

  it('should choose the dongle by hand from the other choices, its port in a sheet', () => {
    visitWizard({ ports: [[machinePort, zbDongleE, unknownDongle]] });
    cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
    cy.get('[data-cy=z2m-wizard-other-choices]').click();
    cy.get('[data-cy=z2m-wizard-show-manual]').click();
    cy.get('[data-cy=z2m-wizard-manual]').should('exist');
    // Starts from the detected dongle
    cy.get('[data-cy=z2m-wizard-port-row]').should('contain', zbDongleE.name);
    cy.get('[data-cy=z2m-wizard-port-row]').click();
    cy.get('[data-cy=z2m-wizard-port-option]').should('have.length', 2);
    cy.get('[data-cy=z2m-wizard-port-option]')
      .contains(unknownDongle.name)
      .click();
    cy.get('[data-cy=z2m-wizard-port-row]').should('contain', unknownDongle.name);
    cy.get('[data-cy=z2m-wizard-model-search]').type('dongle-e');
    cy.get('[data-cy=z2m-wizard-model-option]').click();
    answerSetup();
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', { ZIGBEE2MQTT_DRIVER_PATH: unknownDongle.stablePath, ZIGBEE_DONGLE_NAME: ZBDONGLE_E });
  });

  it('should tell several dongles apart by their port', () => {
    visitWizard({ ports: [[zbDongleE, zbDongleP]] });
    cy.get('[data-cy=z2m-wizard-key-several]').should('exist');
    cy.get('[data-cy=z2m-wizard-key-card]')
      .should('have.length', 2)
      .first()
      .should('contain', zbDongleE.path);
  });

  it('should go back to the detected dongle from another choice', () => {
    visitWizard();
    cy.get('[data-cy=z2m-wizard-other-choices]').click();
    cy.get('[data-cy=z2m-wizard-show-network]').click();
    cy.get('[data-cy=z2m-wizard-network]').should('exist');
    cy.get('[data-cy=z2m-wizard-show-auto]').click();
    cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
  });

  it('should wait for a dongle without a bottom bar, and show it once plugged in', () => {
    visitWizard({ ports: [[machinePort], [machinePort, zbDongleE]] });
    cy.get('[data-cy=z2m-wizard-key-none]').should('exist');
    cy.get('[data-cy=z2m-wizard-bottom-bar]').should('not.exist');
    cy.get('[data-cy=z2m-wizard-just-plugged]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy=z2m-wizard-install]').should('not.be.disabled');
  });

  it('should install a network coordinator, its type chosen as a row', () => {
    visitWizard({ ports: [[machinePort]] });
    cy.get('[data-cy=z2m-wizard-other-choices]').click();
    cy.get('[data-cy=z2m-wizard-show-network]').click();
    cy.get('[data-cy=z2m-wizard-install]').should('be.disabled');
    cy.get('[data-cy=z2m-wizard-network-url]').type('tcp://192.168.1.20:6638');
    cy.get('[data-cy=z2m-wizard-network-type-row]')
      .first()
      .click();
    answerSetup({ body: { Z2M_ADAPTER_MODE: 'network', Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638' } });
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', {
        Z2M_ADAPTER_MODE: 'network',
        Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
        Z2M_NETWORK_ADAPTER_TYPE: 'ember'
      });
    // Switched to ezsp by Gladys: told once the network is ready
    answerSetup({
      body: {
        Z2M_ADAPTER_MODE: 'network',
        Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
        Z2M_NETWORK_ADAPTER_TYPE: 'ezsp'
      }
    });
    sendStatus({ ...readyToSetupStatus, ezspFallback: true, installation: runningInstallation });
    sendStatus({
      ...readyToSetupStatus,
      ezspFallback: true,
      installation: doneInstallation,
      zigbee2mqttConnected: true
    });
    sendProgress(doneInstallation);
    cy.get('[data-cy=z2m-wizard-ready-ezsp]').should('exist');
  });

  it('should connect to a Zigbee2mqtt that runs elsewhere', () => {
    visitWizard({ ports: [[machinePort]] });
    cy.get('[data-cy=z2m-wizard-other-choices]').click();
    cy.get('[data-cy=z2m-wizard-show-external]').click();
    cy.get('[data-cy=z2m-wizard-mqttUrl]').type('mqtt://192.168.1.10:1883');
    answerSetup({ body: { Z2M_MQTT_MODE: 'external', Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883' } });
    cy.get('[data-cy=z2m-wizard-install]').i18n('integration.zigbee2mqtt.setup.wizard.connect');
    install();
    cy.wait('@setup')
      .its('request.body')
      .should('include', { Z2M_MQTT_MODE: 'external', Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883' });
    sendProgress({ ...runningInstallation, phases: phases({ connect_adapter: 'running' }) });
    cy.get('[data-cy=z2m-wizard-current-phase]').i18n(
      'integration.zigbee2mqtt.setup.wizard.progress.phases.connectExternal'
    );
    // Connected to the broker, Zigbee2mqtt not heard on it yet
    sendProgress({ ...doneInstallation, phases: phases({ connect_adapter: 'done' }) });
    cy.get('[data-cy=z2m-wizard-waiting-zigbee2mqtt]').should('exist');
    cy.get('[data-cy=z2m-wizard-bottom-bar]').within(() => {
      cy.get('[data-cy=z2m-wizard-change-key]').click();
    });
    cy.get('[data-cy=z2m-wizard-mqttUrl]').should('have.value', 'mqtt://192.168.1.10:1883');
  });

  it('should only offer a Zigbee2mqtt that runs elsewhere when Gladys cannot install it', () => {
    visitWizard({ status: { ...readyToSetupStatus, networkModeValid: false } });
    cy.get('[data-cy=z2m-wizard-incompatible]').should('exist');
    cy.get('[data-cy=z2m-wizard-use-external]').click();
    cy.get('[data-cy=z2m-wizard-external]').should('exist');
  });

  it('should tell why the installation failed, with retry and change in the bottom bar', () => {
    visitWizard();
    answerSetup();
    install();
    cy.wait('@setup');
    sendProgress(failedInstallation);
    cy.get('[data-cy=z2m-wizard-failure-title]').i18n(
      'integration.zigbee2mqtt.setup.wizard.failure.titles.ADAPTER_NO_RESPONSE'
    );
    cy.get('[data-cy=z2m-wizard-bottom-bar]').within(() => {
      cy.get('[data-cy=z2m-wizard-retry]').should('exist');
      cy.get('[data-cy=z2m-wizard-change-key]').click();
    });
    cy.get('[data-cy=z2m-wizard-manual]').should('exist');
    cy.get('[data-cy=z2m-wizard-model-option][aria-pressed=true]').should('contain', 'Zigbee 3.0 USB Dongle Plus-E');
  });

  it('should tell in the bottom bar that the dongle is not plugged in, until closed', () => {
    visitWizard();
    answerSetup({ statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' } });
    install();
    cy.wait('@setup');
    cy.get('[data-cy=mobile-bottom-bar-error]').i18n('integration.zigbee2mqtt.setup.wizard.saveDongleNotFound');
    cy.get('[data-cy=mobile-bottom-bar-error] button').click();
    cy.get('[data-cy=mobile-bottom-bar-error]').should('not.exist');
    cy.get('[data-cy=z2m-wizard-key-one]').should('exist');
  });

  it('should keep the dongle chosen when the screen crosses the phone breakpoint', () => {
    visitWizard({ ports: [[unknownDongle]] });
    cy.get('[data-cy=z2m-wizard-model-search]').type('dongle-e');
    cy.get('[data-cy=z2m-wizard-model-option]').click();
    cy.viewport(1200, 900);
    cy.get('[data-cy=z2m-wizard-mobile]').should('not.exist');
    cy.get('[data-cy=z2m-wizard-model-option][aria-pressed=true]').should('contain', 'Zigbee 3.0 USB Dongle Plus-E');
    cy.get('[data-cy=z2m-wizard-install]').should('not.be.disabled');
  });
});
