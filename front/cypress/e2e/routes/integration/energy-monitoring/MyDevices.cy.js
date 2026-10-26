// "My devices" tab of the energy monitoring integration (docs/specs/energy-hierarchy.md, section E):
// the meters and the devices they price, read-only, with a "Meter" select per device.
describe('Energy monitoring devices', () => {
  const serverUrl = Cypress.env('serverUrl');
  const TARIFF = {
    tariff_version: 1,
    components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } }]
  };
  const energyDevice = (name, selector) => ({
    name,
    external_id: selector,
    selector,
    features: [
      {
        name: `${name} index`,
        category: 'energy-sensor',
        type: 'index',
        external_id: `${selector}-index`,
        selector: `${selector}-index`,
        unit: 'kWh',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1000000
      }
    ]
  });
  const createContract = (name, deviceSelector) =>
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/device/${deviceSelector}` }).then(res =>
      cy.request({
        method: 'POST',
        url: `${serverUrl}/api/v1/energy_contract`,
        body: { name, electric_meter_device_id: res.body.id, valid_from: '2025-01-01', currency: 'EUR', tariff: TARIFF }
      })
    );

  // the session is not kept between tests: every test visits the page again
  beforeEach(() => {
    cy.login();
  });

  before(() => {
    cy.login();
    cy.createDevice(energyDevice('Cypress house meter', 'cypress-house-meter'), 'example');
    cy.createDevice(energyDevice('Cypress cabin meter', 'cypress-cabin-meter'), 'example');
    cy.createDevice(energyDevice('Cypress washing machine', 'cypress-washing-machine'), 'example');
  });

  after(() => {
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/energy_contract` }).then(res => {
      cy.wrap(res.body).each(contract =>
        cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/energy_contract/${contract.selector}` })
      );
    });
    cy.deleteDevices('example');
  });

  it('should invite to create a contract when there is no meter', () => {
    cy.visit('/dashboard/integration/device/energy-monitoring');
    cy.get('[data-cy=energy-hierarchy-no-meter]').should('exist');
    cy.get('[data-cy=energy-unattached-card]').should('contain', 'Cypress washing machine');
    cy.get('[data-cy=energy-device-meter-select]').should('not.exist');
  });

  it('should say so when the contracts cannot be loaded, instead of showing every device unattached', () => {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/energy_contract` }, { statusCode: 500, body: {} });
    cy.visit('/dashboard/integration/device/energy-monitoring');
    cy.get('[data-cy=energy-hierarchy-contracts-error]').should('exist');
    cy.get('[data-cy=energy-hierarchy-no-meter]').should('not.exist');
    cy.get('[data-cy=energy-unattached-card]').should('not.exist');
  });

  it('should attach a device to the meter of a contract', () => {
    createContract('Cypress house contract', 'cypress-house-meter');
    cy.visit('/dashboard/integration/device/energy-monitoring');
    cy.get('[data-cy=energy-meter-card]').should('have.length', 1);
    cy.get('[data-cy=energy-meter-card]').should('contain', 'Cypress house meter');
    cy.get('[data-cy=energy-device-row]')
      .contains('[data-cy=energy-device-row]', 'Cypress washing machine')
      .find('[data-cy=energy-device-meter-select]')
      .select('Cypress house meter');
    cy.get('[data-cy=energy-meter-card]').should('contain', 'Cypress washing machine');
  });

  it('should move a device to a second meter', () => {
    createContract('Cypress cabin contract', 'cypress-cabin-meter');
    cy.visit('/dashboard/integration/device/energy-monitoring');
    cy.get('[data-cy=energy-meter-card]').should('have.length', 2);
    cy.get('[data-cy=energy-device-meter-badge]').should('have.length', 2);
    cy.get('[data-cy=energy-device-row]')
      .contains('[data-cy=energy-device-row]', 'Cypress washing machine')
      .find('[data-cy=energy-device-meter-select]')
      .select('Cypress cabin meter');
    cy.get('[data-cy=energy-meter-card]')
      .contains('[data-cy=energy-meter-card]', 'Cypress cabin meter')
      .should('contain', 'Cypress washing machine');
  });
});
