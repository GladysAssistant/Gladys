// Forum 10749: the "add a device" select at the bottom of the Devices widget
// editor opened a menu whose bottom ran past the edge of the screen, and the
// options down there could not be selected. react-select placed the menu once,
// at open, against the options the filter left at that moment: a menu opened
// short fit below the control, then grew past the viewport when the filter
// was erased. The shared Select wrapper now places the menu against the
// control and the visible viewport alone.
describe('Dashboard Devices Box select', () => {
  const serverUrl = Cypress.env('serverUrl');
  // enough features for the full menu to be taller than the room left under
  // a control placed near the bottom of a short screen
  const FEATURE_COUNT = 8;
  beforeEach(() => {
    cy.login();

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [
          [
            {
              type: 'devices',
              name: 'Sensors',
              device_features: []
            }
          ],
          [],
          []
        ]
      }
    });

    const device = {
      name: 'Multi sensor',
      external_id: 'multi-sensor',
      selector: 'multi-sensor',
      features: Array.from({ length: FEATURE_COUNT }, (_, index) => ({
        name: `Probe ${index + 1}`,
        category: 'temperature-sensor',
        type: 'decimal',
        external_id: `multi-sensor-probe-${index + 1}`,
        selector: `multi-sensor-probe-${index + 1}`,
        unit: 'celsius',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: -50,
        max: 100
      }))
    };
    cy.createDevice(device, 'example');
  });
  afterEach(() => {
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });
  it('Should keep the menu on screen when the option list grows back', () => {
    cy.viewport(1280, 700);
    cy.visit('/dashboard/test/edit');
    cy.get('[data-cy="edit-box-0-0"]').click();

    // the screen ends 90px under the control: room for a one-line "no
    // options" menu below it, not for the full list
    cy.get('[data-cy="edit-panel"] .react-select__control').then($control => {
      const { bottom } = $control[0].getBoundingClientRect();
      cy.viewport(1280, Math.round(bottom) + 90);
    });

    cy.get('[data-cy="edit-panel"] .react-select__control').click();
    // react-select's search input is a 2px-wide autosize input under the
    // placeholder: Cypress deems it covered, force: true types into it anyway
    cy.get('[data-cy="edit-panel"] .react-select__input input').type('{esc}zzz', { force: true });
    cy.get('.react-select__menu-portal .react-select__menu-notice--no-options').should('be.visible');

    cy.get('[data-cy="edit-panel"] .react-select__input input').type('{backspace}{backspace}{backspace}', {
      force: true
    });
    const lastOption = `Multi sensor (Probe ${FEATURE_COUNT})`;
    cy.contains('.react-select__menu-portal .react-select__option', lastOption).should('exist');

    // the whole menu is on screen…
    cy.get('.react-select__menu-portal .react-select__menu').should($menu => {
      const { top, bottom } = $menu[0].getBoundingClientRect();
      expect(top).to.be.at.least(0);
      expect(bottom).to.be.at.most(Cypress.config('viewportHeight'));
    });

    // …and the option at the end of the list can be reached and picked. The
    // list is scrolled itself (a scroll inside the menu keeps it open) and the
    // click must not scroll anything else: a portaled menu closes on any
    // other scroll (closeMenuOnScroll), so Cypress's default scrollBehavior
    // would close the menu it is about to click — same as Scene.cy.js
    cy.get('.react-select__menu-portal .react-select__menu-list').scrollTo('bottom');
    cy.contains('.react-select__menu-portal .react-select__option', lastOption).click({ scrollBehavior: false });
    cy.get('[data-cy="edit-panel"]').should('contain', lastOption);
  });
});
