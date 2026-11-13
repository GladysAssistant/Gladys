// The navigation rail collapsed on desktop (docs/specs/dashboard-flexible-
// layout-and-widgets.md, H2): a per-device preference that gives the rail's
// column back to the page, and leaves the mobile drawer alone.
describe('Collapsible sidebar', () => {
  const pagePaddingLeft = () =>
    cy
      .get('#app > .page')
      .then($page => parseFloat($page[0].ownerDocument.defaultView.getComputedStyle($page[0]).paddingLeft));

  beforeEach(() => {
    cy.login();
  });

  it('Should collapse the rail, keep it collapsed after a reload, and expand it again', () => {
    cy.viewport(1280, 800);
    cy.visit('/dashboard');

    // default: the docked rail, and no expand button
    cy.get('[data-cy="sidebar-nav"]').should('be.visible');
    cy.get('[data-cy="sidebar-expand-button"]').should('not.exist');
    pagePaddingLeft().should('equal', 240);

    cy.get('[data-cy="sidebar-collapse-button"]').click();

    // the rail is gone and the page only keeps the gutter of the expand
    // button, which takes over the focus the chevron just lost
    cy.get('[data-cy="sidebar-nav"]').should('not.be.visible');
    cy.get('[data-cy="sidebar-expand-button"]')
      .should('be.visible')
      .and('have.focus');
    cy.get('body').should('not.have.class', 'gladys-sidebar-animating');
    pagePaddingLeft().should('equal', 52);
    cy.window().then(win => {
      expect(win.localStorage.getItem('sidebar-collapsed')).to.equal('true');
    });

    // a preference of the device: still collapsed after a reload
    cy.reload();
    cy.get('[data-cy="sidebar-expand-button"]').should('be.visible');
    cy.get('[data-cy="sidebar-nav"]').should('not.be.visible');
    pagePaddingLeft().should('equal', 52);

    cy.get('[data-cy="sidebar-expand-button"]').click();

    // back to the docked rail beside the content: no overlay, no backdrop
    cy.get('[data-cy="sidebar-expand-button"]').should('not.exist');
    cy.get('[data-cy="sidebar-nav"]').should('be.visible');
    cy.get('[data-cy="sidebar-collapse-button"]').should('have.focus');
    cy.get('body').should('not.have.class', 'gladys-sidebar-animating');
    pagePaddingLeft().should('equal', 240);
    cy.window().then(win => {
      expect(win.localStorage.getItem('sidebar-collapsed')).to.equal('false');
    });
  });

  it('Should leave the mobile drawer alone when the rail is collapsed', () => {
    cy.viewport(390, 664);
    cy.visit('/dashboard', {
      onBeforeLoad: win => {
        win.localStorage.setItem('sidebar-collapsed', 'true');
      }
    });

    // below the desktop breakpoint neither control is offered, and the page
    // keeps no gutter for a button that is not there
    cy.get('[data-cy="sidebar-expand-button"]').should('not.be.visible');
    cy.get('[data-cy="sidebar-collapse-button"]').should('not.be.visible');
    pagePaddingLeft().should('equal', 0);

    // the burger still opens the drawer, and Escape closes it
    cy.get('[data-cy="sidebar-toggler"]').click();
    cy.get('[data-cy="sidebar-nav"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[data-cy="sidebar-nav"]').should('not.be.visible');
  });
});
