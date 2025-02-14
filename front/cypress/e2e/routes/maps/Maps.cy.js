describe('Maps view', () => {
  beforeEach(() => {
    cy.login();
  });
  it('Should create new area', () => {
    cy.visit('/dashboard/maps');
    cy.contains('newArea.createNewZoneButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/maps/area/new`);

    cy.get('input:visible').then(inputs => {
      // Zone name
      cy.wrap(inputs[0]).type('My zone');
      // Radius
      cy.wrap(inputs[1]).clear();
      cy.wrap(inputs[1]).type(4000);
    });

    const i18n = Cypress.env('i18n');

    cy.get('#react-select-color-picker').click();
    cy.get('#react-select-color-picker').type(`${i18n.color.green}{enter}`);

    cy.get('.leaflet-container').click(390, 250);

    cy.contains('newArea.createButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/maps`);
  });
  it('Should edit existing area', () => {
    cy.login();
    cy.visit('/dashboard/maps/area/edit/my-zone');

    cy.get('input:visible').then(inputs => {
      // Zone name
      cy.wrap(inputs[0]).as('zoneInput');
      cy.get('@zoneInput').clear();
      cy.get('@zoneInput').type('My zone edited');

      // Radius
      cy.wrap(inputs[1]).as('radiusInput');
      cy.get('@radiusInput').clear();
      cy.get('@radiusInput').type(5000);
    });

    cy.get('.leaflet-container').click(200, 250);

    cy.contains('newArea.updateButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/maps`);
  });
  it('Should delete existing area', () => {
    cy.login();
    cy.visit('/dashboard/maps/area/edit/my-zone');

    cy.contains('newArea.deleteButton')
      .should('have.class', 'btn-danger')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/maps`);
  });
});
