// A zone drawn on a phone (docs/specs/mobile-pages/map-areas.md). The finger gestures — the zone
// dragged to be moved, its handle dragged to resize it — need a touch screen: they are checked in
// a phone emulation with real touch events. Every one of them has the equivalent driven here.
describe('Map zones on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const selector = 'phone-zone';
  const editUrl = `/dashboard/maps/area/edit/${selector}`;

  const deleteZone = () =>
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/area/${selector}`, failOnStatusCode: false });

  before(() => {
    cy.login();
    deleteZone();
  });

  beforeEach(() => {
    cy.login();
    cy.viewport('iphone-x');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/area` }).as('createArea');
    cy.intercept({ method: 'PATCH', url: `${serverUrl}/api/v1/area/${selector}` }).as('updateArea');
    cy.intercept({ method: 'DELETE', url: `${serverUrl}/api/v1/area/${selector}` }).as('deleteArea');
  });

  after(() => {
    cy.login();
    deleteZone();
  });

  it('should open the zone page from the map, with a thumb', () => {
    cy.visit('/dashboard/maps');
    // the action sits in the lower half of the screen
    cy.get('[data-cy=map-create-zone]')
      .should('be.visible')
      .then($button => {
        expect($button[0].getBoundingClientRect().top).to.be.greaterThan(Cypress.config('viewportHeight') / 2);
      });
    cy.get('[data-cy=map-create-zone]').click();

    cy.location('pathname').should('eq', '/dashboard/maps/area/new');
    cy.get('[data-cy=zone-mobile]').should('exist');
    // a focus page: the navigation bar of the page replaces the top bar of the app
    cy.get('.gladys-mobile-top-bar').should('not.be.visible');
    cy.get('[data-cy=mobile-nav-back]').i18n('newArea.mobile.backLabel');
    // the map and the form are both on screen: nothing to scroll
    cy.get('[data-cy=zone-map]').should('be.visible');
    cy.get('[data-cy=zone-save]').should('be.visible');
    // no field triggers the iOS zoom
    cy.get('[data-cy=zone-radius]').should('have.css', 'font-size', '16px');
  });

  it('should say what is missing, then create the zone', () => {
    cy.visit('/dashboard/maps/area/new');
    cy.get('[data-cy=zone-mobile] .leaflet-container').should('exist');

    // nothing can be saved yet, and the panel says why
    cy.get('[data-cy=zone-save]').should('be.disabled');
    cy.get('[data-cy=zone-missing]').i18n('newArea.mobile.missing.center');

    // a tap on the map places the zone
    cy.get('[data-cy=zone-map]').click(140, 110);
    cy.get('[data-cy=zone-map] path.leaflet-interactive').should('exist');
    cy.get('[data-cy=zone-missing]').i18n('newArea.mobile.missing.name');
    cy.get('[data-cy=zone-save]').should('be.disabled');

    // the radius, typed then stepped
    cy.get('[data-cy=zone-radius]').clear();
    cy.get('[data-cy=zone-missing]').i18n('newArea.mobile.missing.radius');
    cy.get('[data-cy=zone-radius]').type('250');
    cy.get('[data-cy=zone-radius-slider]').should('have.attr', 'aria-valuetext', '250 m');
    cy.get('[data-cy=zone-map] .leaflet-tooltip').should('contain', '250 m');
    cy.get('[data-cy=zone-radius-plus]').click();
    cy.get('[data-cy=zone-radius]').should('have.value', '260');
    cy.get('[data-cy=zone-radius-minus]').click();
    cy.get('[data-cy=zone-radius-minus]').click();
    cy.get('[data-cy=zone-radius]').should('have.value', '240');

    // the name and the color, in their sheet
    cy.get('[data-cy=zone-details]').i18n('newArea.mobile.nameMissing');
    cy.get('[data-cy=zone-details]').click();
    cy.get('[data-cy=zone-details-sheet]').should('be.visible');
    cy.get('[data-cy=zone-name]').type('Phone zone');
    cy.get('[data-cy=zone-color-green]').click();
    cy.get('[data-cy=zone-color-green]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-cy=zone-color-blue]').should('have.attr', 'aria-pressed', 'false');
    cy.get('[data-cy=zone-details-sheet] [data-cy=sheet-ok]').click();
    cy.get('[data-cy=zone-details-sheet]').should('not.exist');

    cy.get('[data-cy=zone-details]').should('contain', 'Phone zone');
    cy.get('[data-cy=zone-missing]').should('not.exist');
    cy.get('[data-cy=zone-save]').should('not.be.disabled');
    cy.get('[data-cy=zone-save]').click();

    cy.wait('@createArea').then(({ request, response }) => {
      expect(response.statusCode).to.eq(201);
      expect(request.body.name).to.eq('Phone zone');
      expect(request.body.color).to.eq('#2ecc71');
      expect(request.body.radius).to.eq(240);
      expect(request.body.latitude).to.be.a('number');
      expect(request.body.longitude).to.be.a('number');
      expect(request.body.longitude).to.be.within(-180, 180);
    });
    cy.location('pathname').should('eq', '/dashboard/maps');
  });

  it('should ask before leaving a zone that changed', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=zone-map] path.leaflet-interactive').should('exist');
    cy.get('[data-cy=zone-mobile]').should('contain', 'Phone zone');
    // nothing changed: nothing to save
    cy.get('[data-cy=zone-save]').should('be.disabled');

    cy.get('[data-cy=zone-radius-plus]').click();
    cy.get('[data-cy=zone-radius]').should('have.value', '250');
    cy.get('[data-cy=zone-save]').should('not.be.disabled');

    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=zone-leave-confirm]').should('be.visible');
    cy.get('[data-cy=zone-leave-keep-editing]').click();
    cy.get('[data-cy=zone-leave-confirm]').should('not.exist');
    cy.location('pathname').should('eq', editUrl);

    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=zone-leave-discard]').click();
    cy.location('pathname').should('eq', '/dashboard/maps');
  });

  it('should leave at once a zone that did not change', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=zone-map] path.leaflet-interactive').should('exist');
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.location('pathname').should('eq', '/dashboard/maps');
  });

  it('should edit a zone — name, color, radius from the slider, place — and save it when leaving', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=zone-map] path.leaflet-interactive').should('exist');

    cy.get('[data-cy=zone-details]').click();
    cy.get('[data-cy=zone-name]').clear();
    cy.get('[data-cy=zone-name]').type('Phone zone edited');
    cy.get('[data-cy=zone-color-purple]').click();
    cy.get('[data-cy=zone-details-sheet] [data-cy=sheet-ok]').click();

    // the slider is logarithmic: its middle is a few hundred meters, its end 50 km
    cy.get('[data-cy=zone-radius-slider]')
      .invoke('val', 1000)
      .trigger('input');
    cy.get('[data-cy=zone-radius]').should('have.value', '50000');
    cy.get('[data-cy=zone-radius-plus]').should('be.disabled');
    cy.get('[data-cy=zone-radius-slider]')
      .invoke('val', 500)
      .trigger('input');
    cy.get('[data-cy=zone-radius]').should('have.value', '700');
    cy.get('[data-cy=zone-map] .leaflet-tooltip').should('contain', '700 m');

    cy.get('[data-cy=zone-map]').click(40, 60);

    cy.get('[data-cy=zone-save]').i18n('newArea.updateButton');
    cy.get('[data-cy=zone-save]').should('not.be.disabled');
    // leaving offers to save: the zone is saved, then the page goes back to the map
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=zone-leave-save]').click();
    cy.wait('@updateArea').then(({ request, response }) => {
      expect(response.statusCode).to.eq(200);
      expect(request.body.name).to.eq('Phone zone edited');
      expect(request.body.color).to.eq('#8e44ad');
      expect(request.body.radius).to.eq(700);
      expect(request.body.latitude).to.be.a('number');
    });
    cy.location('pathname').should('eq', '/dashboard/maps');
  });

  it('should delete a zone only after a confirmation', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=zone-map] path.leaflet-interactive').should('exist');

    cy.get('[data-cy=zone-delete]').click();
    cy.get('[data-cy=zone-delete-confirm]')
      .should('be.visible')
      .and('contain', 'Phone zone edited');
    cy.get('[data-cy=zone-delete-confirm] [data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=zone-delete-confirm]').should('not.exist');
    cy.location('pathname').should('eq', editUrl);

    cy.get('[data-cy=zone-delete]').click();
    cy.get('[data-cy=zone-delete-confirm] [data-cy=confirm-sheet-confirm]').click();
    cy.wait('@deleteArea')
      .its('response.statusCode')
      .should('eq', 200);
    cy.location('pathname').should('eq', '/dashboard/maps');
  });

  it('should keep the form on a wider screen', () => {
    cy.viewport(1280, 800);
    cy.visit('/dashboard/maps/area/new');
    cy.get('#react-select-color-picker').should('exist');
    cy.get('[data-cy=zone-mobile]').should('not.exist');
    cy.contains('newArea.createButton').should('have.class', 'btn-primary');
  });
});
