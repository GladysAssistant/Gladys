describe('Zigbee2mqtt USB dongle', () => {
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
    networkModeValid: true,
    prefetch: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null }
  };
  const LINK = 'usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_8e73883472d9ee11bb48b74c37b89984-if00-port0';
  const ZBDONGLE_E = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';
  const machinePort = { path: '/dev/ttyS0', stablePath: '/dev/ttyS0', name: null, adapter: null };
  const zbDongleE = {
    path: '/dev/ttyUSB0',
    stablePath: `/dev/serial/by-id/${LINK}`,
    name: 'Itead Sonoff Zigbee 3.0 USB Dongle Plus V2',
    pnpId: LINK,
    adapter: ZBDONGLE_E
  };

  const visitSetup = (status, setup = {}, { statusDelay = 0 } = {}) => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` },
      { body: status, delay: statusDelay }
    ).as('status');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: setup });
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/prefetch` },
      { body: readyToSetupStatus.prefetch }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  };

  // The ports listed by the server, one list after the other, the last one again
  const listPorts = (...lists) => {
    const serverUrl = Cypress.env('serverUrl');
    let request = 0;
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port` }, req => {
      req.reply({ body: lists[Math.min(request, lists.length - 1)] });
      request += 1;
    }).as('usbPorts');
  };

  // A first installation goes through the wizard (Zigbee2MqttWizard.cy.js): the form changes a configured dongle
  const visitConfigured = () =>
    visitSetup(
      { ...readyToSetupStatus, usbConfigured: true, z2mEnabled: true },
      {
        Z2M_MQTT_MODE: 'local',
        Z2M_ADAPTER_MODE: 'usb',
        ZIGBEE2MQTT_DRIVER_PATH: `/dev/serial/by-id/${LINK}`,
        ZIGBEE_DONGLE_NAME: ZBDONGLE_E
      }
    );

  const openLocalForm = () => {
    cy.get('[data-cy=z2m-setup-local-summary]')
      .find('button')
      .click();
    cy.wait('@usbPorts');
  };

  // The ports asked by the form, counted as they come, answered one after the other, the last answer again
  const countPortRequests = (...replies) => {
    const serverUrl = Cypress.env('serverUrl');
    const requests = { count: 0 };
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port` }, req => {
      req.reply(replies[Math.min(requests.count, replies.length - 1)]);
      requests.count += 1;
    }).as('usbPorts');
    return requests;
  };

  // The form plans to ask the ports again once it loaded them and the models (from the server itself, slower on CI): the
  // configured dongle is shown before
  const waitForFormLoaded = () => {
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', ZBDONGLE_E);
    cy.get('[data-cy=z2m-setup-local-usb-field] .react-select__loading-indicator').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-dongle-field] .react-select__loading-indicator').should('not.exist');
  };

  // The clock of the page goes forward a second at a time, one command after the other so that the page answers in
  // between, until `done` (given the time gone by), two minutes at most; yields that time
  const tickUntil = (done, ticked = 0) =>
    cy.then(() => {
      if (done(ticked) || ticked >= 120000) {
        return ticked;
      }
      cy.tick(1000);
      return tickUntil(done, ticked + 1000);
    });

  beforeEach(() => {
    cy.login();
  });

  it('should ask the ports again less often after a failure', () => {
    const requests = countPortRequests({ body: [zbDongleE] }, { statusCode: 500, body: {} });
    cy.clock();
    visitConfigured();
    openLocalForm();
    waitForFormLoaded();

    // The list asked 3 s later fails, the next one is asked 30 s after it, not 3 s
    let failedAt = null;
    tickUntil(ticked => {
      if (requests.count === 2 && failedAt === null) {
        failedAt = ticked;
      }
      return requests.count >= 3;
    }).then(ticked => expect(ticked - failedAt).to.be.at.least(27000));
  });

  it('should not ask the ports again while an installation runs', () => {
    const { prefetch } = readyToSetupStatus;
    const installation = { state: 'running', kind: 'install', phases: [], progress: 10, error: null, durationMs: null };
    const requests = countPortRequests({ body: [zbDongleE] });
    cy.clock();
    visitConfigured();
    openLocalForm();
    waitForFormLoaded();
    cy.waitForWebSocket();

    cy.sendWebSocket({ type: 'zigbee2mqtt.install-progress', payload: { installation, prefetch } });
    tickUntil(ticked => ticked >= 10000);
    // Counted as the request is sent, not when it is answered
    cy.wrap(requests)
      .its('count')
      .should('equal', 1);

    // Asked again once it ended
    cy.sendWebSocket({
      type: 'zigbee2mqtt.install-progress',
      payload: { installation: { ...installation, state: 'failed', error: { code: 'NO_ANSWER' } }, prefetch }
    });
    tickUntil(() => requests.count >= 2);
    cy.wrap(requests)
      .its('count')
      .should('equal', 2);
  });

  it('should keep the dongle chosen when the ports are listed again', () => {
    const otherDongle = { ...zbDongleE, path: '/dev/ttyUSB1', stablePath: '/dev/ttyUSB1', name: 'Other dongle' };
    listPorts([zbDongleE, otherDongle]);
    visitConfigured();
    openLocalForm();

    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click();
    cy.get('.react-select__option')
      .contains('Other dongle')
      .click();
    // Listed again in the background
    cy.wait('@usbPorts');
    cy.wait('@usbPorts');
    cy.get('[data-cy=z2m-setup-local-usb-field]').should('contain', 'Other dongle');
  });

  it('should select the configured dongle stored by its stable path', () => {
    listPorts([machinePort, zbDongleE]);
    visitSetup(
      { ...readyToSetupStatus, usbConfigured: true, z2mEnabled: true },
      {
        Z2M_MQTT_MODE: 'local',
        Z2M_ADAPTER_MODE: 'usb',
        ZIGBEE2MQTT_DRIVER_PATH: `/dev/serial/by-id/${LINK}`,
        ZIGBEE_DONGLE_NAME: ZBDONGLE_E
      }
    );
    cy.get('[data-cy=z2m-setup-local-summary]')
      .find('button')
      .click();
    cy.wait('@usbPorts');

    cy.get('[data-cy=z2m-setup-local-usb-field]').should('contain', 'Itead Sonoff Zigbee 3.0 USB Dongle Plus V2');
    cy.get('[data-cy=z2m-setup-local-dongle-detected]').should('exist');
  });

  it('should keep the model when the configured dongle, stored by its port, is chosen again', () => {
    // Not recognized: its model was chosen by hand
    listPorts([{ ...zbDongleE, name: 'Unknown dongle', adapter: null }]);
    visitSetup(
      { ...readyToSetupStatus, usbConfigured: true, z2mEnabled: true },
      {
        Z2M_MQTT_MODE: 'local',
        Z2M_ADAPTER_MODE: 'usb',
        ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
        ZIGBEE_DONGLE_NAME: ZBDONGLE_E
      }
    );
    cy.get('[data-cy=z2m-setup-local-summary]')
      .find('button')
      .click();
    cy.wait('@usbPorts');

    // Offered by its link, the same dongle
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click();
    cy.get('.react-select__option')
      .contains('Unknown dongle')
      .click();
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', ZBDONGLE_E);
    cy.get('[data-cy=z2m-setup-save]').should('not.be.disabled');
  });

  it('should tell that the dongle is not plugged in when saving, and that nothing was saved', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` },
      { statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' } }
    ).as('setup');
    listPorts([zbDongleE]);
    visitConfigured();
    openLocalForm();

    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@setup');

    cy.get('[data-cy=z2m-setup-save-error]').i18n('integration.zigbee2mqtt.setup.saveDongleNotFound');
  });

  it('should open the wizard after a reset, without the refusal of a save made before', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` },
      { statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' } }
    ).as('setup');
    listPorts([zbDongleE]);
    visitConfigured();
    openLocalForm();
    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@setup');
    cy.get('[data-cy=z2m-setup-save-error]').should('exist');

    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/reset` }, { body: {} }).as('reset');
    // Nothing configured any more
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: {} });
    cy.get('[data-cy=z2m-reset-button]').click();
    cy.get('[data-cy=z2m-reset-confirm-button]').click();
    cy.wait('@reset');
    cy.get('[data-cy=z2m-wizard]').should('exist');
    cy.get('[data-cy=z2m-wizard-save-error]').should('not.exist');
  });

  it('should tell that the configured dongle cannot be found', () => {
    listPorts([machinePort]);
    visitSetup(
      { ...readyToSetupStatus, mqttExist: true, mqttRunning: true, z2mEnabled: true, dongleMissing: true },
      {
        Z2M_MQTT_MODE: 'local',
        Z2M_ADAPTER_MODE: 'usb',
        ZIGBEE2MQTT_DRIVER_PATH: `/dev/serial/by-id/${LINK}`,
        ZIGBEE_DONGLE_NAME: ZBDONGLE_E
      }
    );

    cy.get('[data-cy=z2m-dongle-missing]').i18n('integration.zigbee2mqtt.setup.dongleMissing');
  });

  it('should keep the missing dongle told while the status was being read', () => {
    listPorts([machinePort]);
    const configuredStatus = { ...readyToSetupStatus, mqttExist: true, mqttRunning: true, z2mEnabled: true };
    visitSetup(
      configuredStatus,
      {
        Z2M_MQTT_MODE: 'local',
        Z2M_ADAPTER_MODE: 'usb',
        ZIGBEE2MQTT_DRIVER_PATH: `/dev/serial/by-id/${LINK}`,
        ZIGBEE_DONGLE_NAME: ZBDONGLE_E
      },
      // Long enough for the message to come before the answer
      { statusDelay: 5000 }
    );
    cy.waitForWebSocket();
    cy.sendWebSocket({ type: 'zigbee2mqtt.status-change', payload: { ...configuredStatus, dongleMissing: true } });
    cy.wait('@status');
    // Shown once the answer to the status, then the configuration, are applied
    cy.get('[data-cy=z2m-setup-local-summary]').should('exist');

    cy.get('[data-cy=z2m-dongle-missing]').i18n('integration.zigbee2mqtt.setup.dongleMissing');
  });
});
