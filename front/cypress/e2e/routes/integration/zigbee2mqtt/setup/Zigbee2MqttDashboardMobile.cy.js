import { onlineStatus, visitDashboard, answerAction } from './dashboardFixtures';

const T = 'integration.zigbee2mqtt.setup.dashboard';

// No part of the page wider than the screen
const fitsTheScreen = () =>
  cy.document().then(doc => {
    expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
  });

// The dashboard on a phone (docs/specs/zigbee2mqtt-installation.md, N)
describe('Zigbee2mqtt dashboard on a phone', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  it('should stack the state, the coordinator and the actions in one column', () => {
    visitDashboard();

    cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
    cy.get('[data-cy=z2m-dashboard-status]').then($status => {
      const statusBottom = $status[0].getBoundingClientRect().bottom;
      cy.get('[data-cy=z2m-dashboard-key]').should($key => {
        expect($key[0].getBoundingClientRect().top).to.be.at.least(statusBottom);
      });
      cy.get('[data-cy=z2m-dashboard-tiles]').should($tiles => {
        expect($tiles[0].getBoundingClientRect().top).to.be.at.least(statusBottom);
      });
    });
    fitsTheScreen();
  });

  it('should stop Zigbee2mqtt once confirmed', () => {
    visitDashboard();
    answerAction('stop');

    cy.get('[data-cy=z2m-dashboard-stop]').click();
    cy.get('[data-cy=z2m-dashboard-confirm-stop-button]').click();
    cy.wait('@stop');
    cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('not.exist');
  });

  it('should change the dongle in the phone wizard, and go back to the dashboard from its bar', () => {
    visitDashboard();
    cy.get('[data-cy=z2m-dashboard-change-key]').click();

    cy.get('[data-cy=z2m-wizard-mobile]').should('exist');
    cy.get('[data-cy=mobile-nav-back]').i18n('integration.zigbee2mqtt.setupTab');
    cy.get('[data-cy=z2m-wizard-key-one] [data-cy=z2m-wizard-current-key]').should('exist');
    cy.get('[data-cy=z2m-wizard-install]').i18n('integration.zigbee2mqtt.setup.wizard.change.use');

    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=z2m-dashboard]').should('exist');
    cy.get('[data-cy=z2m-wizard-mobile]').should('not.exist');
  });

  it('should open the advanced settings on a screen of their own', () => {
    visitDashboard({ status: { ...onlineStatus, updatePending: true } });
    cy.get('[data-cy=z2m-dashboard-update-pending]').should('exist');

    cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
    cy.get('[data-cy=z2m-dashboard-advanced]').should('exist');
    cy.get('[data-cy=z2m-dashboard]').should('not.exist');
    fitsTheScreen();

    cy.get('[data-cy=z2m-dashboard-back]').click();
    cy.get('[data-cy=z2m-dashboard]').should('exist');
  });
});
