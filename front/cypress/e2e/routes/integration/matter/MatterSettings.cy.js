// Matter settings page: the nodes as the user knows them, the sheet of a node and its actions, and the
// endpoint and cluster tree in expert mode (docs/specs/matter.md)
describe('Matter settings', () => {
  const serverUrl = Cypress.env('serverUrl');
  const api = path => `${serverUrl}/api/v1/service/matter${path}`;

  const plugNode = {
    node_id: '1',
    name: 'Living room plug',
    is_connected: true,
    status: 'connected',
    available: true,
    last_contact: new Date().toISOString(),
    unreachable_device_paths: [],
    network_type: 'wifi',
    gladys_devices: [
      { name: 'Living room plug – Outlet 1', selector: 'outlet-1', external_id: 'matter:1:1' },
      { name: 'Living room plug – Outlet 2', selector: 'outlet-2', external_id: 'matter:1:2' }
    ],
    node_information: {
      vendor_name: 'Gladys Labs',
      product_name: 'Power strip',
      vendor_id: 65521,
      product_id: 32768,
      node_label: 'Living room plug',
      software_version: '2.4.1'
    }
  };
  const sensorNode = {
    node_id: '2',
    name: null,
    is_connected: false,
    status: 'disconnected',
    available: false,
    last_contact: null,
    unreachable_device_paths: [],
    network_type: 'thread',
    gladys_devices: [],
    node_information: { vendor_name: 'Gladys Labs', product_name: 'T/H sensor', vendor_id: 65521, product_id: 2 }
  };
  const plugDetails = {
    node_id: '1',
    name: 'Living room plug',
    status: 'connected',
    available: true,
    since: new Date().toISOString(),
    last_contact: new Date().toISOString(),
    live: true,
    information: {
      vendor_name: 'Gladys Labs',
      vendor_id: 65521,
      product_name: 'Power strip',
      product_id: 32768,
      node_label: 'Living room plug',
      serial_number: 'SN-0001',
      hardware_version: 'B',
      software_version: '2.4.1'
    },
    network: {
      type: 'wifi',
      power_source: 'mains',
      rssi: -58,
      signal_quality: 'excellent',
      thread_role: null,
      thread_channel: null,
      ip_addresses: ['192.168.1.20']
    },
    controllers: [
      { fabric_index: 1, label: 'Gladys Assistant', vendor_id: 65521, vendor_name: null, is_gladys: true },
      { fabric_index: 2, label: null, vendor_id: 4937, vendor_name: 'Apple', is_gladys: false }
    ],
    gladys_devices: [
      { name: 'Living room plug – Outlet 1', selector: 'outlet-1', available: true, unavailable_reason: null },
      { name: 'Living room plug – Outlet 2', selector: 'outlet-2', available: true, unavailable_reason: null }
    ],
    bridged_devices: [],
    capabilities: { identify: true, share: true }
  };

  beforeEach(() => {
    cy.login();
    cy.window().then(win => win.localStorage.removeItem('matter-settings-expert-mode'));
    cy.intercept({ method: 'GET', url: api('/variable/MATTER_ENABLED') }, { body: { value: 'true' } });
    cy.intercept({ method: 'GET', url: api('/ipv6') }, { body: { has_ipv6: true, ipv6_interfaces: [] } });
    cy.intercept({ method: 'GET', url: api('/node?*') }, req => {
      const withClusters = req.query.with_clusters === 'true';
      req.reply({
        body: [plugNode, sensorNode].map(node =>
          withClusters
            ? {
                ...node,
                devices: [
                  {
                    name: 'MA-onoffpluginunit',
                    number: '1',
                    cluster_clients: [
                      { id: '6', name: 'OnOff', attributes: ['onOff'], commands: ['on'], all_keys: [] }
                    ],
                    child_endpoints: []
                  }
                ]
              }
            : node
        )
      });
    }).as('getNodes');
    cy.intercept({ method: 'GET', url: api('/node/1') }, { body: plugDetails }).as('getDetails');
  });

  it('should list the nodes with their status, firmware and linked devices', () => {
    const i18n = Cypress.env('i18n');
    cy.visit('/dashboard/integration/device/matter/settings');
    cy.wait('@getNodes').then(({ request }) => {
      expect(request.url).to.not.contain('with_clusters');
    });
    cy.get('[data-cy=matter-node-row]').should('have.length', 2);
    cy.contains('[data-cy=matter-node-row]', 'Living room plug')
      .should('contain', 'Gladys Labs · Power strip')
      .and('contain', 'Firmware 2.4.1')
      .find('[data-cy=matter-node-status]')
      .should('contain', i18n.integration.matter.node.status.connected);
    // a node without a name is named after its id, and is offline
    cy.contains('[data-cy=matter-node-row]', 'Node 2')
      .find('[data-cy=matter-node-status]')
      .should('contain', i18n.integration.matter.node.status.offline);
    // the cluster tree is in expert mode only
    cy.get('[data-cy=matter-expert-tree]').should('not.exist');
  });

  it('should open the sheet of a node, identify it and share it', () => {
    const i18n = Cypress.env('i18n');
    cy.intercept(
      { method: 'POST', url: api('/node/1/identify') },
      { body: { success: true, identified_endpoints: 2 } }
    ).as('identify');
    cy.intercept(
      { method: 'POST', url: api('/node/1/share') },
      {
        body: {
          success: true,
          manual_pairing_code: '34970112332',
          qr_pairing_code: 'MT:Y.K90AFN00KA0648G00',
          expires_at: new Date(Date.now() + 900000).toISOString(),
          duration_seconds: 900
        }
      }
    ).as('share');
    cy.visit('/dashboard/integration/device/matter/settings');
    cy.contains('[data-cy=matter-node-row]', 'Living room plug').click();
    cy.wait('@getDetails');
    cy.get('[data-cy=matter-node-sheet]').should('be.visible');
    cy.get('[data-cy=matter-node-firmware]').should('contain', '2.4.1');
    cy.get('[data-cy=matter-node-network]')
      .should('contain', i18n.integration.matter.node.network.types.wifi)
      .and('contain', i18n.integration.matter.node.signal.excellent)
      .and('contain', '-58 dBm')
      .and('contain', '192.168.1.20');
    cy.get('[data-cy=matter-node-controller]').should('have.length', 2);
    cy.contains('[data-cy=matter-node-controller]', 'Gladys Assistant').should(
      'contain',
      i18n.integration.matter.node.controllers.thisController
    );
    cy.contains('[data-cy=matter-node-controller]', 'Apple').should('exist');

    cy.get('[data-cy=matter-node-identify]').click();
    cy.wait('@identify');
    cy.get('[data-cy=matter-node-identify-success]').should('be.visible');

    cy.get('[data-cy=matter-node-share]').click();
    cy.wait('@share');
    cy.get('[data-cy=matter-share-sheet]').should('be.visible');
    cy.get('[data-cy=matter-share-code]').should('contain', '3497-011-2332');
    cy.get('[data-cy=matter-share-qr]').should('have.attr', 'src');
    cy.get('[data-cy=matter-share-close]').click();
    cy.get('[data-cy=matter-share-sheet]').should('not.exist');
  });

  it('should follow the status of a node live in its sheet', () => {
    const i18n = Cypress.env('i18n');
    cy.visit('/dashboard/integration/device/matter/settings');
    cy.contains('[data-cy=matter-node-row]', 'Living room plug').click();
    cy.wait('@getDetails');
    cy.waitForWebSocket();
    cy.sendWebSocket({
      type: 'matter.node-status-changed',
      payload: { node_id: '1', status: 'disconnected', available: false, unreachable_device_paths: [] }
    });
    cy.get('[data-cy=matter-node-unavailable]').should('be.visible');
    cy.get('[data-cy=matter-node-sheet] [data-cy=matter-node-status]').should(
      'contain',
      i18n.integration.matter.node.status.offline
    );
  });

  it('should remove a node from its sheet, with its Gladys devices when asked', () => {
    cy.intercept({ method: 'POST', url: api('/node/1/decommission') }, req => {
      req.reply({
        body: { success: true, forced: false, deleted_devices: plugNode.gladys_devices, failed_devices: [] }
      });
    }).as('decommission');
    cy.visit('/dashboard/integration/device/matter/settings');
    cy.contains('[data-cy=matter-node-row]', 'Living room plug').click();
    cy.wait('@getDetails');
    cy.get('[data-cy=matter-node-remove]').click();
    cy.get('[data-cy=matter-node-remove-confirm]')
      .should('contain', 'Living room plug – Outlet 1')
      .and('contain', 'Living room plug – Outlet 2');
    cy.get('[data-cy=matter-node-remove-devices]').check({ force: true });
    cy.get('[data-cy=confirm-sheet-confirm]').click();
    cy.wait('@decommission').then(({ request }) => {
      expect(request.body.gladys_device_selectors).to.deep.equal(['outlet-1', 'outlet-2']);
    });
    cy.get('[data-cy=matter-node-sheet]').should('not.exist');
    cy.get('.alert-success').should('contain', 'Living room plug');
  });

  it('should show the endpoints and clusters in expert mode', () => {
    cy.visit('/dashboard/integration/device/matter/settings');
    cy.wait('@getNodes');
    cy.get('[data-cy=matter-expert-mode]').click();
    cy.wait('@getNodes').then(({ request }) => {
      expect(request.url).to.contain('with_clusters=true');
    });
    cy.get('[data-cy=matter-expert-tree]')
      .should('be.visible')
      .and('contain', 'MA-onoffpluginunit');
    // the mode is remembered by the browser
    cy.reload();
    cy.get('[data-cy=matter-expert-tree]').should('be.visible');
  });
});
