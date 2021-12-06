describe('Withings Empty device list', () => {
  before(() => {
    cy.login();

    cy.visit('/dashboard/integration/health/withings/device');
  });

  it('Check Empty device page', () => {
    cy.get('.alert-info').i18n('integration.withings.device.noDevices');
  });

  it('Check right menu  page', () => {
    cy.contains('a', 'integration.withings.device.menu').should(
      'have.attr',
      'href',
      '/dashboard/integration/health/withings/device'
    );

    cy.get('.list-group-item-action').i18n('integration.withings.settings.menu');

    cy.contains('a', 'integration.withings.documentation').should('exist');
    cy.contains('a', 'integration.withings.officialWebSite').should('have.attr', 'href', 'https://www.withings.com/');
  });
});
