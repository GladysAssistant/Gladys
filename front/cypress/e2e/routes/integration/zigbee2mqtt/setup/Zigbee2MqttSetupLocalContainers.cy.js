describe('Zigbee2Mqtt setup wizard local mode from scratch', () => {
  const SELECTED_DONGLE_NAME = "CircuitSetup's CC2652P2 USB Coordinator";

  const selectDongle = () => {
    cy.get('[data-cy=z2m-setup-local-dongle-field]')
      .children()
      .as('dongleField');
    cy.get('@dongleField').click();
    cy.get('@dongleField').type(`CircuitSetup{enter}`);
  };

  before(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/status`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/status_ready_to_setup.json'
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        body: {}
      }
    );
    // Nothing configured: the page asks the server to download the images
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/prefetch`
      },
      {
        body: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null }
      }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  });

  it('Check list', () => {
    cy.get('[data-cy=z2m-setup-wizard]')
      .should('exist')
      .within(() => {
        cy.get('button').should('be.length', 2);
      });

    cy.get('[data-cy=z2m-setup-local-panel]')
      .should('exist')
      .within(() => {
        cy.get('button').should('not.be.disabled');
        cy.get('.requirement').should('be.length', 3);
      });

    cy.get('[data-cy=z2m-toggle-status]').should('exist');
    cy.get('[data-cy=z2m-running-status]').should('exist');
  });

  it('Select local mode', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/get_usb_ports.json'
      }
    ).as('usbPorts');

    cy.get('[data-cy=z2m-setup-local-panel]').within(() => {
      cy.get('button').click();
    });
    cy.wait('@usbPorts');

    // Setup panel should be hidden
    cy.get('[data-cy=z2m-setup-local-panel]').should('not.exist');
    // Save panel should be hidden
    cy.get('[data-cy=z2m-setup-save]').should('exist');
    cy.get('[data-cy=z2m-setup-reset]').should('exist');

    // Save button is disabled
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // No dongle recognized: nothing is selected
    cy.get('[data-cy=z2m-setup-local-usb-field]').should('not.contain', '/dev/');

    // The USB devices are listed by name, the serial ports of the machine are hidden
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click();
    cy.get('.react-select__option').should('have.length', 2);
    cy.get('.react-select__option')
      .first()
      .should('have.text', 'Silicon Labs CP2102 USB to UART Bridge Controller (/dev/ttyUSB0)');
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .type('{esc}');
    cy.get('[data-cy=z2m-setup-local-usb-show-all]').click();
    cy.get('[data-cy=z2m-setup-local-usb-show-all]').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click();
    cy.get('.react-select__option').should('have.length', 3);
    cy.get('.react-select__option')
      .last()
      .should('have.text', '/dev/ttyS0');
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .type('{esc}');

    // Start typing on USB port and abort
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .as('usbField');
    cy.get('@usbField').click();
    cy.get('@usbField').type('invalid value{esc}');

    // Save button is still disabled
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // Start typing on USB port and confirm
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .as('usbField');
    cy.get('@usbField').click();
    cy.get('@usbField').type('{downArrow}{enter}');

    // The dongle is not recognized: its model is required
    cy.get('[data-cy=z2m-setup-local-dongle-not-detected]').should('exist');
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // No "(legacy ezsp)" model for a dongle that is not recognized: Gladys switches to it by itself
    cy.get('[data-cy=z2m-setup-local-dongle-field]')
      .children()
      .as('dongleField');
    cy.get('@dongleField').click();
    cy.get('@dongleField').type('(legacy ezsp)');
    cy.get('.react-select__menu-notice--no-options').should('exist');
    cy.get('@dongleField').type('{esc}');

    // Select a dongle name
    selectDongle();

    cy.get('[data-cy=z2m-setup-local-dongle-not-detected]').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-dongle-detected]').should('not.exist');
    cy.get('[data-cy=z2m-setup-save]').should('not.be.disabled');
  });

  it('Check confirm configuration', () => {
    cy.get('[data-cy=z2m-setup-save]')
      .should('exist')
      .should('not.be.disabled');
    cy.get('[data-cy=z2m-setup-reset]')
      .should('exist')
      .should('not.be.disabled');
  });

  it('Save configuration with error', () => {
    // Check no error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');

    // Re-fill form
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .as('portInput');

    cy.get('@portInput').click();
    cy.get('@portInput').type('{downArrow}{enter}');

    // Enter TCP port
    cy.get('[data-cy=z2m-setup-local-tcp-field]').type('12345');

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        statusCode: 400
      }
    ).as('setup');

    cy.get('[data-cy=z2m-setup-save]').click();

    cy.wait('@setup')
      .its('request.body')
      .should('deep.eq', {
        ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
        ZIGBEE_DONGLE_NAME: SELECTED_DONGLE_NAME,
        Z2M_TCP_PORT: '12345',
        Z2M_ADAPTER_MODE: 'usb',
        Z2M_NETWORK_ADAPTER_URL: null,
        Z2M_NETWORK_ADAPTER_TYPE: null,
        Z2M_MQTT_MODE: 'local'
      });

    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('exist');
  });

  it('Save configuration with success', () => {
    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('exist');

    // Select a dongle name
    selectDongle();

    // Enter TCP port
    cy.get('[data-cy=z2m-setup-local-tcp-field]').clear();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        statusCode: 200,
        body: {
          ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
          ZIGBEE_DONGLE_NAME: SELECTED_DONGLE_NAME,
          Z2M_TCP_PORT: '12000'
        }
      }
    ).as('setup');

    cy.get('[data-cy=z2m-setup-save]').click();

    cy.wait('@setup')
      .its('request.body')
      .should('deep.eq', {
        ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
        ZIGBEE_DONGLE_NAME: SELECTED_DONGLE_NAME,
        Z2M_TCP_PORT: null,
        Z2M_ADAPTER_MODE: 'usb',
        Z2M_NETWORK_ADAPTER_URL: null,
        Z2M_NETWORK_ADAPTER_TYPE: null,
        Z2M_MQTT_MODE: 'local'
      });

    // Check error panel
    cy.get('[data-cy=z2m-setup-save-error]').should('not.exist');

    // Check summary
    cy.get('[data-cy=z2m-setup-local-usb-summary]').should('have.text', '/dev/ttyUSB0');
    cy.get('[data-cy=z2m-setup-local-dongle-summary]').should('have.text', SELECTED_DONGLE_NAME);
    cy.get('[data-cy=z2m-setup-local-tcp-summary]').should('have.text', '12000');

    cy.sendWebSocket({
      type: 'zigbee2mqtt.status-change',
      payload: {
        usbConfigured: true,
        networkAdapterConfigured: false,
        mqttExist: true,
        mqttRunning: true,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
        gladysConnected: true,
        zigbee2mqttConnected: true,
        z2mEnabled: true,
        dockerBased: true,
        networkModeValid: true
      }
    });
  });

  it('Reset configuration', () => {
    cy.get('[data-cy=z2m-setup-save]').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-summary]')
      .should('exist')
      .within(() => {
        cy.get('button')
          .contains('integration.zigbee2mqtt.setup.changeButtonLabel')
          .click();
      });
    cy.get('[data-cy=z2m-setup-reset]').click();
  });
});

describe('Zigbee2Mqtt setup wizard local mode with a recognized dongle', () => {
  const DETECTED_DONGLE_NAME = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';

  beforeEach(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/status`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/status_ready_to_setup.json'
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        body: {}
      }
    );
    // Nothing configured: the page asks the server to download the images
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/prefetch`
      },
      {
        body: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null }
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/get_usb_ports_detected.json'
      }
    ).as('usbPorts');
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  });

  it('Preselect the recognized dongle and its model', () => {
    cy.get('[data-cy=z2m-setup-local-panel]').within(() => {
      cy.get('button').click();
    });
    cy.wait('@usbPorts');

    cy.get('[data-cy=z2m-setup-local-usb-field]').should(
      'contain',
      'Itead Sonoff Zigbee 3.0 USB Dongle Plus V2 (/dev/ttyUSB0)'
    );
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', DETECTED_DONGLE_NAME);
    cy.get('[data-cy=z2m-setup-local-dongle-detected]').should('exist');
    cy.get('[data-cy=z2m-setup-local-dongle-mismatch]').should('not.exist');

    // Another model can be chosen, with a warning
    cy.get('[data-cy=z2m-setup-local-dongle-field]')
      .children()
      .as('dongleField');
    cy.get('@dongleField').click();
    cy.get('@dongleField').type('ZBDongle-P{enter}');
    cy.get('[data-cy=z2m-setup-local-dongle-mismatch]').should('exist');
    cy.get('[data-cy=z2m-setup-local-dongle-detected]').should('not.exist');
    cy.get('[data-cy=z2m-setup-save]').should('not.be.disabled');
    // Of the "(legacy ezsp)" models, only the variant of the recognized dongle is proposed, in case the automatic
    // fallback does not happen, without the mismatch warning
    cy.get('@dongleField').click();
    cy.get('@dongleField').type('(legacy ezsp)');
    cy.get('.react-select__option')
      .should('have.length', 1)
      .and('have.text', `${DETECTED_DONGLE_NAME} (legacy ezsp)`)
      .click();
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', `${DETECTED_DONGLE_NAME} (legacy ezsp)`);
    cy.get('[data-cy=z2m-setup-local-dongle-mismatch]').should('not.exist');

    // An unrecognized port does not keep the model of the recognized dongle
    cy.get('[data-cy=z2m-setup-local-usb-show-all]').click();
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click();
    cy.contains('.react-select__option', '/dev/ttyS0').click();
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('not.contain', DETECTED_DONGLE_NAME);
    cy.get('[data-cy=z2m-setup-local-dongle-not-detected]').should('exist');
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // Back to the recognized dongle, its model is selected again
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click();
    cy.contains('.react-select__option', '/dev/ttyUSB0').click();
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', DETECTED_DONGLE_NAME);
    cy.get('[data-cy=z2m-setup-local-dongle-detected]').should('exist');

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        statusCode: 400
      }
    ).as('setup');

    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();

    cy.wait('@setup')
      .its('request.body')
      .should('deep.eq', {
        ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
        ZIGBEE_DONGLE_NAME: DETECTED_DONGLE_NAME,
        Z2M_ADAPTER_MODE: 'usb',
        Z2M_NETWORK_ADAPTER_URL: null,
        Z2M_NETWORK_ADAPTER_TYPE: null,
        Z2M_MQTT_MODE: 'local'
      });
  });
});

describe('Zigbee2Mqtt setup wizard local mode with an existing configuration', () => {
  const DETECTED_DONGLE_NAME = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';

  const visitSetup = ({ setup, usbPortsFixture = 'get_usb_ports_detected.json', edit = true }) => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/status`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/status_ready_to_setup.json'
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        body: { Z2M_MQTT_MODE: 'local', Z2M_ADAPTER_MODE: 'usb', ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0', ...setup }
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port`
      },
      {
        fixture: `integration/routes/integration/zigbee2mqtt/${usbPortsFixture}`
      }
    ).as('usbPorts');
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');

    if (edit) {
      cy.get('[data-cy=z2m-setup-local-summary]').within(() => {
        cy.get('button')
          .contains('integration.zigbee2mqtt.setup.changeButtonLabel')
          .click();
      });
      cy.wait('@usbPorts');
    }
  };

  beforeEach(() => {
    cy.login();
  });

  it('Load the model chosen by Gladys when it falls back on the ezsp driver', () => {
    visitSetup({ setup: { ZIGBEE_DONGLE_NAME: DETECTED_DONGLE_NAME }, edit: false });

    cy.get('[data-cy=z2m-setup-local-dongle-summary]').should('have.text', DETECTED_DONGLE_NAME);
    cy.get('[data-cy=z2m-setup-local-ezsp-driver]').should('not.exist');

    // The ember driver refused the firmware of the dongle: Gladys switched to its "(legacy ezsp)" model
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        body: {
          Z2M_MQTT_MODE: 'local',
          Z2M_ADAPTER_MODE: 'usb',
          ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
          ZIGBEE_DONGLE_NAME: `${DETECTED_DONGLE_NAME} (legacy ezsp)`
        }
      }
    ).as('setupAfterFallback');
    cy.fixture('integration/routes/integration/zigbee2mqtt/status_ready_to_setup.json').then(status => {
      cy.sendWebSocket({ type: 'zigbee2mqtt.status-change', payload: { ...status, ezspFallback: true } });
    });
    cy.wait('@setupAfterFallback');

    cy.get('[data-cy=z2m-setup-local-dongle-summary]').should('have.text', `${DETECTED_DONGLE_NAME} (legacy ezsp)`);
    // Its text wraps inside the summary instead of overflowing it
    cy.get('[data-cy=z2m-setup-local-summary]').then($summary => {
      const summaryRight = $summary[0].getBoundingClientRect().right;
      cy.get('[data-cy=z2m-setup-local-ezsp-driver]').should($alert => {
        expect($alert[0].getBoundingClientRect().right).to.be.at.most(summaryRight);
      });
    });
  });

  it('Close the form when Gladys falls back on the ezsp driver', () => {
    // The form holds the ember model: saving it would undo the fallback
    visitSetup({ setup: { ZIGBEE_DONGLE_NAME: DETECTED_DONGLE_NAME } });
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', DETECTED_DONGLE_NAME);

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        body: {
          Z2M_MQTT_MODE: 'local',
          Z2M_ADAPTER_MODE: 'usb',
          ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
          ZIGBEE_DONGLE_NAME: `${DETECTED_DONGLE_NAME} (legacy ezsp)`
        }
      }
    ).as('setupAfterFallback');
    cy.fixture('integration/routes/integration/zigbee2mqtt/status_ready_to_setup.json').then(status => {
      cy.sendWebSocket({ type: 'zigbee2mqtt.status-change', payload: { ...status, ezspFallback: true } });
    });
    cy.wait('@setupAfterFallback');

    cy.get('[data-cy=z2m-setup-save]').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-dongle-summary]').should('have.text', `${DETECTED_DONGLE_NAME} (legacy ezsp)`);
    cy.get('[data-cy=z2m-setup-local-ezsp-driver]').should('exist');
  });

  it('Explain the ezsp adapter type of a network coordinator', () => {
    visitSetup({
      setup: {
        Z2M_ADAPTER_MODE: 'network',
        ZIGBEE2MQTT_DRIVER_PATH: null,
        Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
        Z2M_NETWORK_ADAPTER_TYPE: 'ezsp'
      },
      edit: false
    });

    cy.get('[data-cy=z2m-setup-local-network-type-summary]').should('have.text', 'ezsp');
    cy.get('[data-cy=z2m-setup-local-ezsp-driver]').should('exist');
  });

  it('Propose the configured "(legacy ezsp)" model, and no other', () => {
    visitSetup({ setup: { ZIGBEE_DONGLE_NAME: `${DETECTED_DONGLE_NAME} (legacy ezsp)` } });

    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', `${DETECTED_DONGLE_NAME} (legacy ezsp)`);
    cy.get('[data-cy=z2m-setup-local-dongle-mismatch]').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-dongle-field]')
      .children()
      .as('dongleField');
    cy.get('@dongleField').click();
    cy.get('@dongleField').type('(legacy ezsp)');
    cy.get('.react-select__option')
      .should('have.length', 1)
      .and('have.text', `${DETECTED_DONGLE_NAME} (legacy ezsp)`);
  });

  it('Do not propose the ezsp adapter type for a network coordinator', () => {
    visitSetup({
      setup: {
        Z2M_ADAPTER_MODE: 'network',
        ZIGBEE2MQTT_DRIVER_PATH: null,
        Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
        Z2M_NETWORK_ADAPTER_TYPE: 'ember'
      }
    });

    cy.get('[data-cy=z2m-setup-local-network-type-field]')
      .children()
      .click();
    cy.get('.react-select__option').should('have.length', 3);
    cy.contains('.react-select__option', 'ezsp').should('not.exist');
  });

  it('Suggest the model recognized on a port configured without model, written on save', () => {
    visitSetup({ setup: { ZIGBEE_DONGLE_NAME: null } });

    cy.get('[data-cy=z2m-setup-local-usb-field]').should(
      'contain',
      'Itead Sonoff Zigbee 3.0 USB Dongle Plus V2 (/dev/ttyUSB0)'
    );
    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', DETECTED_DONGLE_NAME);
    cy.get('[data-cy=z2m-setup-local-dongle-detected]').should('exist');

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        statusCode: 400
      }
    ).as('setup');

    cy.get('[data-cy=z2m-setup-save]')
      .should('not.be.disabled')
      .click();

    cy.wait('@setup')
      .its('request.body')
      .should('deep.eq', {
        ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
        ZIGBEE_DONGLE_NAME: DETECTED_DONGLE_NAME,
        Z2M_ADAPTER_MODE: 'usb',
        Z2M_NETWORK_ADAPTER_URL: null,
        Z2M_NETWORK_ADAPTER_TYPE: null,
        Z2M_MQTT_MODE: 'local'
      });
  });

  it('Suggest the model recognized on a port configured without model, once the ports are refreshed', () => {
    visitSetup({ setup: { ZIGBEE_DONGLE_NAME: null }, usbPortsFixture: 'get_usb_ports.json' });

    // The device on the configured port is not recognized
    cy.get('[data-cy=z2m-setup-local-dongle-not-detected]').should('exist');
    cy.get('[data-cy=z2m-setup-save]').should('be.disabled');

    // The dongle is plugged on this port, then the ports are refreshed
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/usb/port`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/get_usb_ports_detected.json'
      }
    ).as('usbPortsRefreshed');
    cy.get('[data-cy=z2m-setup-local-usb-refresh]').click();
    cy.wait('@usbPortsRefreshed');

    cy.get('[data-cy=z2m-setup-local-dongle-field]').should('contain', DETECTED_DONGLE_NAME);
    cy.get('[data-cy=z2m-setup-local-dongle-detected]').should('exist');
    cy.get('[data-cy=z2m-setup-save]').should('not.be.disabled');
  });
});
