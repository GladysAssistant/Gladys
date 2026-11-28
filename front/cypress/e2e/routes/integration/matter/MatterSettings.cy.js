// Matter settings page: every node shows its manufacturer and its connection status, and the page
// is translated (the detail of the endpoints and clusters included).
describe('Matter settings', () => {
  const serverUrl = Cypress.env('serverUrl');
  const i18n = Cypress.env('i18n');
  const nodeI18n = i18n.integration.matter.settings.node;
  // the translation of a key, with its {{fields}} filled
  const translate = (text, fields = {}) =>
    Object.keys(fields).reduce((result, field) => result.replace(`{{${field}}}`, fields[field]), text);

  const connectedNode = {
    node_id: '1',
    is_connected: true,
    gladys_devices: [],
    node_information: {
      vendor_name: 'Eve Systems',
      product_name: 'Eve Thermo',
      product_label: 'Eve Thermo',
      vendor_id: 4874,
      product_id: 79
    },
    devices: [
      {
        name: 'MA-thermostat',
        number: '1',
        cluster_clients: [
          {
            id: '513',
            name: 'Thermostat',
            attributes: ['localTemperature', 'systemMode'],
            commands: ['setpointRaiseLower'],
            all_keys: ['id', 'name', 'endpointId']
          }
        ],
        child_endpoints: [
          {
            name: 'MA-tempsensor',
            number: '2',
            cluster_clients: [],
            child_endpoints: []
          }
        ]
      }
    ]
  };
  // a node that publishes no manufacturer name, and that does not answer
  const disconnectedNode = {
    node_id: '2',
    is_connected: false,
    gladys_devices: [],
    node_information: {
      vendor_name: '',
      product_name: 'Smart Valve',
      vendor_id: 65521,
      product_id: 32769
    },
    devices: []
  };

  beforeEach(() => {
    cy.login();
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/matter/variable/MATTER_ENABLED` },
      { body: { value: 'true' } }
    );
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/matter/ipv6` },
      { body: { has_ipv6: true, ipv6_interfaces: [] } }
    );
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/matter/node*` },
      { body: [connectedNode, disconnectedNode] }
    ).as('getNodes');
    cy.visit('/dashboard/integration/device/matter/settings');
    cy.wait('@getNodes');
  });

  it('should show the manufacturer and the connection status of each node', () => {
    cy.contains('h5', 'Eve Systems - Eve Thermo')
      .parents('.card')
      .first()
      .within(() => {
        cy.get('[data-cy=matter-node-connection-status]')
          .should('have.class', 'tag-success')
          .and('contain', nodeI18n.connected);
        cy.get('[data-cy=matter-node-information]')
          .should('contain', translate(nodeI18n.manufacturer, { name: 'Eve Systems' }))
          .and('contain', translate(nodeI18n.product, { name: 'Eve Thermo' }))
          .and('contain', translate(nodeI18n.ids, { nodeId: '1', vendorId: 4874, productId: 79 }));
      });

    // no dangling " - " before the product when the node publishes no manufacturer
    cy.contains('h5', 'Smart Valve')
      .should('not.contain', ' - ')
      .parents('.card')
      .first()
      .within(() => {
        cy.get('[data-cy=matter-node-connection-status]')
          .should('have.class', 'tag-danger')
          .and('contain', nodeI18n.disconnected);
        cy.get('[data-cy=matter-node-information]').should('contain', nodeI18n.unknownManufacturer);
      });
  });

  it('should translate the endpoints and clusters of a node', () => {
    cy.contains('h6', translate(nodeI18n.device, { name: 'MA-thermostat', number: '1' })).click();

    cy.get('table thead')
      .should('contain', nodeI18n.clusterId)
      .and('contain', nodeI18n.clusterName)
      .and('contain', nodeI18n.attributes)
      .and('contain', nodeI18n.commands)
      .and('contain', i18n.integration.matter.settings.actionsLabel);
    cy.contains('h6', translate(nodeI18n.device, { name: 'MA-tempsensor', number: '2' })).should(
      'contain',
      nodeI18n.childEndpoint
    );

    cy.contains('button', nodeI18n.showKeys).click();
    cy.contains(nodeI18n.allKeys).should('exist');
    cy.contains('button', nodeI18n.hideKeys).should('exist');
  });
});
