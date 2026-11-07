describe('Zigbee2mqtt installation progress', () => {
  // Nothing configured yet, as in status_ready_to_setup.json
  const readyToSetupStatus = {
    usbConfigured: false,
    networkAdapterConfigured: false,
    mqttExist: false,
    mqttRunning: false,
    zigbee2mqttExist: false,
    zigbee2mqttRunning: false,
    gladysConnected: false,
    zigbee2mqttConnected: false,
    z2mEnabled: false,
    dockerBased: true,
    networkModeValid: true
  };
  const prefetch = { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null };
  const phases = states => Object.keys(states).map(key => ({ key, state: states[key], progress: 0 }));
  // The broker is started, Zigbee2mqtt is being downloaded
  const runningInstallation = {
    state: 'running',
    kind: 'install',
    phases: phases({
      pull_z2m: 'running',
      pull_mqtt: 'done',
      start_mqtt: 'done',
      start_z2m: 'pending',
      connect_adapter: 'pending'
    }),
    progress: 42,
    error: null,
    durationMs: null
  };
  // Zigbee2mqtt started but gets no answer from the dongle
  const failedInstallation = {
    ...runningInstallation,
    state: 'failed',
    phases: phases({
      pull_z2m: 'done',
      pull_mqtt: 'done',
      start_mqtt: 'done',
      start_z2m: 'done',
      connect_adapter: 'failed'
    }),
    progress: 80,
    error: { code: 'ADAPTER_NO_RESPONSE', message: null },
    durationMs: 154000
  };

  const visitSetup = status => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { body: status }).as(
      'status'
    );
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: {} });
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  };

  beforeEach(() => {
    cy.login();
  });

  it('should show the progress of a running installation', () => {
    visitSetup({ ...readyToSetupStatus, installation: runningInstallation, prefetch });

    cy.get('[data-cy=z2m-installation-progress]').i18n('integration.zigbee2mqtt.setup.installation.titles.install');
    cy.get('[data-cy=z2m-installation-progress-bar]').should('have.attr', 'aria-valuenow', '42');
    cy.get('[data-cy=z2m-installation-phase]').i18n('integration.zigbee2mqtt.setup.installation.phases.pull_z2m');
    cy.get('[data-cy=z2m-installation-progress]').i18n('integration.zigbee2mqtt.setup.installation.leavePage');
    cy.get('[data-cy=z2m-installation-error]').should('not.exist');
  });

  it('should explain why the installation failed', () => {
    visitSetup({ ...readyToSetupStatus, installation: failedInstallation, prefetch });

    cy.get('[data-cy=z2m-installation-error]').i18n(
      'integration.zigbee2mqtt.setup.modes.local.containerErrors.ADAPTER_NO_RESPONSE'
    );
    cy.get('[data-cy=z2m-installation-failed-phase]').i18n(
      'integration.zigbee2mqtt.setup.installation.phases.connect_adapter'
    );
    cy.get('[data-cy=z2m-installation-progress-bar]').should('not.exist');
  });

  it('should name the next phase between two phases', () => {
    const betweenPhases = {
      ...runningInstallation,
      phases: phases({
        pull_z2m: 'done',
        pull_mqtt: 'done',
        start_mqtt: 'done',
        start_z2m: 'pending',
        connect_adapter: 'pending'
      })
    };
    visitSetup({ ...readyToSetupStatus, installation: betweenPhases, prefetch });

    cy.get('[data-cy=z2m-installation-phase]').i18n('integration.zigbee2mqtt.setup.installation.phases.start_z2m');
  });

  it('should not repeat an error already shown by the status', () => {
    visitSetup({
      ...readyToSetupStatus,
      installation: failedInstallation,
      prefetch,
      z2mContainerError: { code: 'ADAPTER_NO_RESPONSE', message: null }
    });

    cy.get('[data-cy=z2m-installation-failed-phase]').i18n(
      'integration.zigbee2mqtt.setup.installation.phases.connect_adapter'
    );
    cy.get('[data-cy=z2m-installation-error-message]').should('not.exist');
  });

  it('should follow the installation through its progress messages', () => {
    // No installation in the status, like in the demo mode
    visitSetup(readyToSetupStatus);
    cy.wait('@status');
    cy.get('[data-cy=z2m-running-status]').should('exist');
    cy.get('[data-cy=z2m-installation-progress]').should('not.exist');

    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: { ...runningInstallation, kind: 'switch' }, prefetch }
    });
    cy.get('[data-cy=z2m-installation-progress]').i18n('integration.zigbee2mqtt.setup.installation.titles.switch');
    cy.get('[data-cy=z2m-installation-phase]').i18n('integration.zigbee2mqtt.setup.installation.phases.pull_z2m');

    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: { ...failedInstallation, error: { code: 'NO_ANSWER', message: null } }, prefetch }
    });
    cy.get('[data-cy=z2m-installation-error]').i18n('integration.zigbee2mqtt.setup.installation.errors.NO_ANSWER');

    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: { ...runningInstallation, state: 'done', progress: 100 }, prefetch }
    });
    cy.get('[data-cy=z2m-installation-progress]').should('not.exist');
  });

  it('should tell that an installation is already running when saving the configuration', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port` },
      { fixture: 'integration/routes/integration/zigbee2mqtt/get_usb_ports_detected.json' }
    ).as('usbPorts');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { statusCode: 409 }).as(
      'setup'
    );
    visitSetup(readyToSetupStatus);

    // The recognized dongle and its model are preselected
    cy.get('[data-cy=z2m-setup-local-panel]').within(() => {
      cy.get('button').click();
    });
    cy.wait('@usbPorts');
    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@setup');

    cy.get('[data-cy=z2m-setup-save-conflict]').i18n('integration.zigbee2mqtt.setup.installation.alreadyRunning');
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');
  });
});
