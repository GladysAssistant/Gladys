import { visitDashboard } from './dashboardFixtures';
import { readyBulb, genericSwitch, atStep, answerPairing, sendPermitJoin, sendPairing } from './pairingFixtures';

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
    cy.get('[data-cy=z2m-pairing-screen]').should('be.visible');
    cy.wait('@permitJoin');
    sendPermitJoin({ allowed: true, remainingSeconds: 254 });
    cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');
    cy.get('[data-cy=z2m-pairing-extend]').should('be.visible');
    cy.get('[data-cy=z2m-pairing-stop]').should('be.visible');
    // Side by side: the header leaves room for the devices
    cy.get('[data-cy=z2m-pairing-extend]').then(extend => {
      cy.get('[data-cy=z2m-pairing-stop]').should(stop => {
        expect(stop[0].getBoundingClientRect().top).to.equal(extend[0].getBoundingClientRect().top);
      });
    });

    const unsupported = {
      ...atStep(readyBulb, 'unsupported'),
      ieee_address: '0x04',
      vendor: 'Lidl',
      model: 'ZNCZ02LM'
    };
    sendPairing([
      atStep(readyBulb, 'interviewing'),
      { ...atStep(readyBulb, 'failed'), ieee_address: '0x03' },
      unsupported
    ]);
    cy.get('[data-cy=z2m-pairing-row]').should('have.length', 3);
    cy.get('[data-cy=z2m-pairing-row]')
      .eq(1)
      .should('contain', Cypress._.get(Cypress.env('i18n'), `${T}.failedText`));
    // Not supported, with its model as on a desktop
    cy.get('[data-cy=z2m-pairing-row]')
      .eq(2)
      .should('contain', 'Lidl ZNCZ02LM')
      .and('contain', Cypress._.get(Cypress.env('i18n'), 'integration.zigbee2mqtt.support.unsupportedText'));
    // In a button or a link, which holds no list
    cy.get('[data-cy=z2m-pairing-timeline]').should('have.length', 3);
    cy.get('[data-cy=z2m-pairing-row] ol, [data-cy=z2m-pairing-row] li').should('not.exist');
    fitsTheScreen();

    sendPairing([readyBulb]);
    cy.get('[data-cy=z2m-pairing-row]')
      .should('contain', 'Light IKEA')
      .click();
    cy.get('[data-cy=integration-device-sheet]').should('be.visible');
    cy.get('[data-cy=integration-device-name]').should('have.value', 'Light IKEA');
    cy.get('[data-cy=integration-device-room]').select('Kitchen');
    // The device is read again from the server before it is added
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/pairing` }, { body: [readyBulb] });
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
    cy.get('[data-cy=z2m-pairing-screen]').should('not.exist');
    cy.get('[data-cy=z2m-dashboard-pair]').should('exist');
  });

  it('should add a device Zigbee2mqtt does not know after the confirmation sheet', () => {
    // docs/specs/zigbee2mqtt-pairing.md, E.3
    const serverUrl = Cypress.env('serverUrl');
    visitDashboard();
    answerPairing({ pairing: [genericSwitch] });
    cy.get('[data-cy=z2m-dashboard-pair]').click();
    cy.wait('@permitJoin');
    cy.get('[data-cy=z2m-pairing-row]').click();
    cy.get('[data-cy=integration-device-sheet]').should(
      'contain',
      Cypress._.get(Cypress.env('i18n'), 'integration.zigbee2mqtt.support.genericText')
    );
    // Not the photo of the product another `TS0001` is; the reports after "Add"
    cy.get('[data-cy=integration-device-sheet] [data-cy=z2m-pairing-photo] img').should('not.exist');
    cy.get('[data-cy=integration-device-sheet]')
      .find('[data-cy=z2m-pairing-add], [data-cy=integration-device-footer]')
      .then(elements => {
        expect([...elements].map(element => element.dataset.cy)).to.deep.equal([
          'z2m-pairing-add',
          'integration-device-footer'
        ]);
      });
    cy.get('[data-cy=integration-device-footer] [data-cy=z2m-support-ask-z2m-link]').should('exist');
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/device` },
      { body: { name: 'Switch', selector: 'switch' } }
    ).as('addDevice');
    cy.get('[data-cy=z2m-pairing-add]').click();
    cy.get('[data-cy=integration-device-primary-confirm]').should('be.visible');
    cy.get('[data-cy=integration-device-primary-confirm] [data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=integration-device-primary-confirm]').should('not.exist');
    cy.get('[data-cy=integration-device-sheet]').should('be.visible');

    cy.get('[data-cy=z2m-pairing-add]').click();
    cy.get('[data-cy=integration-device-primary-confirm] [data-cy=confirm-sheet-confirm]').click();
    cy.wait('@addDevice')
      .its('request.body')
      .should('not.have.property', 'zigbee2mqtt_info');
    cy.get('[data-cy=integration-device-sheet]').should('not.exist');
    cy.get('[data-cy=z2m-pairing-in-gladys]').i18n(`${T}.added`);
  });

  it('should tell what to do about a device Zigbee2mqtt does not know, without an empty list of features', () => {
    // docs/specs/zigbee2mqtt-pairing.md, E.4
    const unsupported = {
      ...genericSwitch,
      status: 'unsupported',
      device: { ...genericSwitch.device, zigbee2mqtt_support: 'unsupported', features: [] }
    };
    visitDashboard();
    answerPairing({ pairing: [unsupported] });
    cy.get('[data-cy=z2m-dashboard-pair]').click();
    cy.wait('@permitJoin');
    cy.get('[data-cy=z2m-pairing-row]').click();
    cy.get('[data-cy=integration-device-sheet]').within(() => {
      cy.root().should(
        'contain',
        Cypress._.get(Cypress.env('i18n'), 'integration.zigbee2mqtt.support.unsupportedText')
      );
      cy.get('[data-cy=integration-device-features]').should('not.exist');
      cy.get('[data-cy=integration-device-footer] [data-cy=z2m-support-ask-z2m-link]').should('exist');
      cy.get('[data-cy=z2m-pairing-add]').should('not.exist');
    });
  });

  it('should close the sheet of a device, then the screen, on "back"', () => {
    visitDashboard();
    answerPairing({ pairing: [readyBulb] });
    cy.get('[data-cy=z2m-dashboard-pair]').click();
    cy.wait('@permitJoin');
    cy.get('[data-cy=z2m-pairing-row]').click();
    cy.get('[data-cy=integration-device-sheet]').should('be.visible');
    cy.go('back');
    cy.get('[data-cy=integration-device-sheet]').should('not.exist');
    cy.get('[data-cy=z2m-pairing-screen]').should('be.visible');
    cy.go('back');
    cy.get('[data-cy=z2m-pairing-screen]').should('not.exist');
    cy.get('[data-cy=z2m-dashboard-pair]').should('exist');
  });

  it('should not save over a device added to Gladys while its sheet was open', () => {
    const serverUrl = Cypress.env('serverUrl');
    visitDashboard();
    answerPairing({ pairing: [readyBulb] });
    cy.get('[data-cy=z2m-dashboard-pair]').click();
    cy.wait('@permitJoin');
    cy.get('[data-cy=z2m-pairing-row]')
      .should('contain', 'Light IKEA')
      .click();
    cy.get('[data-cy=integration-device-sheet]').should('be.visible');
    // Added from another window or the Discover tab meanwhile
    const added = { ...readyBulb.device, id: 'a1', selector: 'kitchen-bulb', name: 'Kitchen bulb' };
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/pairing` },
      { body: [{ ...readyBulb, device: added }] }
    ).as('readAgain');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, { body: {} }).as('addDevice');
    cy.get('[data-cy=z2m-pairing-add]').click();
    cy.wait('@readAgain');
    cy.get('[data-cy=integration-device-sheet]').should('not.exist');
    cy.get('[data-cy=integration-mobile-toast]').should('not.exist');
    cy.get('[data-cy=z2m-pairing-in-gladys]').i18n(`${T}.alreadyInGladys`);
    cy.get('[data-cy=z2m-pairing-row]')
      .should('contain', 'Kitchen bulb')
      .and('have.attr', 'href', '/dashboard/integration/device/zigbee2mqtt/edit/kitchen-bulb');
    cy.get('@addDevice.all').should('have.length', 0);
  });
});
