// Switch actions on a multi-switch device: one option per writable switch, a scene
// saved before the switches could be picked one by one (devices) keeps showing the
// switch it drives, and the stored order of the picked switches is kept. The devices
// are stubbed, the scenes are created and saved through the real server.
const POWER_STRIP = {
  name: 'Power strip',
  selector: 'power-strip',
  features: [
    {
      name: 'Socket 1',
      selector: 'power-strip-socket-1',
      category: 'switch',
      type: 'binary',
      read_only: false
    },
    {
      name: 'Socket 2',
      selector: 'power-strip-socket-2',
      category: 'switch',
      type: 'binary',
      read_only: false
    },
    {
      name: 'Socket status',
      selector: 'power-strip-socket-status',
      category: 'switch',
      type: 'binary',
      read_only: true
    }
  ],
  service: { name: 'mqtt' }
};
const SUFFIX = Date.now();
const LEGACY_SCENE = `switch-legacy-${SUFFIX}`;
const ORDERED_SCENE = `switch-ordered-${SUFFIX}`;

const apiRequest = (method, path, body) =>
  cy.window().then(win => {
    const { access_token: accessToken } = JSON.parse(win.localStorage.getItem('user'));
    return cy
      .request({
        method,
        url: `${Cypress.env('serverUrl')}/api/v1${path}`,
        headers: { authorization: `Bearer ${accessToken}` },
        body
      })
      .its('body');
  });

const createScene = (selector, action) =>
  apiRequest('POST', '/scene', {
    name: selector,
    selector,
    icon: 'activity',
    triggers: [],
    actions: [[{ type: 'switch.turn-on', ...action }]]
  });

const openSwitchAction = (selector, collapsedSummary) => {
  cy.intercept('GET', '**/api/v1/device*', [POWER_STRIP]).as('loadDevices');
  cy.visit(`/dashboard/scene/${selector}`);
  cy.wait('@loadDevices');
  // an existing step starts collapsed, and names the switches it drives
  cy.get('[class*="stepSummary"]').should('have.text', collapsedSummary);
  cy.get('[data-cy^="drag-step-"]')
    .first()
    .siblings('button[aria-expanded="false"]')
    .click();
};

describe('Scene - switch actions on a multi-switch device', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Should create the scenes', () => {
    cy.visit('/dashboard/scene');
    createScene(LEGACY_SCENE, { devices: ['power-strip'] });
    createScene(ORDERED_SCENE, { device_features: ['power-strip-socket-2', 'power-strip-socket-1'] });
  });

  it('Should show the switch a legacy scene drives, offer each writable switch and save the picked ones', () => {
    openSwitchAction(LEGACY_SCENE, 'Power strip (Socket 1)');

    cy.get('.react-select__multi-value').should('have.length', 1);
    cy.get('.react-select__multi-value')
      .first()
      .should('contain', 'Power strip (Socket 1)');

    cy.get('.card-body:visible .react-select__control').click();
    // The menu is rendered through a portal on <body>: scrollBehavior false, a scroll closes it
    cy.get('.react-select__menu').should('not.contain', 'Socket status');
    cy.get('.react-select__menu')
      .contains('.react-select__option', 'Power strip (Socket 2)')
      .click({ scrollBehavior: false });

    cy.contains('button', 'editScene.saveButton').click();
    cy.contains('editScene.savedLabel').should('exist');

    apiRequest('GET', `/scene/${LEGACY_SCENE}`).then(scene => {
      const action = scene.actions[0][0];
      expect(action.device_features).to.deep.equal(['power-strip-socket-1', 'power-strip-socket-2']);
      expect(action).not.to.have.property('devices');
    });
  });

  it('Should show the picked switches in their stored order', () => {
    openSwitchAction(ORDERED_SCENE, 'Power strip (Socket 2), Power strip (Socket 1)');

    cy.get('.react-select__multi-value').should('have.length', 2);
    cy.get('.react-select__multi-value')
      .eq(0)
      .should('contain', 'Power strip (Socket 2)');
    cy.get('.react-select__multi-value')
      .eq(1)
      .should('contain', 'Power strip (Socket 1)');
  });

  it('Should delete the scenes', () => {
    cy.visit('/dashboard/scene');
    apiRequest('DELETE', `/scene/${LEGACY_SCENE}`);
    apiRequest('DELETE', `/scene/${ORDERED_SCENE}`);
  });
});
