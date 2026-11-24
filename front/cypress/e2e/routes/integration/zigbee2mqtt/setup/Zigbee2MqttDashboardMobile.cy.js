import { answerSetup, runningInstallation, doneInstallation, sendProgress } from './wizardFixtures';
import {
  onlineStatus,
  notAnsweringStatus,
  localSetup,
  externalSetup,
  conflict,
  visitDashboard,
  answerAction
} from './dashboardFixtures';

const T = 'integration.zigbee2mqtt.setup.dashboard';

// No part of the page wider than the screen
const fitsTheScreen = () =>
  cy.document().then(doc => {
    expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
  });

// The dashboard on a phone (docs/specs/zigbee2mqtt-installation.md, N.5): rows of the kit, confirmations in sheets,
// the advanced settings on a focus page
describe('Zigbee2mqtt dashboard on a phone', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  it('should show the state, the coordinator and the actions as rows of the kit', () => {
    visitDashboard();

    cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.online.title`);
    cy.get('[data-cy=z2m-dashboard-new-devices]').should(
      'have.attr',
      'href',
      '/dashboard/integration/device/zigbee2mqtt/discover'
    );
    cy.get('[data-cy=z2m-dashboard-pair]').should('exist');
    cy.get('[data-cy=z2m-dashboard-status]').then($status => {
      const statusBottom = $status[0].getBoundingClientRect().bottom;
      cy.get('[data-cy=z2m-dashboard-key]').should($key => {
        expect($key[0].getBoundingClientRect().top).to.be.at.least(statusBottom);
      });
      cy.get('[data-cy=z2m-dashboard-tiles]').should($tiles => {
        expect($tiles[0].getBoundingClientRect().top).to.be.at.least(statusBottom);
      });
    });
    cy.get('[data-cy=z2m-dashboard-fact-firmware]').should('exist');
    cy.get('[data-cy=z2m-dashboard-interface]').should('have.attr', 'target', '_blank');
    fitsTheScreen();
  });

  it('should stop Zigbee2mqtt once confirmed in a sheet', () => {
    visitDashboard();
    answerAction('stop');

    cy.get('[data-cy=z2m-dashboard-stop]').click();
    cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('be.visible');
    cy.get('[data-cy=z2m-dashboard-confirm-stop] [data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('not.exist');
    cy.get('@stop.all').should('have.length', 0);

    cy.get('[data-cy=z2m-dashboard-stop]').click();
    cy.get('[data-cy=z2m-dashboard-confirm-stop] [data-cy=confirm-sheet-confirm]').click();
    cy.wait('@stop');
    cy.get('[data-cy=z2m-dashboard-confirm-stop]').should('not.exist');
  });

  it('should restart a running Zigbee2mqtt only once confirmed', () => {
    visitDashboard();
    answerAction('restart');

    cy.get('[data-cy=z2m-dashboard-tiles] [data-cy=z2m-dashboard-restart]').click();
    cy.get('[data-cy=z2m-dashboard-confirm-restart]').should('be.visible');
    cy.get('@restart.all').should('have.length', 0);
    cy.get('[data-cy=z2m-dashboard-confirm-restart] [data-cy=confirm-sheet-confirm]').click();
    cy.wait('@restart');
    cy.get('[data-cy=z2m-dashboard-confirm-restart]').should('not.exist');
  });

  it('should tell that an external Zigbee2mqtt too old to answer does not answer, without Pair', () => {
    visitDashboard({ status: { ...notAnsweringStatus, z2mVersion: '1.20.0' }, setup: externalSetup });

    cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.notAnsweringExternal.title`);
    cy.get('[data-cy=z2m-dashboard-too-old]').should('contain', '1.20.0');
    cy.get('[data-cy=z2m-dashboard-pair]').should('not.exist');
    fitsTheScreen();
  });

  it('should edit the connection to an external broker out of reach', () => {
    visitDashboard({
      status: {
        ...notAnsweringStatus,
        gladysConnected: false,
        mqttConnectionError: { code: 'BROKER_UNREACHABLE', message: null }
      },
      setup: externalSetup
    });

    cy.get('[data-cy=z2m-dashboard-title]').i18n(`${T}.states.mqttError.title`);
    cy.get('[data-cy=z2m-dashboard-stop]').should('not.exist');
    cy.get('[data-cy=z2m-dashboard-editConnection]').click();
    cy.get('[data-cy=z2m-dashboard-advanced]').should('exist');
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

  describe('advanced settings', () => {
    it('should open on a focus page and go back to the dashboard', () => {
      visitDashboard({ status: { ...onlineStatus, updatePending: true } });
      cy.get('[data-cy=z2m-dashboard-update-pending]').should('exist');

      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-advanced]').should('exist');
      cy.get('[data-cy=z2m-dashboard]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-component-zigbee2mqtt]').i18n(`${T}.advanced.components.answers`);
      cy.get('[data-cy=z2m-dashboard-mqtt-password]').should('not.contain', 'generated-password');
      cy.get('[data-cy=z2m-dashboard-mqtt-reveal]').click();
      cy.get('[data-cy=z2m-dashboard-mqtt-password]').should('contain', 'generated-password');
      // Nothing changed: no bottom bar
      cy.get('[data-cy=z2m-dashboard-bottom-bar]').should('not.exist');
      fitsTheScreen();

      cy.get('[data-cy=mobile-nav-back]').click();
      cy.get('[data-cy=z2m-dashboard]').should('exist');
    });

    it('should show the password of the interface, revealed in one tap', () => {
      visitDashboard({ setup: { ...localSetup, Z2M_FRONTEND_AUTH_TOKEN: 'interface-password' } });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-interface-password-value]').should('not.contain', 'interface-password');
      cy.get('[data-cy=z2m-dashboard-interface-password-reveal]').click();
      cy.get('[data-cy=z2m-dashboard-interface-password-value]').should('have.text', 'interface-password');
      cy.get('[data-cy=z2m-dashboard-open-interface]')
        .should('have.attr', 'href')
        .and('match', /:12000\/\?token=interface-password$/);
      fitsTheScreen();
    });

    it('should save another port from the bottom bar, and only it', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();

      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('70000');
      cy.get('[data-cy=z2m-dashboard-bottom-bar]').should('exist');
      cy.get('[data-cy=z2m-dashboard-save]').should('be.disabled');

      answerSetup({ body: { ...localSetup, Z2M_TCP_PORT: '12001' } });
      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('12001');
      cy.get('[data-cy=z2m-dashboard-save]').click();
      cy.wait('@setup')
        .its('request.body')
        .should('deep.equal', { Z2M_TCP_PORT: '12001' });
      cy.get('[data-cy=z2m-dashboard]').should('exist');
    });

    it('should tell in the bottom bar why the port was not saved', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerSetup(conflict('Zigbee2mqtt: cannot connect while the integration is busy'));
      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('12001');
      cy.get('[data-cy=z2m-dashboard-save]').click();
      cy.wait('@setup');

      cy.get('[data-cy=z2m-dashboard-bottom-bar]').should(
        'contain',
        Cypress._.get(Cypress.env('i18n'), 'integration.zigbee2mqtt.setup.installation.alreadyRunning')
      );
      cy.get('[data-cy=z2m-dashboard-advanced]').should('exist');
    });

    it('should ask before leaving with a port not saved', () => {
      visitDashboard();
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-port-input]').clear();
      cy.get('[data-cy=z2m-dashboard-port-input]').type('12001');

      cy.get('[data-cy=mobile-nav-back]').click();
      cy.get('[data-cy=z2m-dashboard-leave-confirm]').should('be.visible');
      cy.get('[data-cy=z2m-dashboard-leave-keep-editing]').click();
      cy.get('[data-cy=z2m-dashboard-port-input]').should('have.value', '12001');

      cy.get('[data-cy=mobile-nav-back]').click();
      cy.get('[data-cy=z2m-dashboard-leave-discard]').click();
      cy.get('[data-cy=z2m-dashboard]').should('exist');
    });

    it('should save the broker of an external Zigbee2mqtt from the bottom bar', () => {
      visitDashboard({ setup: externalSetup });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-port]').should('not.exist');
      cy.get('[data-cy=z2m-dashboard-mqtt-access]').should('not.exist');

      answerSetup({ body: { ...externalSetup, Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883' } });
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').type('mqtt://192.168.1.11:1883');
      cy.get('[data-cy=z2m-dashboard-save]').click();
      cy.wait('@setup')
        .its('request.body')
        .should('include', { Z2M_MQTT_MODE: 'external', Z2M_MQTT_URL: 'mqtt://192.168.1.11:1883' });
      cy.get('[data-cy=z2m-dashboard-key]').should('contain', 'mqtt://192.168.1.11:1883');
    });

    it('should save an anonymous broker as the large screen and the wizard save it', () => {
      visitDashboard({ setup: externalSetup });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerSetup({ body: { ...externalSetup, GLADYS_MQTT_USERNAME: null, GLADYS_MQTT_PASSWORD: null } });

      cy.get('[data-cy=z2m-dashboard-broker-mqttUsername]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-mqttPassword]').clear();
      cy.get('[data-cy=z2m-dashboard-broker-z2mFrontendUrl]').type('  http://192.168.1.10:8080  ');
      cy.get('[data-cy=z2m-dashboard-save]').click();
      // The fields left empty are erased (null), not saved as empty texts
      cy.wait('@setup')
        .its('request.body')
        .should('deep.equal', {
          Z2M_MQTT_MODE: 'external',
          Z2M_MQTT_URL: 'mqtt://192.168.1.10:1883',
          GLADYS_MQTT_USERNAME: null,
          GLADYS_MQTT_PASSWORD: null,
          Z2M_FRONTEND_URL: 'http://192.168.1.10:8080'
        });
    });

    it('should show the broker saved meanwhile in the fields not changed, nothing to save', () => {
      visitDashboard({ status: { ...onlineStatus, installation: runningInstallation }, setup: externalSetup });
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').should('have.value', 'mqtt://192.168.1.10:1883');

      const serverUrl = Cypress.env('serverUrl');
      cy.intercept(
        { method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` },
        { body: { ...externalSetup, Z2M_MQTT_URL: 'mqtt://192.168.1.12:1883' } }
      ).as('configAfterInstallation');
      sendProgress(doneInstallation);
      cy.wait('@configAfterInstallation');

      cy.get('[data-cy=z2m-dashboard-broker-mqttUrl]').should('have.value', 'mqtt://192.168.1.12:1883');
      cy.get('[data-cy=z2m-dashboard-bottom-bar]').should('not.exist');
    });

    it('should reset the integration once confirmed in a sheet, back to the wizard', () => {
      visitDashboard();
      const serverUrl = Cypress.env('serverUrl');
      cy.get('[data-cy=z2m-dashboard-advanced-link]').click();
      answerAction('reset');
      cy.get('[data-cy=z2m-reset-button]').click();
      cy.get('[data-cy=z2m-dashboard-confirm-reset] [data-cy=confirm-sheet-cancel]').click();
      cy.get('@reset.all').should('have.length', 0);

      cy.get('[data-cy=z2m-reset-button]').click();
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup` }, { body: {} });
      cy.get('[data-cy=z2m-dashboard-confirm-reset] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@reset');
      cy.get('[data-cy=z2m-wizard-mobile]').should('exist');
    });
  });
});
