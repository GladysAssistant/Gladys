// The list fields of the house-view, chips and actions boxes are capped by the
// server (DASHBOARD_BOX_MAX_ITEMS in server/utils/constants.js). The editor
// must stop adding entries at the cap and say why, instead of letting the
// save fail with the generic "dashboard is not valid" message (#3357).
const MAX_PINS = 50;
const MAX_CHIPS = 20;
const MAX_ACTIONS = 20;

const range = count => Array.from({ length: count }, (_, index) => index);

// one entry short of each cap, so the test adds the last one itself
const BOXES = [
  [
    {
      type: 'house-view',
      image: 'gallery:house-solar',
      // pins on a low line of the plan, away from where the test clicks
      pins: range(MAX_PINS - 1).map(index => ({
        x_pct: 1 + index * 2,
        y_pct: 90,
        device_feature: `cypress-pin-feature-${index}`
      }))
    }
  ],
  [
    {
      type: 'chips',
      chips: range(MAX_CHIPS - 1).map(() => ({ chip_type: 'alarm' }))
    }
  ],
  [
    {
      type: 'actions',
      actions: range(MAX_ACTIONS - 1).map(index => ({ action_type: 'scene', scene: `cypress-scene-${index}` }))
    }
  ]
];

const message = (box, key, max) => Cypress.env('i18n').dashboard.boxes[box][key].replace('{{max}}', max);

// The edit panel is a fixed, scrolling sheet: the message can sit below its
// fold (the entry just added pushes it down), so scroll to it first.
const shouldShowMessage = text => {
  cy.contains('[data-cy="edit-panel"] .alert', text).scrollIntoView();
  cy.contains('[data-cy="edit-panel"] .alert', text).should('be.visible');
};

describe('Dashboard editor list caps', () => {
  let dashboardSelector;

  beforeEach(() => {
    cy.login();
    cy.request({
      method: 'POST',
      url: `${Cypress.env('serverUrl')}/api/v1/dashboard`,
      body: {
        name: 'List caps',
        type: 'main',
        visibility: 'private',
        boxes: [{ columns: BOXES }]
      }
    })
      .its('body.selector')
      .then(selector => {
        dashboardSelector = selector;
        cy.visit(`/dashboard/${selector}/edit`);
      });
  });

  afterEach(() => {
    if (dashboardSelector) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('serverUrl')}/api/v1/dashboard/${dashboardSelector}`
      });
      dashboardSelector = null;
    }
  });

  it('stops placing house-view pins at the maximum and says why', () => {
    const pinMarkers = '[data-cy="edit-panel"] span[role="button"][aria-label^="Pin "]';
    const maxPinsMessage = message('house-view', 'maxPinsReached', MAX_PINS);

    cy.get('[data-cy="edit-box-0-0"]').click();
    cy.get(pinMarkers).should('have.length', MAX_PINS - 1);
    cy.contains(maxPinsMessage).should('not.exist');

    // the plan is the image the pin markers sit on (the gallery illustrations
    // are inlined as data URIs, so their src says nothing)
    const plan = () =>
      cy
        .get(pinMarkers)
        .first()
        .siblings('img');

    // the last pin the box can hold
    plan().click(20, 20);
    cy.get(pinMarkers).should('have.length', MAX_PINS);
    shouldShowMessage(maxPinsMessage);

    // one more click on the plan places nothing
    plan().click(40, 20);
    cy.get(pinMarkers).should('have.length', MAX_PINS);

    // removing a pin gives the room back
    cy.get('[data-cy="edit-panel"] .card-body .card .btn-outline-danger')
      .first()
      .click();
    cy.get(pinMarkers).should('have.length', MAX_PINS - 1);
    cy.contains(maxPinsMessage).should('not.exist');
  });

  it('stops adding chips at the maximum and says why', () => {
    const maxChipsMessage = message('chips', 'maxChipsReached', MAX_CHIPS);

    cy.get('[data-cy="edit-box-1-0"]').click();
    cy.contains('[data-cy="edit-panel"] button', 'dashboard.boxes.chips.addChipButton')
      .should('not.be.disabled')
      .click();
    cy.get('[data-cy="edit-panel"] button[aria-label^="Remove chip "]').should('have.length', MAX_CHIPS);
    cy.contains('[data-cy="edit-panel"] button', 'dashboard.boxes.chips.addChipButton').should('be.disabled');
    shouldShowMessage(maxChipsMessage);
  });

  it('stops adding actions at the maximum and says why', () => {
    const maxActionsMessage = message('actions', 'maxActionsReached', MAX_ACTIONS);

    cy.get('[data-cy="edit-box-2-0"]').click();
    cy.contains('[data-cy="edit-panel"] button', 'dashboard.boxes.actions.addActionButton')
      .should('not.be.disabled')
      .click();
    cy.get('[data-cy="edit-panel"] button[aria-label^="Remove action "]').should('have.length', MAX_ACTIONS);
    cy.contains('[data-cy="edit-panel"] button', 'dashboard.boxes.actions.addActionButton').should('be.disabled');
    shouldShowMessage(maxActionsMessage);
  });
});
