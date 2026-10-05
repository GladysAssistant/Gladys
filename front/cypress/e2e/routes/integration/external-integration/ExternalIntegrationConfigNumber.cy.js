// A `number` field of the `config_schema` grammar holds decimals too (a price,
// a latitude). The integration is stubbed (it would need an installed Docker
// container), everything else is the real app — the shared form engine, the
// browser's own constraint validation, and the request sent to the server.
const SELECTOR = 'ext-dev-pellets';
const CONFIG_URL = `/dashboard/integration/device/external/${SELECTOR}/config`;

const INTEGRATION = {
  id: '6c1b3f0e-2a4d-4b8e-9f3a-1d2c3b4a5e01',
  name: 'Pellets',
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  running: true,
  version: '1.0.0',
  granted_devices: [],
  manifest: {
    name: 'Pellets',
    type: 'device',
    version: '1.0.0',
    config_schema: [
      {
        key: 'price_per_bag',
        type: 'number',
        label: { en: 'Price per bag', fr: 'Prix par sac' },
        min: 0
      },
      {
        key: 'latitude',
        type: 'number',
        label: { en: 'Latitude' },
        default: 48.85,
        min: -90,
        max: 90
      }
    ]
  }
};

describe('External integration - number configuration fields', () => {
  beforeEach(() => {
    cy.login();

    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, INTEGRATION).as('getIntegration');
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}/config`, {
      config: {},
      configured_secrets: []
    }).as('getConfig');
    cy.intercept('POST', `**/api/v1/external_integration/${SELECTOR}/config`, req => {
      req.reply({ config: req.body.config, configured_secrets: [] });
    }).as('saveConfig');
  });

  it('saves a decimal value instead of letting the browser block the form', () => {
    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');

    cy.get('#config_price_per_bag').type('12.5');

    // the HTML default step is 1: a decimal is a step mismatch for the browser,
    // which then silently refuses to submit the form
    cy.get('#config_price_per_bag').then($input => {
      expect($input[0].validity.stepMismatch).to.equal(false);
      expect($input[0].checkValidity()).to.equal(true);
    });
    cy.get('#config_latitude')
      .should('have.value', '48.85')
      .then($input => {
        expect($input[0].checkValidity()).to.equal(true);
      });

    cy.contains('button', 'integration.externalIntegration.config.saveButton').click();

    cy.wait('@saveConfig').then(({ request }) => {
      expect(request.body.config).to.deep.equal({ price_per_bag: 12.5, latitude: 48.85 });
    });
    cy.get('.alert-success')
      .should('exist')
      .i18n('integration.externalIntegration.config.saveSuccess');
  });
});
