// The "Devices" and "Discovery" tabs of the integrations on a phone
// (docs/specs/mobile-pages/integration-devices.md). The lists of each integration are stubbed —
// they need hardware, a broker or an installed container — and so are the writes, so the rows
// are known and nothing real is saved or deleted. Everything else is the real app.
describe('Integration devices on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const api = path => `${serverUrl}/api/v1${path}`;
  const DESKTOP = [1280, 800];

  const feature = (deviceExternalId, name, category, type, extra = {}) => ({
    id: `f-${deviceExternalId}-${category}-${type}`,
    name,
    category,
    type,
    external_id: `${deviceExternalId}:${category}:${type}`,
    selector: `${deviceExternalId.replace(/:/g, '-')}-${category}-${type}`,
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

  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  describe('Matter', () => {
    const DEVICES_URL = '/dashboard/integration/device/matter';
    const plug = {
      id: 'cy-matter-plug',
      name: 'Desk plug',
      selector: 'matter-cy-desk-plug',
      external_id: 'matter:1234:1',
      room_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      features: [
        feature('matter:1234:1', 'Plug', 'switch', 'binary', { read_only: false, max: 1 }),
        feature('matter:1234:1', 'Power', 'switch', 'power', { unit: 'watt', max: 4000 })
      ],
      params: [
        { name: 'UNIQUE_ID', value: 'A1B2C3D4E5F6' },
        { name: 'VENDOR_NAME', value: 'Eve Systems' }
      ]
    };
    const sensor = {
      id: 'cy-matter-sensor',
      name: 'Bedroom sensor',
      selector: 'matter-cy-bedroom-sensor',
      external_id: 'matter:5678:1',
      room_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      features: [feature('matter:5678:1', 'Temperature', 'temperature-sensor', 'decimal', { unit: 'celsius' })],
      params: []
    };
    const paired = {
      name: 'Eve Motion',
      selector: 'matter-7777-1',
      external_id: 'matter:7777:1',
      features: [feature('matter:7777:1', 'Motion', 'motion-sensor', 'binary', { max: 1 })],
      params: [{ name: 'UNIQUE_ID', value: 'MOTION-7777' }]
    };

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/service/matter/variable/MATTER_ENABLED') }, { value: 'true' });
      cy.intercept({ method: 'GET', url: api('/service/matter/device*') }, [plug, sensor]).as('getDevices');
      cy.intercept({ method: 'GET', url: api('/service/matter/paired-device') }, [paired]).as('getPaired');
      cy.intercept({ method: 'GET', url: api('/service/matter/node') }, [
        { node_id: '1234', is_connected: true },
        { node_id: '5678', is_connected: false }
      ]).as('getNodes');
    });

    const openPlug = () => {
      cy.visit(DEVICES_URL);
      cy.wait('@getPaired');
      cy.contains('[data-cy=matter-device-row]', 'Desk plug').click();
      cy.get('[data-cy=integration-device-sheet]').should('be.visible');
    };

    it('should list the devices as rows, with what their cards show as badges', () => {
      cy.visit(DEVICES_URL);
      cy.wait('@getPaired');
      cy.get('[data-cy=matter-devices-mobile]').should('exist');
      cy.get('.col-md-6').should('not.exist');
      cy.get('[data-cy=matter-device-row]').should('have.length', 2);
      cy.contains('[data-cy=matter-device-row]', 'Desk plug').i18n('device.noRoom');
      cy.contains('[data-cy=matter-device-row]', 'Bedroom sensor')
        .find('[data-cy=matter-device-disconnected]')
        .i18n('integration.matter.device.nodeDisconnected');
      cy.get('[data-cy=matter-paired-device-row]')
        .should('have.length', 1)
        .and('contain', 'Eve Motion');
      // no field of the list triggers the iOS zoom
      cy.get('[data-cy=integration-mobile-search]').should('have.css', 'font-size', '16px');
    });

    it('should hold in a sheet what the card of a device holds, with nothing to save yet', () => {
      openPlug();
      cy.get('[data-cy=integration-device-name]')
        .should('have.value', 'Desk plug')
        .and('have.css', 'font-size', '16px');
      cy.get('[data-cy=integration-device-room]').should('have.css', 'font-size', '16px');
      cy.get('[data-cy=integration-device-features]').i18n('deviceFeatureCategory.switch.power');
      cy.get('[data-cy=integration-device-save]').should('be.disabled');
      // the technical parameters stay folded until asked for
      cy.get('[data-cy=integration-device-details]').should('not.exist');
      cy.get('[data-cy=integration-device-details-toggle]').click();
      cy.get('[data-cy=integration-device-details]').should('contain', 'A1B2C3D4E5F6');
    });

    it('should rename a device from its sheet, save it and say so', () => {
      stubSave();
      openPlug();
      cy.get('[data-cy=integration-device-name]').clear();
      cy.get('[data-cy=integration-device-name]').type('Office plug');
      cy.get('[data-cy=integration-device-save]')
        .should('not.be.disabled')
        .click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.name).to.equal('Office plug');
        expect(request.body.external_id).to.equal('matter:1234:1');
        expect(request.body.selector).to.equal('matter-cy-desk-plug');
      });
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileKit.saved');
      cy.contains('[data-cy=matter-device-row]', 'Office plug').should('exist');
    });

    it('should keep the sheet open and say why when the save fails', () => {
      cy.intercept(
        { method: 'POST', url: api('/device') },
        { statusCode: 409, body: { status: 409, code: 'CONFLICT', error: { attribute: 'selector' } } }
      ).as('saveDevice');
      openPlug();
      cy.get('[data-cy=integration-device-name]').type(' 2');
      cy.get('[data-cy=integration-device-save]').click();
      cy.wait('@saveDevice');
      cy.get('[data-cy=integration-device-sheet]').should('be.visible');
      cy.get('[data-cy=integration-device-error]').i18n('integration.matter.error.selectorConflictError');
    });

    it('should ask before closing a sheet with unsaved changes', () => {
      openPlug();
      cy.get('[data-cy=integration-device-name]').type(' renamed');
      cy.get('[data-cy=integration-device-sheet] [data-cy=sheet-close]').click();
      cy.get('[data-cy=integration-device-leave-sheet]').should('be.visible');
      cy.get('[data-cy=integration-device-leave-keep]').click();
      cy.get('[data-cy=integration-device-leave-sheet]').should('not.exist');
      cy.get('[data-cy=integration-device-name]').should('have.value', 'Desk plug renamed');

      // the system "back" asks the same question, a second one closes it
      cy.go('back');
      cy.get('[data-cy=integration-device-leave-sheet]').should('be.visible');
      cy.go('back');
      cy.get('[data-cy=integration-device-leave-sheet]').should('not.exist');
      cy.get('[data-cy=integration-device-name]').should('have.value', 'Desk plug renamed');

      cy.get('[data-cy=integration-device-sheet] [data-cy=sheet-close]').click();
      cy.get('[data-cy=integration-device-leave-discard]').click();
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.location('pathname').should('equal', DEVICES_URL);
      cy.contains('[data-cy=matter-device-row]', 'Desk plug renamed').should('not.exist');
      cy.contains('[data-cy=matter-device-row]', 'Desk plug').click();
      cy.get('[data-cy=integration-device-name]').should('have.value', 'Desk plug');
    });

    it('should save and close from that question', () => {
      stubSave();
      openPlug();
      cy.get('[data-cy=integration-device-name]').type(' saved');
      cy.get('[data-cy=integration-device-sheet] [data-cy=sheet-close]').click();
      cy.get('[data-cy=integration-device-leave-save]').click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.name).to.equal('Desk plug saved');
      });
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileKit.saved');
    });

    it('should delete a device only once confirmed, and explain a refusal where it is asked', () => {
      let refuse = true;
      cy.intercept({ method: 'DELETE', url: api('/device/matter-cy-desk-plug') }, req => {
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
        .and('contain', 'Desk plug');
      cy.get('[data-cy=integration-device-delete-sheet] [data-cy=confirm-sheet-cancel]').click();
      cy.get('[data-cy=integration-device-delete-sheet]').should('not.exist');
      cy.get('[data-cy=integration-device-sheet]').should('be.visible');

      cy.get('[data-cy=integration-device-delete]').click();
      cy.get('[data-cy=integration-device-delete-sheet] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@deleteDevice');
      cy.get('[data-cy=integration-device-delete-error]').should('be.visible');
      cy.get('[data-cy=integration-device-delete-sheet]')
        .should('be.visible')
        .then(() => {
          refuse = false;
        });

      cy.get('[data-cy=integration-device-delete-sheet] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@deleteDevice');
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileDeviceList.deleted');
    });

    it('should search and sort through the requests of the desktop header', () => {
      // the requests the search field and the sort select of the card send
      cy.intercept({ method: 'GET', url: api('/service/matter/device*'), query: { search: 'plug' } }, [plug]).as(
        'searchDevices'
      );
      cy.intercept({ method: 'GET', url: api('/service/matter/device*'), query: { order_dir: 'desc' } }, [plug]).as(
        'sortDevices'
      );
      cy.visit(DEVICES_URL);
      cy.wait('@getPaired');
      cy.get('[data-cy=matter-device-row]').should('have.length', 2);
      cy.get('[data-cy=integration-mobile-search]').type('plug');
      cy.wait('@searchDevices')
        .its('request.url')
        .should('include', 'order_dir=asc');
      cy.get('[data-cy=matter-device-row]').should('have.length', 1);
      cy.get('[data-cy=integration-mobile-sort]')
        .i18n('global.orderDirAsc')
        .click();
      cy.wait('@sortDevices')
        .its('request.url')
        .should('include', 'search=plug');
      cy.get('[data-cy=integration-mobile-sort]').i18n('global.orderDirDesc');
    });

    it('should add a paired device from its sheet', () => {
      stubSave();
      cy.visit(DEVICES_URL);
      cy.wait('@getPaired');
      cy.get('[data-cy=matter-paired-device-row]').click();
      cy.get('[data-cy=integration-device-primary]')
        .i18n('integration.matter.device.addToGladys')
        .click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.external_id).to.equal('matter:7777:1');
      });
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileDeviceList.added');
    });

    it('should pair a device from a form made for a thumb', () => {
      cy.intercept({ method: 'POST', url: api('/service/matter/pair-device') }, { success: true }).as('pairDevice');
      cy.visit(`${DEVICES_URL}/discover`);
      cy.get('[data-cy=matter-discover-mobile]').should('exist');
      cy.get('[data-cy=matter-pairing-code]')
        .should('have.css', 'font-size', '16px')
        .type('1234-567-8901');
      cy.get('[data-cy=matter-pairing-submit]').click();
      cy.wait('@pairDevice').then(({ request }) => {
        expect(request.body).to.deep.equal({ pairing_code: '1234-567-8901' });
      });
      cy.location('pathname').should('equal', DEVICES_URL);
    });

    it('should keep the cards on a wider screen', () => {
      cy.viewport(...DESKTOP);
      cy.visit(DEVICES_URL);
      cy.wait('@getPaired');
      cy.get('[data-cy=matter-devices-mobile]').should('not.exist');
      cy.get('.col-md-6').should('have.length', 3);
      cy.get('#name_0').should('have.value', 'Desk plug');
    });
  });

  describe('LAN Manager', () => {
    const discovered = [
      {
        name: 'Galaxy-S23',
        ip: '192.168.1.42',
        selector: 'lan-manager-a0b1c2d3e4f5',
        external_id: 'lan-manager:a0b1c2d3e4f5',
        features: [feature('lan-manager:a0b1c2d3e4f5', 'Presence', 'presence-sensor', 'push', { max: 1 })],
        params: [
          { name: 'DEVICE_MAC', value: 'a0:b1:c2:d3:e4:f5' },
          { name: 'MANUFACTURER', value: 'Samsung Electronics' }
        ]
      },
      {
        name: '',
        ip: '192.168.1.87',
        selector: 'lan-manager-deadbeef0001',
        external_id: 'lan-manager:deadbeef0001',
        features: [feature('lan-manager:deadbeef0001', 'Presence', 'presence-sensor', 'push', { max: 1 })],
        params: [{ name: 'DEVICE_MAC', value: 'de:ad:be:ef:00:01' }]
      }
    ];

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/service/lan-manager/status') }, { scanning: false });
      cy.intercept({ method: 'GET', url: api('/service/lan-manager/discover*') }, discovered).as('getDiscovered');
      cy.intercept({ method: 'POST', url: api('/service/lan-manager/discover') }, { scanning: true }).as('scan');
    });

    it('should add a discovered device once it has a name', () => {
      stubSave();
      cy.visit('/dashboard/integration/device/lan-manager/discover');
      cy.wait('@getDiscovered');
      cy.get('[data-cy=lan-manager-discover-mobile]').should('exist');
      cy.get('[data-cy=lan-manager-discovered-row]').should('have.length', 2);
      cy.contains('[data-cy=lan-manager-discovered-row]', '192.168.1.87')
        .i18n('mobileDeviceList.noName')
        .click();
      cy.get('[data-cy=integration-device-details]').should('contain', 'de:ad:be:ef:00:01');
      cy.get('[data-cy=integration-device-primary]').should('be.disabled');
      cy.get('[data-cy=integration-device-name]').type('Tablet');
      cy.get('[data-cy=integration-device-primary]').click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.name).to.equal('Tablet');
        expect(request.body.external_id).to.equal('lan-manager:deadbeef0001');
      });
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileDeviceList.added');
      cy.contains('[data-cy=lan-manager-discovered-row]', 'Tablet').i18n('mobileDeviceList.inGladys');
    });

    it('should say what the scan button does while a scan runs', () => {
      cy.visit('/dashboard/integration/device/lan-manager/discover');
      cy.wait('@getDiscovered');
      cy.get('[data-cy=lan-manager-discover-scan]')
        .i18n('integration.lanManager.discover.scanButton')
        .click();
      cy.wait('@scan').then(({ request }) => {
        expect(request.body).to.deep.equal({ scan: 'on' });
      });
      cy.get('[data-cy=lan-manager-discover-scan]').i18n('mobileDeviceList.stopScan');
      cy.get('[data-cy=lan-manager-discover-hide-existing]').should('be.disabled');
    });
  });

  describe('MQTT', () => {
    const devices = [
      {
        id: 'cy-mqtt-probe',
        name: 'Outdoor probe',
        selector: 'mqtt-cy-outdoor-probe',
        external_id: 'mqtt:cy-outdoor-probe',
        room_id: null,
        created_at: '2026-01-01T00:00:00.000Z',
        features: [
          feature('mqtt:cy-outdoor-probe', 'Temperature', 'temperature-sensor', 'decimal', { unit: 'celsius' }),
          feature('mqtt:cy-outdoor-probe', 'Battery', 'battery', 'integer', { unit: 'percent', last_value: 8 })
        ]
      }
    ];

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api('/service/mqtt/device*') }, devices).as('getDevices');
      cy.intercept({ method: 'GET', url: api('/service/mqtt/status') }, { configured: true, connected: true });
      // what the editor of the device asks for when it opens
      cy.intercept({ method: 'GET', url: api('/device/mqtt-cy-outdoor-probe') }, devices[0]);
    });

    it('should lead to the editor of a device from its sheet, and to the creation from the "+"', () => {
      cy.visit('/dashboard/integration/device/mqtt');
      cy.wait('@getDevices');
      cy.get('[data-cy=mqtt-devices-mobile]').should('exist');
      cy.get('[data-cy=mqtt-device-group]').i18n('integration.mqtt.device.unassignedRoom');
      cy.get('[data-cy=mqtt-device-row]')
        .should('have.length', 1)
        .find('[data-cy=integration-device-battery]')
        .should('contain', '8%');
      cy.get('[data-cy=mqtt-device-row]').click();
      cy.get('[data-cy=integration-device-details]').should('contain', 'mqtt:cy-outdoor-probe');
      cy.get('[data-cy=mqtt-device-edit]').click();
      cy.location('pathname').should('equal', '/dashboard/integration/device/mqtt/edit/mqtt-cy-outdoor-probe');
      // the sheet left its history entry to the editor: one "back" returns to the list
      cy.go('back');
      cy.location('pathname').should('equal', '/dashboard/integration/device/mqtt');
      cy.get('[data-cy=mqtt-device-create]').click();
      cy.location('pathname').should('equal', '/dashboard/integration/device/mqtt/edit');
    });
  });

  describe('External integration', () => {
    const SELECTOR = 'ext-cy-mobile';
    const integration = {
      id: '6c1b3f0e-2a4d-4b8e-9f3a-1d2c3b4a5e77',
      name: 'Demo',
      selector: SELECTOR,
      type: 'external',
      status: 'RUNNING',
      running: true,
      version: '1.0.0',
      granted_devices: [],
      manifest: { name: 'Demo plugs', type: 'device', version: '1.0.0' }
    };
    const device = {
      id: 'cy-ext-plug',
      name: 'Garage plug',
      selector: 'ext-cy-mobile-garage-plug',
      external_id: `${SELECTOR}:garage-plug`,
      room_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      features: [
        feature(`${SELECTOR}:garage-plug`, 'Relay', 'switch', 'binary', { read_only: false, max: 1 }),
        feature(`${SELECTOR}:garage-plug`, 'Power', 'switch', 'power', { unit: 'watt', max: 4000 })
      ],
      params: [
        { name: 'GLADYS_TRANSPORT', value: 'cloud' },
        { name: 'GLADYS_TRANSPORT_DEGRADED', value: 'true' },
        { name: 'IP_ADDRESS', value: '192.168.1.60' }
      ]
    };
    const discovered = [
      {
        name: 'Plus 2PM',
        selector: 'ext-cy-mobile-plus-2pm',
        external_id: `${SELECTOR}:plus-2pm`,
        created: false,
        features: [feature(`${SELECTOR}:plus-2pm`, 'Power', 'switch', 'power', { unit: 'watt', max: 4000 })],
        params: []
      },
      {
        name: 'Garage plug',
        selector: 'ext-cy-mobile-garage-plug',
        external_id: `${SELECTOR}:garage-plug`,
        created: true,
        features: [feature(`${SELECTOR}:garage-plug`, 'Relay', 'switch', 'binary', { read_only: false, max: 1 })],
        params: []
      }
    ];

    beforeEach(() => {
      cy.intercept({ method: 'GET', url: api(`/external_integration/${SELECTOR}`) }, integration).as('getIntegration');
      cy.intercept({ method: 'GET', url: api(`/service/${SELECTOR}/device`) }, [device]).as('getDevices');
      cy.intercept({ method: 'GET', url: api(`/external_integration/${SELECTOR}/discovered_device`) }, discovered).as(
        'getDiscovered'
      );
      cy.intercept({ method: 'GET', url: api('/device/*/states_size') }, { features: [] });
    });

    it('should save the name and the history choices made in the sheet of a device', () => {
      stubSave();
      cy.visit(`/dashboard/integration/device/external/${SELECTOR}`);
      cy.wait('@getDevices');
      cy.get('[data-cy=external-devices-mobile]').should('exist');
      cy.get('[data-cy=external-device-row]')
        .should('have.length', 1)
        .find('[data-cy=external-device-degraded]')
        .i18n('integration.externalIntegration.transport.degradedBadge');
      cy.get('[data-cy=external-device-row]').click();
      // what the badge says in a tooltip on a wider screen
      cy.get('[data-cy=external-device-transport-notice]').i18n(
        'integration.externalIntegration.transport.degradedTooltip'
      );
      cy.get('[data-cy=external-device-keep-history-switch]').should('have.length', 2);
      cy.get('[data-cy=integration-device-save]').should('be.disabled');
      cy.get('[data-cy=external-device-keep-history-switch]')
        .eq(1)
        .click();
      cy.get('[data-cy=external-device-keep-history-switch]')
        .eq(1)
        .should('have.attr', 'aria-checked', 'false');
      cy.get('[data-cy=integration-device-save]').click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.name).to.equal('Garage plug');
        expect(request.body.features[0].keep_history).to.equal(true);
        expect(request.body.features[1].keep_history).to.equal(false);
      });
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileKit.saved');
    });

    it('should add a discovered device, and not the one already added', () => {
      stubSave();
      cy.visit(`/dashboard/integration/device/external/${SELECTOR}/discover`);
      cy.wait('@getDiscovered');
      cy.get('[data-cy=external-discover-mobile]').should('exist');
      cy.get('[data-cy=external-discovered-row]').should('have.length', 2);
      cy.contains('[data-cy=external-discovered-row]', 'Garage plug')
        .i18n('integration.externalIntegration.discover.alreadyCreatedBadge')
        .click();
      cy.get('[data-cy=integration-device-primary]').should('be.disabled');
      cy.get('[data-cy=integration-device-sheet] [data-cy=sheet-close]').click();
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');

      cy.contains('[data-cy=external-discovered-row]', 'Plus 2PM').click();
      cy.get('[data-cy=integration-device-primary]').click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.external_id).to.equal(`${SELECTOR}:plus-2pm`);
        // the flags of the list are not part of a device
        expect(request.body).to.not.have.property('created');
      });
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileDeviceList.added');
    });
  });

  describe('Thermostat', () => {
    const thermostat = {
      id: 'cy-thermostat',
      name: 'Living room thermostat',
      selector: 'thermostat-cy-living-room',
      external_id: 'thermostat:cy-living-room',
      room_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      features: [
        {
          id: 'cy-thermostat-target',
          name: 'Setpoint',
          category: 'thermostat',
          type: 'target-temperature',
          selector: 'thermostat-cy-living-room-target',
          unit: 'celsius',
          last_value: 20.5
        }
      ],
      params: [{ name: 'THERMOSTAT_TYPE', value: 'virtual' }]
    };

    it('should say what a thermostat is set to on its row, and lead to its form', () => {
      cy.intercept({ method: 'GET', url: api('/service/thermostat/device*') }, [thermostat]).as('getDevices');
      cy.intercept({ method: 'GET', url: api('/service/thermostat/schedule') }, [
        { id: 'cy-schedule', name: 'Work week', selector: 'work-week', devices: [{ selector: thermostat.selector }] }
      ]);
      cy.visit('/dashboard/integration/device/thermostat');
      cy.wait('@getDevices');
      cy.get('[data-cy=thermostat-devices-mobile]').should('exist');
      cy.get('[data-cy=thermostat-device-summary]')
        .should('contain', '20.5 °C')
        .and('contain', 'Work week');
      cy.get('[data-cy=thermostat-device-row]').click();
      cy.get('[data-cy=integration-device-name]').should('have.value', 'Living room thermostat');
      cy.get('[data-cy=thermostat-device-edit]').click();
      cy.location('pathname').should(
        'equal',
        '/dashboard/integration/device/thermostat/edit/thermostat-cy-living-room'
      );
    });
  });

  describe('Bluetooth', () => {
    it('should list the peripherals found and say that Bluetooth is not reachable', () => {
      cy.intercept({ method: 'GET', url: api('/service/bluetooth/status') }, { ready: false }).as('getStatus');
      cy.intercept({ method: 'GET', url: api('/service/bluetooth/peripheral') }, []);
      cy.visit('/dashboard/integration/device/bluetooth/setup');
      cy.wait('@getStatus');
      cy.get('[data-cy=bluetooth-discover-mobile]').should('exist');
      cy.get('[data-cy=bluetooth-not-ready]').i18n('integration.bluetooth.bluetoothNotReadyError');
      cy.get('[data-cy=bluetooth-discover-scan]').should('be.disabled');
    });
  });
});
