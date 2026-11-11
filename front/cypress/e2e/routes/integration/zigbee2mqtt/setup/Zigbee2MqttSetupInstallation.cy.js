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

  const doneInstallation = { ...runningInstallation, state: 'done', progress: 100 };
  // The dongle is saved, but not yet the port of the interface nor the MQTT credentials, saved at the end
  const localSetup = {
    Z2M_MQTT_MODE: 'local',
    Z2M_ADAPTER_MODE: 'usb',
    ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
    ZIGBEE_DONGLE_NAME: 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P'
  };

  const idleInstallation = { state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null };
  const notEnoughDiskSpace = {
    state: 'failed',
    progress: 0,
    freeBytes: 120400000,
    neededBytes: 236700000,
    error: { code: 'NOT_ENOUGH_DISK_SPACE', message: 'Not enough disk space' }
  };

  const visitSetup = (status, { setup = {}, prefetchResponse = prefetch, statusDelay = 0 } = {}) => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: status, delay: statusDelay }
    ).as('status');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: setup }).as('config');
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/prefetch` },
      // Or a handler of the request
      typeof prefetchResponse === 'function' ? prefetchResponse : { body: prefetchResponse }
    ).as('prefetch');
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  };

  // The recognized dongle and its model are preselected
  const chooseLocalMode = () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port` },
      { fixture: 'integration/routes/integration/zigbee2mqtt/get_usb_ports_detected.json' }
    ).as('usbPorts');
    cy.get('[data-cy=z2m-setup-local-panel]').within(() => {
      cy.get('button').click();
    });
    cy.wait('@usbPorts');
  };

  // Translation with its fields replaced
  const i18nText = (key, fields) =>
    Object.keys(fields).reduce(
      (text, field) => text.replace(`{{${field}}}`, fields[field]),
      Cypress._.get(Cypress.env('i18n'), key)
    );

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

  it('should name the running phase rather than a pending one above it', () => {
    // Zigbee2mqtt is downloaded after the broker is started
    const startingBroker = {
      ...runningInstallation,
      phases: phases({
        pull_z2m: 'pending',
        pull_mqtt: 'done',
        start_mqtt: 'running',
        start_z2m: 'pending',
        connect_adapter: 'pending'
      })
    };
    visitSetup({ ...readyToSetupStatus, installation: startingBroker, prefetch });

    cy.get('[data-cy=z2m-installation-phase]').i18n('integration.zigbee2mqtt.setup.installation.phases.start_mqtt');
  });

  it('should not show the failure once Zigbee2mqtt answers', () => {
    // Restarted by Docker after the failure
    visitSetup({
      ...readyToSetupStatus,
      gladysConnected: true,
      zigbee2mqttConnected: true,
      installation: failedInstallation,
      prefetch
    });

    // Shown once the status is loaded, like the progress of the installation
    cy.get('[data-cy=z2m-setup-local-panel]').should('exist');
    cy.get('[data-cy=z2m-installation-progress]').should('not.exist');
  });

  it('should disable the controls while an installation is running', () => {
    visitSetup(
      { ...readyToSetupStatus, usbConfigured: true, installation: runningInstallation, prefetch },
      { setup: localSetup }
    );

    cy.get('[data-cy=z2m-installation-progress]').should('exist');
    cy.get('#enableZigbee2mqtt').should('be.disabled');
    cy.get('[data-cy=z2m-reset-button]').should('be.disabled');
    cy.get('[data-cy=z2m-setup-local-summary] button').should('be.disabled');

    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: doneInstallation, prefetch }
    });
    cy.get('#enableZigbee2mqtt').should('not.be.disabled');
    cy.get('[data-cy=z2m-reset-button]').should('not.be.disabled');
    cy.get('[data-cy=z2m-setup-local-summary] button').should('not.be.disabled');
  });

  it('should reload the configuration once the installation is over', () => {
    const serverUrl = Cypress.env('serverUrl');
    visitSetup(
      { ...readyToSetupStatus, usbConfigured: true, installation: runningInstallation, prefetch },
      { setup: localSetup }
    );
    cy.wait('@config');
    cy.get('[data-cy=z2m-mqtt-external-credentials-pending]').should('exist');

    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` },
      {
        body: {
          ...localSetup,
          Z2M_TCP_PORT: '12000',
          GLADYS_MQTT_USERNAME: 'gladys',
          GLADYS_MQTT_PASSWORD: 'generated-password'
        }
      }
    ).as('configAfterInstallation');
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: doneInstallation, prefetch }
    });
    cy.wait('@configAfterInstallation');

    cy.get('[data-cy=z2m-mqtt-external-credentials]').should('exist');
    cy.get('a[href$=":12000"]').should('exist');
  });

  it('should keep the saved configuration when a load sent before the save answers after it', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: localSetup }).as(
      'setup'
    );
    visitSetup({ ...readyToSetupStatus, installation: runningInstallation, prefetch });
    cy.get('[data-cy=z2m-installation-progress]').should('exist');
    // Loaded after the status
    cy.wait('@config');

    // The load at the end of the installation, read before the save, answers after it
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { delay: 3000, body: {} }).as(
      'configReload'
    );
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: doneInstallation, prefetch }
    });
    chooseLocalMode();
    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@setup');
    cy.get('[data-cy=z2m-setup-local-summary]').should('exist');
    cy.wait('@configReload');

    cy.get('[data-cy=z2m-setup-local-summary]').should('exist');
    cy.get('[data-cy=z2m-setup-local-panel]').should('not.exist');
  });

  it('should keep the end of an installation received before the status, read while it was running', () => {
    visitSetup(
      { ...readyToSetupStatus, usbConfigured: true, installation: runningInstallation, prefetch },
      // Long enough for the message and the check that the configuration is not read meanwhile
      { setup: localSetup, statusDelay: 5000 }
    );
    cy.waitForWebSocket();
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: doneInstallation, prefetch }
    });
    // Read after the status, the configuration is the one saved by the installation
    cy.get('@config.all').should('have.length', 0);
    cy.wait('@status');
    cy.wait('@config');

    cy.get('#enableZigbee2mqtt').should('not.be.disabled');
    cy.get('[data-cy=z2m-reset-button]').should('not.be.disabled');
    cy.get('[data-cy=z2m-setup-local-summary] button').should('not.be.disabled');
    cy.get('[data-cy=z2m-installation-progress]').should('not.exist');
  });

  it('should download the images in the background once the server tells it runs in Docker', () => {
    // Whether the server told it runs in Docker when each download was asked
    const toldDockerWhenAsked = [];
    let toldDocker = false;
    // Gladys just restarted: the integration has not started yet
    visitSetup(
      { ...readyToSetupStatus, dockerBased: false, networkModeValid: false },
      {
        prefetchResponse: req => {
          toldDockerWhenAsked.push(toldDocker);
          req.reply({ body: prefetch });
        }
      }
    );
    // Shown once the status and the configuration are loaded, when the page would have asked for the download
    cy.get('[data-cy=z2m-setup-local-panel] button').should('be.disabled');

    cy.then(() => {
      toldDocker = true;
    });
    cy.sendWebSocket({
      type: 'zigbee2mqtt.status-change',
      payload: { ...readyToSetupStatus, installation: idleInstallation, prefetch }
    });
    cy.wait('@prefetch');
    cy.sendWebSocket({
      type: 'zigbee2mqtt.status-change',
      payload: { ...readyToSetupStatus, installation: idleInstallation, prefetch }
    });
    // Asks for the USB ports, after the page would have asked for the download again
    chooseLocalMode();

    cy.wrap(toldDockerWhenAsked).should('deep.equal', [true]);
  });

  it('should tell that the disk space is missing to download Zigbee2mqtt', () => {
    const notEnoughDiskSpaceInstallation = {
      ...failedInstallation,
      phases: phases({
        pull_z2m: 'failed',
        pull_mqtt: 'done',
        start_mqtt: 'done',
        start_z2m: 'pending',
        connect_adapter: 'pending'
      }),
      progress: 20,
      error: { code: 'NOT_ENOUGH_DISK_SPACE', message: 'Not enough disk space' }
    };
    visitSetup({ ...readyToSetupStatus, installation: notEnoughDiskSpaceInstallation, prefetch });

    cy.get('[data-cy=z2m-installation-failed-phase]').i18n(
      'integration.zigbee2mqtt.setup.installation.phases.pull_z2m'
    );
    cy.get('[data-cy=z2m-installation-error-message]').i18n(
      'integration.zigbee2mqtt.setup.installation.errors.NOT_ENOUGH_DISK_SPACE'
    );
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
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { statusCode: 409 }).as(
      'setup'
    );
    visitSetup(readyToSetupStatus);

    chooseLocalMode();
    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@setup');

    cy.get('[data-cy=z2m-setup-save-conflict]').i18n('integration.zigbee2mqtt.setup.installation.alreadyRunning');
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');

    // The warning lasts as long as the installation
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: runningInstallation, prefetch }
    });
    cy.get('[data-cy=z2m-installation-progress]').should('exist');
    cy.get('[data-cy=z2m-setup-save-conflict]').should('exist');
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: doneInstallation, prefetch }
    });
    cy.get('[data-cy=z2m-installation-progress]').should('not.exist');
    cy.get('[data-cy=z2m-setup-save-conflict]').should('not.exist');
  });

  it('should download the images in the background when nothing is configured', () => {
    visitSetup(readyToSetupStatus);

    cy.wait('@prefetch');
  });

  it('should not download the images in the background once a dongle is configured', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port` },
      { fixture: 'integration/routes/integration/zigbee2mqtt/get_usb_ports_detected.json' }
    ).as('usbPorts');
    visitSetup(
      // Downloaded before the dongle was configured
      { ...readyToSetupStatus, usbConfigured: true, prefetch: { ...prefetch, state: 'done', progress: 100 } },
      {
        setup: {
          ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
          ZIGBEE_DONGLE_NAME: 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
          Z2M_MQTT_MODE: 'local'
        }
      }
    );

    // Editing the configuration asks for the USB ports, after the page would have asked for the download
    cy.get('[data-cy=z2m-setup-local-summary] button').click();
    cy.wait('@usbPorts');

    cy.get('@prefetch.all').should('have.length', 0);
    cy.get('[data-cy=z2m-prefetch-status]').should('not.exist');
  });

  it('should tell how far the download in the background is, until the installation starts', () => {
    visitSetup(readyToSetupStatus, { prefetchResponse: { ...prefetch, state: 'running', progress: 64 } });
    cy.wait('@prefetch');
    chooseLocalMode();

    cy.get('[data-cy=z2m-prefetch-status]').should(
      'have.text',
      i18nText('integration.zigbee2mqtt.setup.prefetch.running', { progress: 64 })
    );

    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: idleInstallation, prefetch: { ...prefetch, state: 'done', progress: 100 } }
    });
    cy.get('[data-cy=z2m-prefetch-status]').i18n('integration.zigbee2mqtt.setup.prefetch.done');

    // The progress of the installation takes over
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: runningInstallation, prefetch: { ...prefetch, state: 'done', progress: 100 } }
    });
    cy.get('[data-cy=z2m-installation-progress]').should('exist');
    cy.get('[data-cy=z2m-prefetch-status]').should('not.exist');
  });

  it('should warn that the disk space is missing, without preventing the installation', () => {
    visitSetup(readyToSetupStatus, { prefetchResponse: notEnoughDiskSpace });
    cy.wait('@prefetch');
    chooseLocalMode();

    cy.get('[data-cy=z2m-prefetch-disk-space]').should(
      'have.text',
      i18nText('integration.zigbee2mqtt.setup.prefetch.notEnoughDiskSpace', { free: 120, needed: 237 })
    );
    cy.get('[data-cy=z2m-prefetch-status]').should('not.exist');
    cy.get('[data-cy=z2m-setup-save]').should('not.be.disabled');

    // Without the free space, the figures are left out
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: idleInstallation, prefetch: { ...notEnoughDiskSpace, freeBytes: null } }
    });
    cy.get('[data-cy=z2m-prefetch-disk-space]').should(
      'have.text',
      i18nText('integration.zigbee2mqtt.setup.prefetch.notEnoughDiskSpaceNoFigures', {})
    );
  });
});
