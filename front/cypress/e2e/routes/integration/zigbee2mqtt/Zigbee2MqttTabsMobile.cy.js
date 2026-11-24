// The "Devices" and "Discover" tabs of Zigbee2MQTT on a phone
// (docs/specs/mobile-pages/integration-devices.md, E). The lists, the status of Zigbee2MQTT and the
// writes are stubbed — they need a dongle, a broker and a running container — so the rows are
// known and nothing real is saved, deleted or permitted. Everything else is the real app.
describe('Zigbee2MQTT tabs on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const api = path => `${serverUrl}/api/v1${path}`;
  const i18n = key => Cypress._.get(Cypress.env('i18n'), key);
  const DESKTOP = [1280, 800];
  const DEVICES_URL = '/dashboard/integration/device/zigbee2mqtt';
  const DISCOVER_URL = '/dashboard/integration/device/zigbee2mqtt/discover';

  // Gladys is connected to the broker and Zigbee2MQTT answers
  const onlineStatus = {
    configured: true,
    usbConfigured: true,
    networkAdapterConfigured: false,
    mqttExist: true,
    mqttRunning: true,
    zigbee2mqttExist: true,
    zigbee2mqttRunning: true,
    gladysConnected: true,
    zigbee2mqttConnected: true,
    zigbee2mqttStarting: false,
    z2mEnabled: true,
    dockerBased: true,
    networkModeValid: true,
    coordinatorFirmware: null,
    z2mContainerError: null,
    mqttConnectionError: null
  };
  // The container is installed but Zigbee2MQTT has not answered
  const notOnlineStatus = { ...onlineStatus, zigbee2mqttRunning: false, zigbee2mqttConnected: false };
  // Nothing set up yet
  const notInstalledStatus = {
    ...notOnlineStatus,
    configured: false,
    usbConfigured: false,
    mqttExist: false,
    zigbee2mqttExist: false,
    gladysConnected: false,
    z2mEnabled: false
  };

  const feature = (deviceExternalId, name, category, type, extra = {}) => ({
    id: `f-${deviceExternalId}-${category}-${type}`,
    name,
    category,
    type,
    external_id: `${deviceExternalId}:${category}:${type}`,
    selector: `${deviceExternalId.replace(/[: ]/g, '-')}-${category}-${type}`,
    read_only: true,
    has_feedback: false,
    keep_history: true,
    min: 0,
    max: 100,
    ...extra
  });

  // answers a POST /device with what was posted, as the server does
  const stubSave = () =>
    cy
      .intercept({ method: 'POST', url: api('/device') }, req => {
        req.reply({ ...req.body, id: req.body.id || 'cy-new-device', created_at: '2026-01-01T00:00:00.000Z' });
      })
      .as('saveDevice');

  const stubStatus = status =>
    cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/status') }, { body: status }).as('getStatus');

  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
    // Configured with the local broker: the interface is on port 8080 of the Gladys host
    cy.intercept(
      { method: 'GET', url: api('/service/zigbee2mqtt/setup') },
      { body: { Z2M_MQTT_MODE: 'local', Z2M_ADAPTER_MODE: 'usb', ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0' } }
    ).as('getSetup');
    cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/permit_join') }, { body: false });
  });

  describe('Devices', () => {
    const IEEE = '0xa4c138000000beef';
    const plug = {
      id: 'cy-z2m-plug',
      name: 'Kitchen plug',
      selector: 'zigbee2mqtt-cy-kitchen-plug',
      external_id: 'zigbee2mqtt:Kitchen plug',
      room_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      features: [
        feature('zigbee2mqtt:Kitchen plug', 'Plug', 'switch', 'binary', { read_only: false, max: 1 }),
        feature('zigbee2mqtt:Kitchen plug', 'Power', 'switch', 'power', { unit: 'watt', max: 4000 })
      ],
      params: [{ name: 'model', value: 'TS011F' }]
    };
    const sensor = {
      id: 'cy-z2m-sensor',
      name: 'Bedroom sensor',
      selector: 'zigbee2mqtt-cy-bedroom-sensor',
      external_id: 'zigbee2mqtt:Bedroom sensor',
      room_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      features: [
        feature('zigbee2mqtt:Bedroom sensor', 'Temperature', 'temperature-sensor', 'decimal', { unit: 'celsius' }),
        feature('zigbee2mqtt:Bedroom sensor', 'Battery', 'battery', 'integer', { unit: 'percent', last_value: 18 })
      ],
      params: []
    };

    beforeEach(() => {
      stubStatus(onlineStatus);
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/device*') }, [plug, sensor]).as('getDevices');
      // the devices page reads the IEEE address of a device from the discovered ones
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/discovered*') }, [
        { external_id: plug.external_id, ieee_address: IEEE }
      ]);
    });

    const openPlug = () => {
      cy.visit(DEVICES_URL);
      cy.wait('@getDevices');
      cy.contains('[data-cy=z2m-device-row]', 'Kitchen plug').click();
      cy.get('[data-cy=integration-device-sheet]').should('be.visible');
    };

    it('should list the devices as rows, with their room and their battery', () => {
      cy.visit(DEVICES_URL);
      cy.wait('@getDevices');
      cy.get('[data-cy=z2m-devices-mobile]').should('exist');
      cy.get('.col-md-6').should('not.exist');
      cy.get('[data-cy=z2m-device-row]').should('have.length', 2);
      cy.contains('[data-cy=z2m-device-row]', 'Kitchen plug').i18n('device.noRoom');
      cy.contains('[data-cy=z2m-device-row]', 'Bedroom sensor')
        .find('[data-cy=integration-device-battery]')
        .should('contain', '18%');
      // no field of the list triggers the iOS zoom
      cy.get('[data-cy=integration-mobile-search]').should('have.css', 'font-size', '16px');
      // the interface address is known: no notice about it
      cy.wait('@getSetup');
      cy.get('[data-cy=z2m-url-warning]').should('not.exist');
    });

    it('should hold in a sheet what the card of a device holds', () => {
      openPlug();
      cy.get('[data-cy=integration-device-name]')
        .should('have.value', 'Kitchen plug')
        .and('have.css', 'font-size', '16px');
      cy.get('[data-cy=integration-device-room]').should('have.css', 'font-size', '16px');
      cy.get('[data-cy=integration-device-features]').i18n('deviceFeatureCategory.switch.power');
      cy.get('[data-cy=integration-device-details]').should('contain', IEEE);
      cy.get('[data-cy=z2m-device-open-in-z2m]')
        .should('have.attr', 'target', '_blank')
        .and('have.attr', 'href')
        .and('include', `/#/device/0/${IEEE}/info`);
      cy.get('[data-cy=integration-device-save]').should('be.disabled');
      cy.get('[data-cy=z2m-device-edit]').should('exist');
    });

    it('should rename a device from its sheet, save it and say so', () => {
      stubSave();
      openPlug();
      cy.get('[data-cy=integration-device-name]').clear();
      cy.get('[data-cy=integration-device-name]').type('Coffee machine');
      cy.get('[data-cy=integration-device-save]')
        .should('not.be.disabled')
        .click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.name).to.equal('Coffee machine');
        expect(request.body.external_id).to.equal('zigbee2mqtt:Kitchen plug');
        expect(request.body.selector).to.equal('zigbee2mqtt-cy-kitchen-plug');
      });
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileKit.saved');
      cy.contains('[data-cy=z2m-device-row]', 'Coffee machine').should('exist');
    });

    it('should keep the sheet open and say so when the save fails', () => {
      cy.intercept({ method: 'POST', url: api('/device') }, { statusCode: 500, body: {} }).as('saveDevice');
      openPlug();
      cy.get('[data-cy=integration-device-name]').type(' 2');
      cy.get('[data-cy=integration-device-save]').click();
      cy.wait('@saveDevice');
      cy.get('[data-cy=integration-device-sheet]').should('be.visible');
      cy.get('[data-cy=integration-device-error]').i18n('integration.zigbee2mqtt.saveError');
      cy.get('[data-cy=integration-device-name]').should('have.value', 'Kitchen plug 2');
    });

    it('should delete a device only once confirmed, and explain a refusal where it is asked', () => {
      let refuse = true;
      cy.intercept({ method: 'DELETE', url: api('/device/zigbee2mqtt-cy-kitchen-plug') }, req => {
        if (refuse) {
          req.reply({ statusCode: 400, body: { status: 400, message: '5000000 states in DB. Too much states!' } });
        } else {
          req.reply({ success: true });
        }
      }).as('deleteDevice');
      openPlug();
      cy.get('[data-cy=integration-device-delete]').click();
      cy.get('[data-cy=integration-device-delete-sheet]')
        .should('be.visible')
        .and('contain', 'Kitchen plug');
      cy.get('[data-cy=integration-device-delete-sheet] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@deleteDevice');
      // too many states: Gladys purges them in the background, with the link to that job
      cy.get('[data-cy=integration-device-delete-error]')
        .should('be.visible')
        .find('a[href="/dashboard/settings/jobs"]')
        .should('exist');
      cy.get('[data-cy=integration-device-delete-sheet]')
        .should('be.visible')
        .then(() => {
          refuse = false;
        });

      cy.get('[data-cy=integration-device-delete-sheet] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@deleteDevice');
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileDeviceList.deleted');
      cy.get('[data-cy=z2m-device-row]')
        .should('have.length', 1)
        .and('not.contain', 'Kitchen plug');
    });

    it('should tell the state of Zigbee2MQTT before the list', () => {
      stubStatus(notOnlineStatus);
      cy.visit(DEVICES_URL);
      cy.wait('@getDevices');
      cy.get('[data-cy=z2m-devices-mobile]')
        .children()
        .first()
        .should('have.attr', 'data-cy', 'z2m-status-alert')
        .and('contain', i18n('integration.zigbee2mqtt.status.notRunning'));
    });

    it('should explain the missing interface address after the list', () => {
      // an external broker without the address of the interface: no link to it
      cy.intercept(
        { method: 'GET', url: api('/service/zigbee2mqtt/setup') },
        { body: { Z2M_MQTT_MODE: 'external' } }
      ).as('getExternalSetup');
      cy.visit(DEVICES_URL);
      cy.wait('@getDevices');
      cy.wait('@getExternalSetup');
      cy.get('[data-cy=z2m-url-warning]').should('exist');
      // in the order of the document: the rows, then the notice
      cy.get('[data-cy=z2m-device-row], [data-cy=z2m-url-warning]')
        .should('have.length', 3)
        .last()
        .should('have.attr', 'data-cy', 'z2m-url-warning');
      cy.contains('[data-cy=z2m-device-row]', 'Kitchen plug').click();
      cy.get('[data-cy=z2m-device-open-in-z2m]').should('not.exist');
    });

    it('should lead an empty list to the Discover tab, unless Zigbee2MQTT is not installed', () => {
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/device*') }, []).as('getNoDevices');
      cy.visit(DEVICES_URL);
      cy.wait('@getNoDevices');
      cy.get('[data-cy=z2m-devices-discover]')
        .should('have.attr', 'href', DISCOVER_URL)
        .click();
      cy.location('pathname').should('equal', DISCOVER_URL);

      stubStatus(notInstalledStatus);
      cy.visit(DEVICES_URL);
      cy.wait('@getNoDevices');
      // One query, retried as a whole: the notice shown until the status is read is replaced by another element
      cy.get('[data-cy=z2m-devices-mobile] > :first-child').should('have.attr', 'data-cy', 'z2m-status-not-installed');
      cy.get('[data-cy=z2m-devices-mobile]').should('contain', i18n('integration.zigbee2mqtt.noDeviceFound'));
      cy.get('[data-cy=z2m-devices-discover]').should('not.exist');
    });

    it('should keep the cards on a wider screen', () => {
      cy.viewport(...DESKTOP);
      cy.visit(DEVICES_URL);
      cy.wait('@getDevices');
      cy.get('[data-cy=z2m-devices-mobile]').should('not.exist');
      cy.get('.col-md-6').should('have.length', 2);
      cy.get('#name_0').should('have.value', 'Kitchen plug');
    });
  });

  describe('Discover', () => {
    const bulb = {
      name: 'Hallway bulb',
      model: 'LCT015',
      external_id: 'zigbee2mqtt:Hallway bulb',
      ieee_address: '0x0017880100aabbcc',
      should_poll: false,
      features: [
        feature('zigbee2mqtt:Hallway bulb', 'State', 'light', 'binary', { read_only: false, max: 1 }),
        feature('zigbee2mqtt:Hallway bulb', 'Brightness', 'light', 'brightness', { read_only: false, max: 255 })
      ],
      params: [{ name: 'ieee_address', value: '0x0017880100aabbcc' }]
    };
    const existingPlug = {
      id: 'cy-z2m-existing-plug',
      name: 'Desk plug',
      model: 'TS011F',
      external_id: 'zigbee2mqtt:Desk plug',
      created_at: '2026-01-01T00:00:00.000Z',
      updatable: false,
      should_poll: false,
      features: [feature('zigbee2mqtt:Desk plug', 'Plug', 'switch', 'binary', { read_only: false, max: 1 })]
    };
    const updatableSensor = {
      id: 'cy-z2m-updatable-sensor',
      name: 'Garage sensor',
      model: 'WSDCGQ11LM',
      external_id: 'zigbee2mqtt:Garage sensor',
      created_at: '2026-01-01T00:00:00.000Z',
      updatable: true,
      should_poll: false,
      features: [feature('zigbee2mqtt:Garage sensor', 'Temperature', 'temperature-sensor', 'decimal')]
    };
    // a battery and nothing Gladys handles
    const remote = {
      name: 'Bedside remote',
      model: 'E1743',
      external_id: 'zigbee2mqtt:Bedside remote',
      should_poll: false,
      features: [feature('zigbee2mqtt:Bedside remote', 'Battery', 'battery', 'integer', { unit: 'percent' })]
    };
    const discovered = [bulb, existingPlug, updatableSensor, remote];

    const visitDiscover = () => {
      cy.visit(DISCOVER_URL);
      cy.wait('@getDiscovered');
      cy.get('[data-cy=z2m-discover-mobile]').should('exist');
    };

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/discovered*') }, discovered).as('getDiscovered');
      cy.intercept({ method: 'POST', url: api('/service/zigbee2mqtt/permit_join') }, { body: { success: true } }).as(
        'permitJoin'
      );
    });

    it('should list the devices found with what their cards show as badges', () => {
      stubStatus(onlineStatus);
      visitDiscover();
      cy.get('.col-md-6').should('not.exist');
      cy.get('[data-cy=z2m-discovered-row]').should('have.length', 4);
      cy.contains('[data-cy=z2m-discovered-row]', 'Hallway bulb').should('contain', 'LCT015');
      cy.contains('[data-cy=z2m-discovered-row]', 'Desk plug').i18n('mobileDeviceList.inGladys');
      cy.contains('[data-cy=z2m-discovered-row]', 'Garage sensor').i18n('mobileDeviceList.updateAvailable');
      cy.contains('[data-cy=z2m-discovered-row]', 'Bedside remote').i18n('mobileDeviceList.notSupported');
    });

    it('should add a discovered device from its sheet and say so', () => {
      stubStatus(onlineStatus);
      stubSave();
      visitDiscover();
      cy.contains('[data-cy=z2m-discovered-row]', 'Hallway bulb').click();
      cy.get('[data-cy=integration-device-sheet]').should('be.visible');
      cy.get('[data-cy=integration-device-details]')
        .should('contain', 'zigbee2mqtt:Hallway bulb')
        .and('contain', '0x0017880100aabbcc');
      cy.get('[data-cy=z2m-device-open-in-z2m]')
        .should('have.attr', 'href')
        .and('include', '/#/device/0/0x0017880100aabbcc/info');
      cy.get('[data-cy=integration-device-name]').clear();
      cy.get('[data-cy=integration-device-name]').type('Hall light');
      cy.get('[data-cy=integration-device-primary]')
        .i18n('integration.zigbee2mqtt.discover.addToGladys')
        .click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.name).to.equal('Hall light');
        expect(request.body.external_id).to.equal('zigbee2mqtt:Hallway bulb');
        // the features are named as on the card
        expect(request.body.features[0].name).to.equal(i18n('deviceFeatureCategory.light.binary'));
      });
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileDeviceList.added');
      cy.get('[data-cy=z2m-discovered-row]').should('have.length', 3);
    });

    it('should say why a device cannot be added', () => {
      stubStatus(onlineStatus);
      visitDiscover();
      cy.contains('[data-cy=z2m-discovered-row]', 'Desk plug').click();
      cy.get('[data-cy=integration-device-primary]')
        .should('be.disabled')
        .and('contain', i18n('integration.zigbee2mqtt.alreadyExistsButton'));
      cy.get('[data-cy=integration-device-sheet] [data-cy=sheet-close]').click();
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');

      cy.contains('[data-cy=z2m-discovered-row]', 'Bedside remote').click();
      cy.get('[data-cy=integration-device-sheet]')
        .should('contain', i18n('integration.zigbee2mqtt.discover.deviceNotHandled'))
        .find('[data-cy=integration-device-primary]')
        .should('not.exist');
      cy.get('[data-cy=z2m-discovered-suggest]')
        .should('have.attr', 'target', '_blank')
        .and('have.attr', 'href')
        .and('include', 'github.com/GladysAssistant/Gladys/issues/new');
    });

    it('should permit joining from the button of the page, and stop it', () => {
      stubStatus(onlineStatus);
      visitDiscover();
      cy.get('[data-cy=z2m-discover-permit-join]')
        .should('not.be.disabled')
        .i18n('integration.zigbee2mqtt.discover.permitJoin')
        .click();
      // the request of the desktop switch
      cy.wait('@permitJoin');
      cy.get('[data-cy=z2m-discover-permit-join-open]').should('not.exist');

      // the state of the joining comes back live
      cy.waitForWebSocket();
      cy.sendWebSocket({ type: 'zigbee2mqtt.permit-join', payload: true });
      cy.get('[data-cy=z2m-discover-permit-join-open]').i18n('integration.zigbee2mqtt.discover.permitJoinOpen');
      cy.get('[data-cy=z2m-discover-permit-join]')
        .i18n('integration.zigbee2mqtt.discover.stopPermitJoin')
        .click();
      cy.wait('@permitJoin');

      cy.sendWebSocket({ type: 'zigbee2mqtt.permit-join', payload: false });
      cy.get('[data-cy=z2m-discover-permit-join-open]').should('not.exist');
      cy.get('[data-cy=z2m-discover-permit-join]').i18n('integration.zigbee2mqtt.discover.permitJoin');
      cy.get('@permitJoin.all').should('have.length', 2);
    });

    it('should say so under the button when joining could not be permitted', () => {
      stubStatus(onlineStatus);
      cy.intercept({ method: 'POST', url: api('/service/zigbee2mqtt/permit_join') }, { statusCode: 500, body: {} }).as(
        'permitJoinFailed'
      );
      visitDiscover();
      cy.get('[data-cy=z2m-discover-permit-join]').click();
      cy.wait('@permitJoinFailed');
      cy.get('[data-cy=z2m-discover-permit-join-error]').i18n('integration.zigbee2mqtt.discover.permitJoinError');
      cy.get('[data-cy=z2m-discover-permit-join]').should('not.be.disabled');
    });

    it('should not permit joining while Zigbee2MQTT does not answer, until it is online', () => {
      stubStatus(notOnlineStatus);
      visitDiscover();
      cy.get('[data-cy=z2m-discover-mobile]')
        .children()
        .first()
        .should('have.attr', 'data-cy', 'z2m-status-alert')
        .and('contain', i18n('integration.zigbee2mqtt.status.notRunning'));
      cy.get('[data-cy=z2m-discover-permit-join]').should('be.disabled');

      cy.waitForWebSocket();
      cy.sendWebSocket({ type: 'zigbee2mqtt.status-change', payload: onlineStatus });
      cy.get('[data-cy=z2m-status-alert]').should('not.exist');
      cy.get('[data-cy=z2m-discover-permit-join]').should('not.be.disabled');
    });

    it('should not permit joining while Zigbee2MQTT is not installed, and lead to its installation', () => {
      stubStatus(notInstalledStatus);
      // Nothing set up: no interface address to warn about
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/setup') }, { body: {} }).as('emptySetup');
      visitDiscover();
      cy.get('[data-cy=z2m-status-not-installed]').should(
        'contain',
        i18n('integration.zigbee2mqtt.status.notInstalled')
      );
      cy.get('[data-cy=z2m-status-alert]').should('not.exist');
      cy.get('[data-cy=z2m-discover-permit-join]').should('be.disabled');
      // its banner only
      cy.wait('@emptySetup');
      cy.get('[data-cy=z2m-url-warning]').should('not.exist');
      cy.get('[data-cy=z2m-status-not-installed] a')
        .should('have.attr', 'href', '/dashboard/integration/device/zigbee2mqtt/setup')
        .and('contain', i18n('integration.zigbee2mqtt.status.install'));
    });

    it('should show the devices already added once asked', () => {
      stubStatus(onlineStatus);
      cy.intercept(
        { method: 'GET', url: api('/service/zigbee2mqtt/discovered*'), query: { filter_existing: 'false' } },
        [...discovered, { ...existingPlug, name: 'Old plug', external_id: 'zigbee2mqtt:Old plug' }]
      ).as('getAllDiscovered');
      visitDiscover();
      cy.get('[data-cy=z2m-discover-hide-existing]')
        .should('have.attr', 'aria-checked', 'true')
        .click();
      cy.wait('@getAllDiscovered');
      cy.get('[data-cy=z2m-discover-hide-existing]').should('have.attr', 'aria-checked', 'false');
      cy.get('[data-cy=z2m-discovered-row]').should('have.length', 5);
    });

    it('should keep the cards and the switch on a wider screen', () => {
      stubStatus(onlineStatus);
      cy.viewport(...DESKTOP);
      cy.visit(DISCOVER_URL);
      cy.wait('@getDiscovered');
      cy.get('[data-cy=z2m-discover-mobile]').should('not.exist');
      cy.get('.col-md-6').should('have.length', 4);
      cy.get('#permitJoin').should('not.be.disabled');
    });
  });
});
