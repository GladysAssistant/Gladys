// The update section of the supervision screen when the latest version of an
// integration cannot be applied: it requires a newer Gladys, or the forced
// update fell back on the running image. The integration is stubbed (it would
// need an installed Docker container), the page and its requests are real.
const SELECTOR = 'ext-prohand-gladys-vigieau';
const SUPERVISION_URL = `/dashboard/integration/device/external/${SELECTOR}/supervision`;

const INTEGRATION = {
  id: '9a4e1c2b-3d5f-4a6b-8c7d-0e1f2a3b4c5d',
  name: SELECTOR,
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  version: '3.5.0',
  docker_image: 'ghcr.io/prohand/gladys-vigieau:3.5.0',
  store_slug: 'prohand/gladys-vigieau',
  granted_devices: [],
  containers: [],
  manifest: { name: 'VigiEau', type: 'device', version: '3.5.0' },
  update_available: false,
  latest_version: '3.6.0',
  update_requires_gladys_version: '>=99.0.0'
};

describe('External integration - update requiring a newer Gladys', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, INTEGRATION).as('getIntegration');
    cy.intercept('GET', '**/api/v1/external_integration', [INTEGRATION]);
  });

  it('tells the admin to update Gladys first instead of offering the update', () => {
    cy.visit(SUPERVISION_URL);
    cy.wait('@getIntegration');

    cy.get('.alert-warning')
      .should('contain', '3.6.0')
      .and('contain', '>=99.0.0')
      .and('contain', 'v3.5.0');
    // no "update available" banner, and the button stays the forced update
    cy.get('.alert-info').should('not.exist');
    cy.contains('button', 'integration.externalIntegration.supervision.forceUpdateButton').should('be.visible');
    cy.contains('button', 'integration.externalIntegration.supervision.updateButton').should('not.exist');
  });

  it('says which version a forced update did not install, and why', () => {
    cy.intercept('POST', `**/api/v1/external_integration/${SELECTOR}/update`, {
      ...INTEGRATION,
      update_available: undefined,
      latest_version: undefined,
      update_requires_gladys_version: undefined,
      skipped_update: { version: '3.6.0', reason: 'GLADYS_VERSION', gladys_version: '>=99.0.0' }
    }).as('update');
    cy.visit(SUPERVISION_URL);
    cy.wait('@getIntegration');

    cy.contains('button', 'integration.externalIntegration.supervision.forceUpdateButton').click();
    cy.wait('@update');

    // not "already up to date": the version that was not installed, why, and
    // the version that stays installed
    cy.get('.alert-warning')
      .should('contain', '3.6.0')
      .and('contain', '>=99.0.0')
      .and('contain', '3.5.0');
    cy.get('.alert-info').should('not.exist');
    cy.get('.alert-success').should('not.exist');
  });
});
