// Contracts tab of the energy monitoring integration (docs/specs/energy-contracts.md 8.2):
// a manual contract is created through the wizard against the real server, previewed
// over a synthetic profile (the meter has no consumption), saved, listed and deleted.
describe('Energy monitoring contracts', () => {
  const serverUrl = Cypress.env('serverUrl');
  const METER = {
    name: 'Cypress meter',
    external_id: 'cypress-meter',
    selector: 'cypress-meter',
    features: [
      {
        name: 'Index',
        category: 'energy-sensor',
        type: 'index',
        external_id: 'cypress-meter-index',
        selector: 'cypress-meter-index',
        unit: 'kWh',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1000000
      }
    ]
  };

  before(() => {
    cy.login();
    cy.createDevice(METER, 'example');
    cy.visit('/dashboard/integration/device/energy-monitoring/contracts');
  });

  beforeEach(() => {
    // the community catalogue is fetched from GitHub on a real instance: stub it out
    // (intercepts are cleared before every test, so the stub is declared here)
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/energy_contract/template` }, { body: [] });
  });

  after(() => {
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/energy_contract` }).then(res => {
      cy.wrap(res.body).each(contract =>
        cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/energy_contract/${contract.selector}` })
      );
    });
    cy.deleteDevices('example');
  });

  it('should show the empty state', () => {
    cy.get('[data-cy=energy-contract-empty]').should('exist');
  });

  it('should create a manual contract through the wizard', () => {
    cy.get('[data-cy=energy-contract-create]').click();
    cy.get('[data-cy=energy-contract-meter]').select('Cypress meter');
    cy.get('[data-cy=energy-contract-next]').click();
    cy.get('[data-cy=energy-contract-manual]').click();
    cy.get('[data-cy=energy-contract-name]').clear();
    cy.get('[data-cy=energy-contract-name]').type('Cypress flat rate');
    cy.get('[data-cy=energy-contract-valid-from]').clear();
    cy.get('[data-cy=energy-contract-valid-from]').type('2025-01-01');
    cy.get('[data-cy=energy-contract-tariff-json]').should('contain.value', '"tariff_version": 1');
    cy.get('[data-cy=energy-contract-preview]').click();
    cy.get('[data-cy=energy-contract-preview-result]').should('exist');
    cy.get('[data-cy=energy-contract-save]').click();
    cy.get('[data-cy=energy-contract-row]').should('have.length', 1);
    cy.get('[data-cy=energy-contract-row]').should('contain', 'Cypress flat rate');
  });

  it('should refuse a second contract overlapping the first one', () => {
    cy.get('[data-cy=energy-contract-create]').click();
    cy.get('[data-cy=energy-contract-meter]').select('Cypress meter');
    cy.get('[data-cy=energy-contract-next]').click();
    cy.get('[data-cy=energy-contract-manual]').click();
    cy.get('[data-cy=energy-contract-name]').clear();
    cy.get('[data-cy=energy-contract-name]').type('Overlapping');
    cy.get('[data-cy=energy-contract-preview]').click();
    cy.get('[data-cy=energy-contract-preview-result]').should('exist');
    cy.get('[data-cy=energy-contract-save]').click();
    cy.get('[data-cy=energy-contract-save-error]').should('contain', 'already covers');
  });

  it('should delete the contract', () => {
    // the local storage is cleared between tests: log in again before reloading the page
    cy.login();
    cy.visit('/dashboard/integration/device/energy-monitoring/contracts');
    cy.on('window:confirm', () => true);
    cy.get('[data-cy=energy-contract-row]')
      .first()
      .within(() => {
        cy.get('button.btn-outline-danger').click();
      });
    cy.get('[data-cy=energy-contract-empty]').should('exist');
  });
});
