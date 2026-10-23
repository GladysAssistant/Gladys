// The "To update" view offers to update every installed community integration having a newer
// version in one click. The integrations are stubbed (they would need installed Docker containers),
// the requests the page sends — and their order — are what is checked.
const buildIntegration = (selector, name, version, latestVersion) => ({
  id: `5c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4${selector.length % 10}`,
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
const NETATMO = buildIntegration('ext-netatmo', 'Netatmo', '1.2.0', '1.2.0');
const STORE = { integrations: [], refreshed_at: '2026-10-22T08:00:00.000Z' };

const UPDATE_ALL_BUTTON = 'integration.root.updateAll.button';
// by its title: the progress panel above the cards is a card too, naming the integration being updated
const getCard = name => cy.contains('.card h4', name).closest('.card');
const DAIKIN_UPDATE_DELAY_MS = 1000;

describe('External integration - update all from the "To update" view', () => {
  let installed;
  let daikinRequestedAt;

  beforeEach(() => {
    cy.login();
    installed = { daikin: DAIKIN, linky: LINKY };
    daikinRequestedAt = null;
    cy.intercept('GET', '**/api/v1/external_integration', req =>
      req.reply([installed.daikin, installed.linky, NETATMO])
    ).as('getInstalled');
    cy.intercept('GET', '**/api/v1/external_integration/store', STORE);
    // answers late: the next integration must not be updated before it is done
    cy.intercept('POST', `**/api/v1/external_integration/${DAIKIN.selector}/update`, req => {
      daikinRequestedAt = Date.now();
      installed.daikin = { ...DAIKIN, version: '1.0.0', update_available: false };
      req.reply({ delay: DAIKIN_UPDATE_DELAY_MS, body: installed.daikin });
    }).as('updateDaikin');
  });

  it('is offered on the "To update" view only', () => {
    cy.visit('/dashboard/integration/installed');
    cy.wait('@getInstalled');
    getCard('Daikin Onecta').should('exist');
    cy.contains('button', UPDATE_ALL_BUTTON).should('not.exist');

    cy.get('.col-lg-3')
      .contains('a', 'integration.root.menu.updates')
      .click();
    // the count of integrations to update rides on the button
    cy.contains('button', UPDATE_ALL_BUTTON).should('contain', '2');
  });

  it('updates the integrations one after the other and lists the ones that failed', () => {
    cy.intercept('POST', `**/api/v1/external_integration/${LINKY.selector}/update`, req => {
      expect(Date.now() - daikinRequestedAt, 'Daikin updated before Linky starts').to.be.at.least(
        DAIKIN_UPDATE_DELAY_MS
      );
      req.reply({ statusCode: 500, body: { error: 'IMAGE_PULL_FAILED' } });
    }).as('updateLinky');
    cy.intercept('POST', `**/api/v1/external_integration/${NETATMO.selector}/update`, () => {
      throw new Error('an integration already up to date must not be updated');
    });

    cy.visit('/dashboard/integration/updates');
    cy.wait('@getInstalled');
    cy.contains('button', UPDATE_ALL_BUTTON).click();

    cy.get('.progress-bar').should('exist');
    cy.wait('@updateDaikin');
    cy.wait('@updateLinky');

    cy.get('.alert-warning').within(() => {
      cy.contains('a', 'Linky Teleinfo').should(
        'have.attr',
        'href',
        `/dashboard/integration/device/external/${LINKY.selector}/supervision`
      );
      cy.contains('Daikin Onecta').should('not.exist');
    });
    // each card says how its own update went
    getCard('Daikin Onecta')
      .find('.text-success')
      .should('contain', 'v1.0.0');
    getCard('Linky Teleinfo').within(() => {
      cy.contains('integration.root.updateError').should('exist');
    });
    // what failed is still offered
    cy.contains('button', UPDATE_ALL_BUTTON).should('contain', '1');
  });

  it('says so when every update went through', () => {
    cy.intercept('POST', `**/api/v1/external_integration/${LINKY.selector}/update`, req => {
      installed.linky = { ...LINKY, version: '2.1.3', update_available: false };
      req.reply(installed.linky);
    }).as('updateLinky');

    cy.visit('/dashboard/integration/updates');
    cy.wait('@getInstalled');
    cy.contains('button', UPDATE_ALL_BUTTON).click();
    cy.wait('@updateDaikin');
    cy.wait('@updateLinky');

    cy.get('.alert-success').should('exist');
    cy.get('.alert-warning').should('not.exist');
    cy.contains('button', UPDATE_ALL_BUTTON).should('not.exist');
  });

  it('holds the card buttons while it runs', () => {
    cy.intercept('POST', `**/api/v1/external_integration/${LINKY.selector}/update`, req => {
      installed.linky = { ...LINKY, version: '2.1.3', update_available: false };
      req.reply(installed.linky);
    }).as('updateLinky');

    cy.visit('/dashboard/integration/updates');
    cy.wait('@getInstalled');
    cy.contains('button', UPDATE_ALL_BUTTON).click();
    // Daikin is still being updated: Linky's turn has not come, its card cannot start it
    getCard('Daikin Onecta')
      .find('button.btn-loading')
      .should('be.disabled');
    getCard('Linky Teleinfo').within(() => {
      cy.contains('button', 'integration.root.updateButton').should('be.disabled');
    });
    cy.wait('@updateDaikin');
    cy.wait('@updateLinky');

    cy.get('.alert-success').should('exist');
  });
  it('leaves out an integration already updated from its card whose list could not be reloaded', () => {
    let daikinUpdates = 0;
    cy.intercept('POST', `**/api/v1/external_integration/${DAIKIN.selector}/update`, req => {
      daikinUpdates += 1;
      // the update goes through, but the list reloaded after it still carries the flag
      req.reply({ ...DAIKIN, version: '1.0.0' });
    }).as('updateDaikinStale');
    cy.intercept('POST', `**/api/v1/external_integration/${LINKY.selector}/update`, req => {
      installed.linky = { ...LINKY, version: '2.1.3', update_available: false };
      req.reply(installed.linky);
    }).as('updateLinky');

    cy.visit('/dashboard/integration/updates');
    cy.wait('@getInstalled');
    cy.contains('button', UPDATE_ALL_BUTTON).should('contain', '2');
    getCard('Daikin Onecta').within(() => {
      cy.contains('button', 'integration.root.updateButton').click();
    });
    cy.wait('@updateDaikinStale');
    getCard('Daikin Onecta')
      .find('.text-success')
      .should('contain', 'v1.0.0');

    // the card says it is up to date: the panel no longer counts it
    cy.contains('button', UPDATE_ALL_BUTTON)
      .should('contain', '1')
      .click();
    cy.wait('@updateLinky');
    cy.get('.alert-success').should('exist');
    cy.then(() => expect(daikinUpdates).to.equal(1));
  });
});
