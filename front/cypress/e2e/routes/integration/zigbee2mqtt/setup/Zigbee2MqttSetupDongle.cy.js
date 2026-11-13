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

  const visitSetup = (status, setup = {}) => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/status` }, { body: status });
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

  const chooseLocalMode = () => {
    cy.get('[data-cy=z2m-setup-local-panel]').within(() => {
      cy.get('button').click();
    });
    cy.wait('@usbPorts');
  };

  beforeEach(() => {
    cy.login();
  });

  it('should show a dongle plugged in while the form is open, and save it by its stable path', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: {} }).as('setup');
    listPorts([machinePort], [machinePort, zbDongleE]);
    visitSetup(readyToSetupStatus);
    chooseLocalMode();

    // Nothing plugged in yet
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // Plugged in: listed again in the background, the dongle and its model are chosen without any click
    cy.wait('@usbPorts');
    cy.get('[data-cy=z2m-setup-local-usb-field]').should('contain', 'Itead Sonoff Zigbee 3.0 USB Dongle Plus V2');
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', ZBDONGLE_E);
    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@setup')
      .its('request.body')
      .should('include', { ZIGBEE2MQTT_DRIVER_PATH: `/dev/serial/by-id/${LINK}`, ZIGBEE_DONGLE_NAME: ZBDONGLE_E });
  });

  it('should keep the dongle chosen when the ports are listed again', () => {
    const otherDongle = { ...zbDongleE, path: '/dev/ttyUSB1', stablePath: '/dev/ttyUSB1', name: 'Other dongle' };
    listPorts([zbDongleE, otherDongle]);
    visitSetup(readyToSetupStatus);
    chooseLocalMode();

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

  it('should tell that the dongle is not plugged in when saving, and that nothing was saved', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` },
      { statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'DONGLE_NOT_FOUND' } }
    ).as('setup');
    listPorts([zbDongleE]);
    visitSetup(readyToSetupStatus);
    chooseLocalMode();

    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@setup');

    cy.get('[data-cy=z2m-setup-save-error]').i18n('integration.zigbee2mqtt.setup.saveDongleNotFound');
  });

  it('should tell that the configured dongle is unplugged', () => {
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
});
