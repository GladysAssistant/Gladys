// An installed community integration with a newer version in the store is updated from its card
// in the catalog, without going through its Supervision tab. The integrations are stubbed (they
// would need installed Docker containers), the requests the page sends are what is checked.
const buildIntegration = (selector, name, version, latestVersion) => ({
  id: `0b6f2c1e-7d3a-4c5b-9e8f-2a1b3c4d5e0${selector.length % 10}`,
  name: selector,
  selector,
  type: 'external',
  status: 'RUNNING',
  version,
  latest_version: latestVersion,
  update_available: latestVersion !== version,
  store_slug: null,
  manifest: { name, type: 'device', version }
});

const DAIKIN = buildIntegration('ext-daikin', 'Daikin Onecta', '0.9.1', '1.0.0');
const LINKY = buildIntegration('ext-linky-teleinfo', 'Linky Teleinfo', '2.1.0', '2.1.3');
const STORE = { integrations: [], refreshed_at: '2026-10-22T08:00:00.000Z' };

const getCard = name => cy.contains('.card', name);

describe('External integration - update from the catalog card', () => {
  beforeEach(() => {
    cy.login();
    let daikin = DAIKIN;
    cy.intercept('GET', '**/api/v1/external_integration', req => req.reply([daikin, LINKY])).as('getInstalled');
    cy.intercept('GET', '**/api/v1/external_integration/store', STORE);
    cy.intercept('POST', `**/api/v1/external_integration/${DAIKIN.selector}/update`, req => {
      daikin = { ...DAIKIN, version: '1.0.0', update_available: false };
      req.reply({ ...daikin, update_available: undefined, latest_version: undefined });
    }).as('updateDaikin');
    cy.intercept('POST', `**/api/v1/external_integration/${LINKY.selector}/update`, {
      statusCode: 500,
      body: { error: 'IMAGE_PULL_FAILED' }
    }).as('updateLinky');
  });

  it('shows the versions and an update button on each card to update', () => {
    cy.visit('/dashboard/integration/installed');
    cy.wait('@getInstalled');

    getCard('Daikin Onecta').within(() => {
      cy.contains('v0.9.1').should('exist');
      cy.contains('v1.0.0').should('exist');
      cy.contains('button', 'integration.root.updateButton').should('be.visible');
      // the button replaces the badge that only signalled the update
      cy.get('.badge .fe-arrow-up-circle').should('not.exist');
    });
  });

  it('updates an integration from its card and says so', () => {
    cy.visit('/dashboard/integration/installed');
    cy.wait('@getInstalled');

    getCard('Daikin Onecta').within(() => {
      cy.contains('button', 'integration.root.updateButton').click();
    });
    cy.wait('@updateDaikin');
    cy.wait('@getInstalled');

    getCard('Daikin Onecta').within(() => {
      // interpolated sentence: the version it carries is what is checked
      cy.get('.text-success').should('contain', 'v1.0.0');
      cy.contains('button', 'integration.root.updateButton').should('not.exist');
    });
    // the other card is left untouched
    getCard('Linky Teleinfo').within(() => {
      cy.contains('button', 'integration.root.updateButton').should('be.visible');
    });
  });

  it('offers to retry when the update fails', () => {
    cy.visit('/dashboard/integration/installed');
    cy.wait('@getInstalled');

    getCard('Linky Teleinfo').within(() => {
      cy.contains('button', 'integration.root.updateButton').click();
    });
    cy.wait('@updateLinky');

    getCard('Linky Teleinfo').within(() => {
      cy.contains('integration.root.updateError').should('exist');
      cy.contains('button', 'integration.root.updateRetryButton').click();
    });
    cy.wait('@updateLinky');
  });
});
