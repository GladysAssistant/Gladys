// Phone editing of a dashboard (docs/specs/dashboard-flexible-layout-and-
// widgets.md, A.3 "phone editing"): moving a widget to another section
// without dragging, undoing a removal, the reorganize mode, the leave
// guard, the phone order of a section — and the viewer applying it.
describe('Dashboard editor on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');

  beforeEach(() => {
    cy.login();
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Phone',
        type: 'test',
        selector: 'phone',
        visibility: 'private',
        boxes: [
          {
            columns: [
              [
                { type: 'clock', clock_type: 'digital' },
                { type: 'link', title: 'Second of column 1', url: 'https://gladysassistant.com' }
              ],
              [{ type: 'link', title: 'First of column 2', url: 'https://gladysassistant.com' }]
            ]
          },
          { columns: [[]] }
        ]
      }
    });
    cy.viewport(390, 664);
  });

  afterEach(() => {
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/phone`
    });
  });

  it('Should move a widget to another section, undo a removal and save', () => {
    cy.intercept('PATCH', `${serverUrl}/api/v1/dashboard/phone`).as('saveDashboard');
    cy.visit('/dashboard/phone/edit');

    // "Move to…": the second section's only column, the widget lands there
    cy.get('[data-cy="move-to-box-0-0"]').click();
    cy.get('[data-cy="move-box-form"]').should('be.visible');
    cy.get('[data-cy="move-target-0"]').should('be.disabled');
    cy.get('[data-cy="move-target-2"]').click();
    cy.get('[data-cy="edit-panel"]').should('not.exist');
    cy.get('[data-widget-wrapper][data-x="2"][data-y="0"]').should('exist');

    // removing asks nothing and can be undone from the toast
    cy.get('[data-cy="remove-box-1-0"]').click();
    cy.get('[data-widget-wrapper][data-x="1"]').should('have.length', 0);
    cy.get('[data-cy="widget-undo"] button').click();
    cy.get('[data-widget-wrapper][data-x="1"]').should('have.length', 1);

    // the phone order of the first section
    cy.get('[data-cy="section-mobile-order-0"]').click();

    cy.contains('button', Cypress.env('i18n').dashboard.editDashboardSaveButton).click();
    cy.wait('@saveDashboard').then(({ request }) => {
      const [first, second] = request.body.boxes;
      expect(first.mobile_order).to.equal('rows');
      expect(first.columns[0].map(box => box.type)).to.deep.equal(['link']);
      expect(second.columns[0].map(box => box.type)).to.deep.equal(['clock']);
      expect(second).to.not.have.property('mobile_order');
    });
  });

  it('Should withdraw the undo of a removal once the layout changes', () => {
    cy.visit('/dashboard/phone/edit');
    cy.get('[data-cy="remove-box-1-0"]').click();
    cy.get('[data-cy="widget-undo"]').should('be.visible');
    // the phone order is restored by Undo too: changing it withdraws the
    // offer, so Undo can never revert it along with the widget
    cy.get('[data-cy="section-mobile-order-0"]').click();
    cy.get('[data-cy="widget-undo"]').should('not.exist');
  });

  it('Should ask before creating a dashboard with unsaved changes', () => {
    cy.intercept('POST', `${serverUrl}/api/v1/dashboard`).as('createDashboard');
    cy.visit('/dashboard/phone/edit');
    cy.get('[data-cy="move-box-down-0-0"]').click();

    cy.get('[data-cy="new-dashboard-button"]').click();
    cy.get('[data-cy="edit-panel"] form input[type="text"]')
      .first()
      .type('Not created');
    cy.get('input[name="icon"][value="home"]').check({ force: true });
    cy.get('[data-cy="edit-panel"]')
      .contains('button', Cypress.env('i18n').newDashboard.createDashboardButton)
      .click();

    // asked before the POST: staying creates nothing
    cy.get('[data-cy="leave-confirm"]').should('be.visible');
    cy.get('[data-cy="leave-confirm-stay"]').click();
    cy.get('[data-cy="leave-confirm"]').should('not.exist');
    cy.get('@createDashboard.all').should('have.length', 0);
    // and the form being filled is still there
    cy.get('[data-cy="edit-panel"] form input[type="text"]')
      .first()
      .should('have.value', 'Not created');
    cy.url().should('match', /\/dashboard\/phone\/edit$/);
  });

  it('Should ask above the mobile menu when one of its links is tapped', () => {
    cy.visit('/dashboard/phone/edit');
    cy.get('[data-cy="move-box-down-0-0"]').click();
    cy.get('[data-cy="sidebar-toggler"]').click();
    cy.get('[data-cy="sidebar-nav"] a[href="/dashboard/scene"]').click();
    // the dialog is the topmost element where it is drawn, not the drawer
    cy.get('[data-cy="leave-confirm-stay"]').then($stay => {
      const rect = $stay[0].getBoundingClientRect();
      const top = $stay[0].ownerDocument.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      expect($stay[0].contains(top)).to.equal(true);
    });
    cy.get('[data-cy="leave-confirm-stay"]').click();
    cy.url().should('match', /\/dashboard\/phone\/edit$/);
  });

  it('Should collapse the widgets in reorganize mode', () => {
    cy.visit('/dashboard/phone/edit');
    cy.get('[data-cy="reorganize-button"]').click();
    cy.get('[data-cy="reorganize-button"]').should('have.attr', 'aria-pressed', 'true');
    // only the toolbar rows remain: no widget content, no in-between "+"
    cy.get('[data-widget-wrapper] [class*="previewContent"]').should('not.be.visible');
    cy.get('[data-cy="move-box-down-0-0"]').click();
    // the clock went down: the link that was second is now first
    cy.get('[data-widget-wrapper][data-x="0"][data-y="0"]').should('contain', 'Second of column 1');
    cy.get('[data-cy="reorganize-button"]').click();
    cy.get('[data-cy="reorganize-button"]').should('have.attr', 'aria-pressed', 'false');
  });

  it('Should ask before leaving with unsaved changes', () => {
    cy.visit('/dashboard/phone/edit');
    cy.get('[data-cy="move-box-down-0-0"]').click();

    // Cancel asks first; staying keeps the editor and the change
    cy.get('[data-cy="edit-cancel-button"]').click();
    cy.get('[data-cy="leave-confirm"]').should('be.visible');
    cy.get('[data-cy="leave-confirm-stay"]').click();
    cy.get('[data-cy="leave-confirm"]').should('not.exist');
    cy.url().should('match', /\/dashboard\/phone\/edit$/);

    // the browser's back button asks too
    // (history.back rather than cy.go: no page load follows a pushState entry)
    cy.window().then(win => win.history.back());
    cy.get('[data-cy="leave-confirm"]').should('be.visible');
    cy.get('[data-cy="leave-confirm-stay"]').click();
    cy.url().should('match', /\/dashboard\/phone\/edit$/);

    // leaving discards the change
    cy.get('[data-cy="edit-cancel-button"]').click();
    cy.get('[data-cy="leave-confirm-leave"]').click();
    cy.url().should('match', /\/dashboard\/phone$/);
  });

  it('Should show a row-ordered section row by row on a phone', () => {
    cy.request({
      method: 'PATCH',
      url: `${serverUrl}/api/v1/dashboard/phone`,
      body: {
        boxes: [
          {
            columns: [
              [
                { type: 'link', title: 'Row 1 column 1', url: 'https://gladysassistant.com' },
                { type: 'link', title: 'Row 2 column 1', url: 'https://gladysassistant.com' }
              ],
              [{ type: 'link', title: 'Row 1 column 2', url: 'https://gladysassistant.com' }]
            ],
            mobile_order: 'rows'
          }
        ]
      }
    });
    cy.visit('/dashboard/phone');
    cy.get('[data-mobile-order="rows"]').should('exist');
    // reading order on screen: row 1 of both columns, then row 2
    cy.contains('Row 1 column 1').then($a => {
      cy.contains('Row 1 column 2').then($b => {
        cy.contains('Row 2 column 1').then($c => {
          const top = $el => $el[0].getBoundingClientRect().top;
          expect(top($a)).to.be.lessThan(top($b));
          expect(top($b)).to.be.lessThan(top($c));
        });
      });
    });
  });
});
