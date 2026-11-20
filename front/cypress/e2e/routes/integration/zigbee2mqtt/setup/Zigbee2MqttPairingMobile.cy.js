import { visitDashboard } from './dashboardFixtures';
import { readyBulb, atStep, answerPairing, sendPermitJoin, sendPairing } from './pairingFixtures';

const T = 'integration.zigbee2mqtt.pairing';

// No part of the page wider than the screen
const fitsTheScreen = () =>
  cy.document().then(doc => {
    expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
  });

// The pairing window on a phone (docs/specs/zigbee2mqtt-pairing.md, D.2): a ready device is the row and the sheet of
// the Discover tab
describe('Zigbee2mqtt pairing window on a phone', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  it('should add a ready device from its sheet, and go back to the dashboard', () => {
    const serverUrl = Cypress.env('serverUrl');
    visitDashboard();
    answerPairing();
    cy.get('[data-cy=z2m-dashboard-pair]').click();
    cy.get('[data-cy=z2m-dashboard-pairing]').should('be.visible');
    cy.wait('@permitJoin');
    sendPermitJoin({ allowed: true, remainingSeconds: 254 });
    cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');
    cy.get('[data-cy=z2m-pairing-extend]').should('be.visible');
    cy.get('[data-cy=z2m-pairing-stop]').should('be.visible');

    sendPairing([atStep(readyBulb, 'interviewing'), { ...atStep(readyBulb, 'failed'), ieee_address: '0x03' }]);
    cy.get('[data-cy=z2m-pairing-row]').should('have.length', 2);
    cy.get('[data-cy=z2m-pairing-row]')
      .eq(1)
      .should('contain', Cypress._.get(Cypress.env('i18n'), `${T}.failedText`));
    fitsTheScreen();

    sendPairing([readyBulb]);
    cy.get('[data-cy=z2m-pairing-row]')
      .should('contain', 'Light IKEA')
      .click();
    cy.get('[data-cy=integration-device-sheet]').should('be.visible');
    cy.get('[data-cy=integration-device-name]').should('have.value', 'Light IKEA');
    cy.get('[data-cy=integration-device-room]').select('Kitchen');
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/device` },
      { body: { name: 'Light IKEA', selector: 'light-ikea' } }
    ).as('addDevice');
    cy.get('[data-cy=z2m-pairing-add]').click();
    cy.wait('@addDevice')
      .its('request.body')
      .should('include', { name: 'Light IKEA', room_id: 'room-1' });
    cy.get('[data-cy=integration-device-sheet]').should('not.exist');
    cy.get('[data-cy=z2m-pairing-in-gladys]').i18n(`${T}.added`);
    cy.get('[data-cy=z2m-pairing-row]').should(
      'have.attr',
      'href',
      '/dashboard/integration/device/zigbee2mqtt/edit/light-ikea'
    );

    cy.get('[data-cy=z2m-pairing-close]').click();
    cy.get('[data-cy=z2m-dashboard-pairing]').should('not.exist');
    cy.get('[data-cy=z2m-dashboard-pair]').should('exist');
  });
});
