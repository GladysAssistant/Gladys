// Matter devices page: a paired device already in Gladys is only proposed as "to update" when what
// the integration provides has changed, and updating it keeps what the integration doesn't manage.
describe('Matter devices', () => {
  const serverUrl = Cypress.env('serverUrl');
  const EXTERNAL_ID = 'matter:1234:2';
  const feature = (name, type, suffix, unit) => ({
    name,
    category: 'energy-sensor',
    type,
    external_id: `${EXTERNAL_ID}:${suffix}`,
    selector: `cypress-matter-plug-${suffix}`,
    unit,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1000000
  });
  const indexFeature = { ...feature('Energy', 'index', 'index', 'kilowatt-hour'), id: 'feature-index-id' };
  const powerFeature = feature('Power', 'power', 'power', 'watt');
  // The device as the user has it in Gladys: renamed, in a room, with a param written by the core
  const gladysDevice = {
    id: 'device-id',
    name: 'Washing machine plug',
    selector: 'washing-machine-plug',
    external_id: EXTERNAL_ID,
    room_id: 'room-id',
    features: [indexFeature],
    params: [
      { id: 'param-1', name: 'UNIQUE_ID', value: 'unique-id' },
      { id: 'param-2', name: 'SERIAL_NUMBER', value: 'serial-number' },
      { id: 'param-3', name: 'ENERGY_INDEX_LAST_PROCESSED_feature-index-id', value: '2026-11-15T13:00:00.000Z' }
    ]
  };
  // The same device as Matter publishes it: generic name, and only the params of the integration
  const pairedDevice = {
    name: 'IKEA of Sweden (GRILLPLATS Plug) 2',
    external_id: EXTERNAL_ID,
    features: [indexFeature],
    params: [
      { name: 'UNIQUE_ID', value: 'unique-id' },
      { name: 'SERIAL_NUMBER', value: 'serial-number' }
    ]
  };

  const visitWithPairedDevice = (device, { gladys = gladysDevice, nodes = [] } = {}) => {
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/matter/variable/MATTER_ENABLED` },
      { body: { value: 'true' } }
    );
    // like the server, the search only matches the name of the Gladys device (and its external_id)
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/matter/device*` }, req => {
      const { search } = req.query;
      const matches = !search || gladys.name.toLowerCase().includes(String(search).toLowerCase());
      req.reply({ body: matches ? [gladys] : [] });
    });
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/matter/node` }, { body: nodes });
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/matter/paired-device` }, { body: [device] }).as(
      'getPairedDevices'
    );
    cy.visit('/dashboard/integration/device/matter');
    cy.wait('@getPairedDevices');
  };

  // the session is not kept between tests: every test visits the page again
  beforeEach(() => {
    cy.login();
  });

  it('should not propose to update a device that only differs by params added by the core', () => {
    visitWithPairedDevice(pairedDevice);

    cy.contains('Washing machine plug').should('exist');
    cy.get('[data-cy=matter-paired-device]').should('not.exist');
  });

  it('should propose to update a device when a param of the integration has changed', () => {
    visitWithPairedDevice({
      ...pairedDevice,
      params: [
        { name: 'UNIQUE_ID', value: 'unique-id' },
        { name: 'SERIAL_NUMBER', value: 'new-serial-number' }
      ]
    });

    cy.get('[data-cy=matter-paired-device]').should('have.length', 1);
  });

  it('should name the existing device on the update card and keep its name and params when updating', () => {
    visitWithPairedDevice({ ...pairedDevice, features: [indexFeature, powerFeature] });
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, req => {
      req.reply(req.body);
    }).as('saveDevice');

    cy.get('[data-cy=matter-paired-device]')
      .should('have.length', 1)
      .find('.card-header')
      .should('contain', 'Washing machine plug')
      .and('not.contain', 'GRILLPLATS');
    cy.get('[data-cy=matter-paired-device-save]')
      .i18n('integration.matter.device.updateInGladys')
      .click();

    cy.wait('@saveDevice').then(({ request }) => {
      const { body } = request;
      expect(body).to.have.property('id', 'device-id');
      expect(body).to.have.property('selector', 'washing-machine-plug');
      expect(body).to.have.property('name', 'Washing machine plug');
      expect(body).to.have.property('room_id', 'room-id');
      expect(body).to.have.property('external_id', EXTERNAL_ID);
      // the features are the ones published by Matter
      expect(body.features.map(f => f.external_id)).to.deep.equal([indexFeature.external_id, powerFeature.external_id]);
      // the params of the integration are refreshed, the one written by the core is kept
      expect(body.params).to.deep.equal([
        { name: 'UNIQUE_ID', value: 'unique-id' },
        { name: 'SERIAL_NUMBER', value: 'serial-number' },
        { id: 'param-3', name: 'ENERGY_INDEX_LAST_PROCESSED_feature-index-id', value: '2026-11-15T13:00:00.000Z' }
      ]);
    });
  });

  it('should keep updating the existing device when the search only matches the Matter name', () => {
    visitWithPairedDevice({ ...pairedDevice, features: [indexFeature, powerFeature] });
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, req => {
      req.reply(req.body);
    }).as('saveDevice');

    // the search hides the Gladys device from the list, not from the paired device it updates
    cy.get('.page-options input[type=text]').type('GRILLPLATS');
    // only the update card still names it
    cy.get('.card-header')
      .filter(':contains("Washing machine plug")')
      .should('have.length', 1);
    cy.get('[data-cy=matter-paired-device-save]')
      .i18n('integration.matter.device.updateInGladys')
      .click();

    cy.wait('@saveDevice').then(({ request }) => {
      const { body } = request;
      expect(body).to.have.property('id', 'device-id');
      expect(body).to.have.property('name', 'Washing machine plug');
      expect(body).to.have.property('room_id', 'room-id');
      expect(body.params.map(p => p.name)).to.include('ENERGY_INDEX_LAST_PROCESSED_feature-index-id');
    });
  });

  it('should find an update card by the name of the Gladys device', () => {
    visitWithPairedDevice({ ...pairedDevice, features: [indexFeature, powerFeature] });

    cy.get('.page-options input[type=text]').type('Washing');
    cy.get('[data-cy=matter-paired-device]')
      .should('have.length', 1)
      .find('.card-header')
      .should('contain', 'Washing machine plug');
  });

  it('should keep the name, the room and the core params of the device a re-paired device replaces', () => {
    const NEW_EXTERNAL_ID = 'matter:5678:2';
    const rePairedIndexFeature = {
      ...indexFeature,
      id: 'paired-index-id',
      external_id: `${NEW_EXTERNAL_ID}:index`,
      selector: 'paired-index'
    };
    visitWithPairedDevice({
      ...pairedDevice,
      external_id: NEW_EXTERNAL_ID,
      features: [rePairedIndexFeature]
    });
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, { statusCode: 500, body: {} }).as('saveDevice');

    cy.get('[data-cy=matter-paired-device-replace]').click();

    cy.wait('@saveDevice').then(({ request }) => {
      const { body } = request;
      expect(body).to.have.property('id', 'device-id');
      expect(body).to.have.property('selector', 'washing-machine-plug');
      expect(body).to.have.property('name', 'Washing machine plug');
      expect(body).to.have.property('room_id', 'room-id');
      expect(body).to.have.property('external_id', NEW_EXTERNAL_ID);
      // the feature takes over the id of the existing one, so the watermark named after it stays valid
      expect(body.features.map(f => f.id)).to.deep.equal(['feature-index-id']);
      expect(body.params).to.deep.equal([
        { name: 'UNIQUE_ID', value: 'unique-id' },
        { name: 'SERIAL_NUMBER', value: 'serial-number' },
        { id: 'param-3', name: 'ENERGY_INDEX_LAST_PROCESSED_feature-index-id', value: '2026-11-15T13:00:00.000Z' }
      ]);
    });
    // the save failed: the card still shows the paired device as Matter publishes it
    cy.get('[data-cy=matter-paired-device]')
      .find('.card-header')
      .should('contain', 'GRILLPLATS');
  });

  it('should name the existing device on the phone row of an update, and merge it when updating', () => {
    cy.viewport('iphone-x');
    visitWithPairedDevice({ ...pairedDevice, features: [indexFeature, powerFeature] });
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, req => {
      req.reply(req.body);
    }).as('saveDevice');

    // the search only matches the Matter name: the row is still an update of the Gladys device
    cy.get('[data-cy=integration-mobile-search]').type('GRILLPLATS');
    cy.get('[data-cy=matter-paired-device-row]')
      .should('have.length', 1)
      .and('contain', 'Washing machine plug')
      .and('not.contain', 'GRILLPLATS')
      .click();
    cy.get('[data-cy=integration-device-sheet]').should('contain', 'Washing machine plug');
    cy.get('[data-cy=integration-device-primary]')
      .i18n('integration.matter.device.updateInGladys')
      .click();

    cy.wait('@saveDevice').then(({ request }) => {
      const { body } = request;
      expect(body).to.have.property('id', 'device-id');
      expect(body).to.have.property('name', 'Washing machine plug');
      expect(body).to.have.property('room_id', 'room-id');
      expect(body.params.map(p => p.name)).to.include('ENERGY_INDEX_LAST_PROCESSED_feature-index-id');
    });
  });

  it('should suggest a readable name for a new device and its features, in the language of the user', () => {
    const i18n = Cypress.env('i18n');
    const outlet = number => ({
      name: `Gladys Labs (Living room plug) ${number}`,
      external_id: `matter:9999:${number}`,
      features: [
        {
          name: 'OnOff - 1',
          category: 'switch',
          type: 'binary',
          external_id: `matter:9999:${number}:6`,
          selector: `matter-9999-${number}-6`,
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 1
        }
      ],
      params: [],
      matter_naming: { product: 'Living room plug', role: 'outlet', index: number, count: 2, alone: false }
    });
    visitWithPairedDevice(outlet(2));
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, req => {
      req.reply(req.body);
    }).as('saveDevice');

    const suggestedName = `Living room plug – ${i18n.integration.matter.roles.outlet} 2`;
    cy.get('[data-cy=matter-paired-device]')
      .should('have.length', 1)
      .find('.card-header')
      .should('contain', suggestedName)
      .and('not.contain', 'Gladys Labs');
    cy.get('[data-cy=matter-paired-device-save]').click();

    cy.wait('@saveDevice').then(({ request }) => {
      const { body } = request;
      expect(body).to.have.property('name', suggestedName);
      expect(body.features[0]).to.have.property('name', i18n.deviceFeatureCategory.switch.binary);
      // the naming hints are not saved
      expect(body).to.not.have.property('matter_naming');
    });
  });

  it('should keep the names of the features already in Gladys when updating a device', () => {
    const i18n = Cypress.env('i18n');
    const renamedIndex = { ...indexFeature, name: 'Washing machine index' };
    visitWithPairedDevice(
      { ...pairedDevice, features: [{ ...indexFeature, name: 'ElectricalEnergy - 2 (Energy)' }, powerFeature] },
      { gladys: { ...gladysDevice, features: [renamedIndex] } }
    );
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, req => {
      req.reply(req.body);
    }).as('saveDevice');

    cy.get('[data-cy=matter-paired-device-save]').click();

    cy.wait('@saveDevice').then(({ request }) => {
      const { body } = request;
      expect(body.features.map(f => f.name)).to.deep.equal([
        'Washing machine index',
        i18n.deviceFeatureCategory['energy-sensor'].power
      ]);
    });
  });

  it('should show live when a device becomes unavailable, and why', () => {
    const i18n = Cypress.env('i18n');
    visitWithPairedDevice(pairedDevice, {
      nodes: [
        { node_id: '1234', is_connected: true, status: 'connected', available: true, unreachable_device_paths: [] }
      ]
    });
    cy.contains('.card', 'Washing machine plug')
      .find('[data-cy=matter-device-unavailable]')
      .should('not.exist');

    cy.waitForWebSocket();
    cy.sendWebSocket({
      type: 'matter.node-status-changed',
      payload: { node_id: '1234', status: 'disconnected', available: false, unreachable_device_paths: [] }
    });
    cy.contains('.card', 'Washing machine plug')
      .find('[data-cy=matter-device-unavailable]')
      .should('contain', i18n.integration.matter.device.unavailable)
      .and('have.attr', 'title', i18n.integration.matter.device.unavailableReason['node-offline']);

    // the node is back, but its bridge can not reach the device
    cy.sendWebSocket({
      type: 'matter.node-status-changed',
      payload: { node_id: '1234', status: 'connected', available: true, unreachable_device_paths: ['2'] }
    });
    cy.contains('.card', 'Washing machine plug')
      .find('[data-cy=matter-device-unavailable]')
      .should('have.attr', 'title', i18n.integration.matter.device.unavailableReason['bridged-unreachable']);

    cy.sendWebSocket({
      type: 'matter.node-status-changed',
      payload: { node_id: '1234', status: 'connected', available: true, unreachable_device_paths: [] }
    });
    cy.contains('.card', 'Washing machine plug')
      .find('[data-cy=matter-device-unavailable]')
      .should('not.exist');
  });
});
