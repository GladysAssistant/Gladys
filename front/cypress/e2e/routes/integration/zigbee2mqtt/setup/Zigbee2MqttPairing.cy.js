import { sendStatus } from './wizardFixtures';
import { onlineStatus, notAnsweringStatus, visitDashboard } from './dashboardFixtures';
import { readyBulb, atStep, answerPairing, sendPermitJoin, sendPairing } from './pairingFixtures';

const T = 'integration.zigbee2mqtt.pairing';

// The pairing window (docs/specs/zigbee2mqtt-pairing.md, D), opened by "Pair" on the dashboard; step ④ of the wizard
// shows the same component (Zigbee2MqttWizard.cy.js)
const openPairing = options => {
  visitDashboard();
  answerPairing(options);
  cy.get('[data-cy=z2m-dashboard-pair]').click();
  cy.wait('@permitJoin');
};

describe('Zigbee2mqtt pairing window', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('joining', () => {
    it('should count down the joining window Zigbee2mqtt opened, and offer to permit it again once closed', () => {
      visitDashboard();
      answerPairing();
      cy.clock(Date.UTC(2026, 10, 20, 10, 0, 0), ['setInterval', 'clearInterval', 'Date']);
      cy.get('[data-cy=z2m-dashboard-pair]').click();
      cy.wait('@permitJoin');
      // Asked, until Zigbee2mqtt tells
      cy.get('[data-cy=z2m-pairing-allow]').should('be.disabled');
      cy.get('[data-cy=z2m-pairing-tips]').should('exist');

      sendPermitJoin({ allowed: true, remainingSeconds: 232 });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');
      cy.get('[data-cy=z2m-pairing-header]').should('contain', Cypress._.get(Cypress.env('i18n'), `${T}.open`));
      cy.get('[data-cy=z2m-pairing-countdown]').should('have.text', '3:52');
      cy.tick(2000);
      cy.get('[data-cy=z2m-pairing-countdown]').should('have.text', '3:50');
      // At the end, 0:00 until Zigbee2mqtt tells joining closed
      cy.tick(240000);
      cy.get('[data-cy=z2m-pairing-countdown]').should('have.text', '0:00');

      sendPermitJoin({ allowed: false, remainingSeconds: null });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'closed');
      cy.get('[data-cy=z2m-pairing-countdown]').should('not.exist');
      cy.get('[data-cy=z2m-pairing-allow]').should('not.be.disabled');
    });

    it('should extend the window, and stop joining once Zigbee2mqtt closes it', () => {
      openPairing();
      sendPermitJoin({ allowed: true, remainingSeconds: 30 });

      cy.get('[data-cy=z2m-pairing-extend]').click();
      cy.wait('@permitJoin')
        .its('request.body')
        .should('deep.equal', { value: true });
      sendPermitJoin({ allowed: true, remainingSeconds: 254 });
      cy.get('[data-cy=z2m-pairing-countdown]').should('have.text', '4:14');

      cy.get('[data-cy=z2m-pairing-stop]').click();
      cy.wait('@permitJoin')
        .its('request.body')
        .should('deep.equal', { value: false });
      cy.get('[data-cy=z2m-pairing-stop]').should('be.disabled');
      sendPermitJoin({ allowed: false, remainingSeconds: null });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'closed');
      cy.get('[data-cy=z2m-pairing-request-error]').should('not.exist');
    });

    it('should show joining already open when the window opens', () => {
      openPairing({ permitJoin: { allowed: true, remainingSeconds: 100 } });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');
    });

    it('should tell that joining could not be permitted', () => {
      openPairing({ permitJoinResponse: { statusCode: 500, body: {} } });
      cy.get('[data-cy=z2m-pairing-request-error]').i18n(`${T}.allowError`);
      cy.get('[data-cy=z2m-pairing-allow]').should('not.be.disabled');
    });

    it('should tell that joining could not be permitted when Zigbee2mqtt does not confirm it in time', () => {
      visitDashboard();
      answerPairing();
      cy.clock();
      cy.get('[data-cy=z2m-dashboard-pair]').click();
      cy.wait('@permitJoin');
      cy.get('[data-cy=z2m-pairing-allow]').should('be.disabled');
      cy.tick(10000);
      cy.get('[data-cy=z2m-pairing-request-error]').i18n(`${T}.allowError`);
      cy.get('[data-cy=z2m-pairing-allow]').should('not.be.disabled');
    });

    it('should not take a close told while asked to open for a refusal, and keep waiting', () => {
      openPairing();
      // The end of the previous window
      sendPermitJoin({ allowed: false, remainingSeconds: null });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'closed');
      cy.get('[data-cy=z2m-pairing-request-error]').should('not.exist');
      cy.get('[data-cy=z2m-pairing-allow]').should('be.disabled');
      sendPermitJoin({ allowed: true, remainingSeconds: 254 });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');
      cy.get('[data-cy=z2m-pairing-request-error]').should('not.exist');
    });

    it('should clear the failure of a request once Zigbee2mqtt tells, late, what was asked', () => {
      visitDashboard();
      answerPairing();
      cy.clock();
      cy.get('[data-cy=z2m-dashboard-pair]').click();
      cy.wait('@permitJoin');
      cy.tick(10000);
      cy.get('[data-cy=z2m-pairing-request-error]').i18n(`${T}.allowError`);
      sendPermitJoin({ allowed: true, remainingSeconds: 240 });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');
      cy.get('[data-cy=z2m-pairing-request-error]').should('not.exist');
    });

    it('should say that Gladys lost the broker, not that Zigbee2mqtt does not answer', () => {
      openPairing();
      sendStatus({ ...onlineStatus, gladysConnected: false, zigbee2mqttConnected: false });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'broker-lost');
      cy.get('[data-cy=z2m-pairing-header]').should('contain', Cypress._.get(Cypress.env('i18n'), `${T}.brokerLost`));
      cy.get('[data-cy=z2m-pairing-allow]').should('not.exist');
    });

    it('should not take the answer of a slow request over what Zigbee2mqtt told meanwhile', () => {
      visitDashboard();
      answerPairing({ permitJoinResponse: { body: {}, delay: 1000 } });
      cy.get('[data-cy=z2m-dashboard-pair]').click();
      // Allowed, then closed before the request answers
      sendPermitJoin({ allowed: true, remainingSeconds: 254 });
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'open');
      sendPermitJoin({ allowed: false, remainingSeconds: null });
      cy.wait('@permitJoin');
      cy.window().then(win => new Cypress.Promise(resolve => win.setTimeout(resolve, 100)));
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'closed');
      cy.get('[data-cy=z2m-pairing-request-error]').should('not.exist');
    });

    it('should tell that Zigbee2mqtt does not answer, without the buttons, and keep the devices', () => {
      openPairing({ pairing: [atStep(readyBulb, 'joined')] });
      sendStatus(notAnsweringStatus);
      cy.get('[data-cy=z2m-pairing-header]').should('have.attr', 'data-state', 'not-answering');
      cy.get('[data-cy=z2m-pairing-allow]').should('not.exist');
      cy.get('[data-cy=z2m-pairing-extend]').should('not.exist');
      cy.get('[data-cy=z2m-pairing-row]').should('have.length', 1);
      sendStatus(onlineStatus);
      cy.get('[data-cy=z2m-pairing-allow]').should('exist');
    });
  });

  describe('devices', () => {
    it('should follow a device from its arrival until it is added to Gladys', () => {
      const serverUrl = Cypress.env('serverUrl');
      // A device of Gladys already has the name Gladys would suggest
      openPairing({ devices: [{ name: 'Light IKEA' }] });
      cy.wait('@gladysDevices');
      sendPermitJoin({ allowed: true, remainingSeconds: 254 });

      sendPairing([atStep(readyBulb, 'joined')]);
      cy.get('[data-cy=z2m-pairing-tips]').should('not.exist');
      cy.get('[data-cy=z2m-pairing-row]').should('have.attr', 'data-status', 'joined');
      cy.get('[data-cy=z2m-pairing-row]').should('contain', readyBulb.ieee_address);

      sendPairing([atStep(readyBulb, 'interviewing')]);
      cy.get('[data-cy=z2m-pairing-row]').should('have.attr', 'data-status', 'interviewing');

      // Ready before the Gladys device is known: getting it ready
      sendPairing([{ ...readyBulb, device: null }]);
      cy.get('[data-cy=z2m-pairing-preparing]').should('exist');

      sendPairing([readyBulb]);
      cy.get('[data-cy=z2m-pairing-row]').should('have.attr', 'data-status', 'ready');
      cy.get('[data-cy=z2m-pairing-row]').should('contain', 'TRADFRI bulb E27');
      cy.get('[data-cy=z2m-pairing-photo] img').should(
        'have.attr',
        'src',
        'https://www.zigbee2mqtt.io/images/devices/LED1545G12.png'
      );
      // "<category> <vendor>", the name taken suffixed
      cy.get('[data-cy=z2m-pairing-name]').should('have.value', 'Light IKEA 2');
      cy.get('[data-cy=z2m-pairing-room]').select('Kitchen');

      // The device read again before it is added: attached to the main electric meter, which the message is not
      const attached = {
        ...readyBulb.device,
        features: readyBulb.device.features.map(feature => ({ ...feature, energy_parent_id: 'main-meter' }))
      };
      cy.intercept(
        { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/pairing` },
        { body: [{ ...readyBulb, device: attached }] }
      ).as('readAgain');
      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/device` },
        { body: { name: 'Light IKEA 2', selector: 'light-ikea-2' } }
      ).as('addDevice');
      cy.get('[data-cy=z2m-pairing-add]').click();
      cy.wait('@readAgain');
      cy.wait('@addDevice')
        .its('request.body')
        .should(body => {
          expect(body.name).to.equal('Light IKEA 2');
          expect(body.room_id).to.equal('room-1');
          expect(body.external_id).to.equal('zigbee2mqtt:0x000b57fffec6a5b2');
          // The name of the feature from the dictionary, as in the Discover tab
          expect(body.features[0].name).to.not.equal('state');
          expect(body.features[0].energy_parent_id).to.equal('main-meter');
        });
      cy.get('[data-cy=z2m-pairing-in-gladys]').i18n(`${T}.added`);
      cy.get('[data-cy=z2m-pairing-open-device]').should(
        'have.attr',
        'href',
        '/dashboard/integration/device/zigbee2mqtt/edit/light-ikea-2'
      );
      cy.get('[data-cy=z2m-pairing-card]').should('not.exist');
    });

    it('should keep the name the user typed when the device list comes again', () => {
      openPairing({ pairing: [readyBulb] });
      cy.get('[data-cy=z2m-pairing-name]').should('have.value', 'Light IKEA');
      cy.get('[data-cy=z2m-pairing-name]').clear();
      cy.get('[data-cy=z2m-pairing-name]').type('Living room lamp');
      sendPairing([{ ...readyBulb, friendly_name: 'living' }]);
      cy.get('[data-cy=z2m-pairing-name]').should('have.value', 'Living room lamp');
    });

    it('should keep the card open with an error when the device could not be added', () => {
      const serverUrl = Cypress.env('serverUrl');
      openPairing({ pairing: [readyBulb] });
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }, { statusCode: 500, body: {} }).as(
        'addDevice'
      );
      cy.get('[data-cy=z2m-pairing-add]').click();
      cy.wait('@addDevice');
      cy.get('[data-cy=z2m-pairing-add-error]').i18n(`${T}.addError`);
      cy.get('[data-cy=z2m-pairing-add]').should('not.be.disabled');
    });

    it('should tell a device already in Gladys, a device not supported and a failed interview', () => {
      const inGladys = {
        ...readyBulb,
        ieee_address: '0x01',
        device: { ...readyBulb.device, id: 'a1', selector: 'kitchen-bulb', name: 'Kitchen bulb' }
      };
      // As Zigbee2mqtt 2 tells a model it does not support: a generated definition
      const unsupported = {
        ...atStep(readyBulb, 'unsupported'),
        ieee_address: '0x02',
        vendor: 'Tuya',
        model: 'TS0601_unknown',
        description: 'Automatically generated definition'
      };
      const failed = { ...atStep(readyBulb, 'failed'), ieee_address: '0x03' };
      openPairing({ pairing: [inGladys, unsupported, failed] });

      cy.get('[data-cy=z2m-pairing-row]').should('have.length', 3);
      cy.get('[data-cy=z2m-pairing-row]')
        .eq(0)
        .within(() => {
          cy.get('[data-cy=z2m-pairing-in-gladys]').i18n(`${T}.alreadyInGladys`);
          cy.get('[data-cy=z2m-pairing-open-device]').should(
            'have.attr',
            'href',
            '/dashboard/integration/device/zigbee2mqtt/edit/kitchen-bulb'
          );
          cy.get('[data-cy=z2m-pairing-add]').should('not.exist');
        });
      cy.get('[data-cy=z2m-pairing-row]')
        .eq(1)
        .should('have.attr', 'data-status', 'unsupported')
        .within(() => {
          // Its model, not the description Zigbee2mqtt generated
          cy.root()
            .should('contain', 'Tuya TS0601_unknown')
            .and('not.contain', 'Automatically generated definition');
          cy.get('[data-cy=z2m-pairing-unsupported]').i18n(`${T}.unsupportedText`);
          cy.get('[data-cy=z2m-pairing-add]').should('not.exist');
        });
      cy.get('[data-cy=z2m-pairing-row]')
        .eq(2)
        .within(() => {
          cy.get('[data-cy=z2m-pairing-failed]').i18n(`${T}.failedText`);
          cy.get('[data-cy=z2m-pairing-add]').should('not.exist');
        });

      // The failed device left the network
      sendPairing([inGladys, unsupported]);
      cy.get('[data-cy=z2m-pairing-row]').should('have.length', 2);
    });

    it('should show the icon of the device when its photo cannot be loaded', () => {
      // A model of its own: the photo of another test is in the cache of the browser
      cy.intercept(
        { method: 'GET', url: 'https://www.zigbee2mqtt.io/images/devices/NO-PHOTO.png' },
        { statusCode: 404 }
      ).as('photo');
      openPairing({ pairing: [{ ...readyBulb, model: 'NO PHOTO' }] });
      cy.wait('@photo');
      cy.get('[data-cy=z2m-pairing-photo] img').should('not.exist');
      cy.get('[data-cy=z2m-pairing-photo] i.fe').should('exist');
    });

    it('should keep what a message told over the devices read when the window opened', () => {
      openPairing({ pairing: [atStep(readyBulb, 'joined')], pairingDelay: 1000 });
      sendPairing([readyBulb]);
      cy.get('[data-cy=z2m-pairing-row]').should('have.attr', 'data-status', 'ready');
      cy.wait('@getPairing');
      cy.window().then(win => new Cypress.Promise(resolve => win.setTimeout(resolve, 100)));
      cy.get('[data-cy=z2m-pairing-row]').should('have.attr', 'data-status', 'ready');
    });

    it('should tell that the devices being paired could not be read', () => {
      visitDashboard();
      answerPairing();
      const serverUrl = Cypress.env('serverUrl');
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/pairing` }, { statusCode: 500 });
      cy.get('[data-cy=z2m-dashboard-pair]').click();
      cy.get('[data-cy=z2m-pairing-load-error]').i18n(`${T}.loadError`);
      // A message brings the list: the failure no longer holds
      sendPairing([atStep(readyBulb, 'joined')]);
      cy.get('[data-cy=z2m-pairing-row]').should('have.length', 1);
      cy.get('[data-cy=z2m-pairing-load-error]').should('not.exist');
    });
  });
});
