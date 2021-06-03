describe('Maps view', () => {
  const serverUrl = Cypress.env('serverUrl');
  before(() => {
    cy.login();

    cy.visit('/dashboard/maps');
  });
  after(() => {
    // delete created zone
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/area/my-zone`
    });
  });
  it('Should create new area', () => {
    cy.contains('newArea.createNewZoneButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/maps/area/new`);

    cy.get('input:visible').then(inputs => {
      // Zone name
      cy.wrap(inputs[0]).type('My zone');
      // Radius
      cy.wrap(inputs[1]).type(40);
    });

    cy.get('.leaflet-container').click(390, 250);

    cy.contains('newArea.createButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/maps`);
  });
});
