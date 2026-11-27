// The devices Zigbee2MQTT does not support, in the Discover tab (docs/specs/zigbee2mqtt-pairing.md, E): the section
// after the list, the generic features added after a confirmation, the reports to Zigbee2MQTT and to the forum. The
// list, the status of Zigbee2MQTT and the writes are stubbed, as in the other specs of the tab.
describe('Zigbee2MQTT devices not supported', () => {
  const serverUrl = Cypress.env('serverUrl');
  const api = path => `${serverUrl}/api/v1${path}`;
  const i18n = key => Cypress._.get(Cypress.env('i18n'), key);
  const S = 'integration.zigbee2mqtt.support';
  const DISCOVER_URL = '/dashboard/integration/device/zigbee2mqtt/discover';

  const onlineStatus = {
    configured: true,
    usbConfigured: true,
    networkAdapterConfigured: false,
    mqttExist: true,
    mqttRunning: true,
    zigbee2mqttExist: true,
    zigbee2mqttRunning: true,
    gladysConnected: true,
    zigbee2mqttConnected: true,
    zigbee2mqttStarting: false,
    z2mEnabled: true,
    dockerBased: true,
    networkModeValid: true,
    coordinatorFirmware: null,
    z2mContainerError: null,
    mqttConnectionError: null
  };

  const feature = (deviceExternalId, name, category, type, extra = {}) => ({
    name,
    category,
    type,
    external_id: `${deviceExternalId}:${category}:${type}`,
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 100,
    ...extra
  });

  const info = (modelId, manufacturer, exposes = []) => ({
    model_id: modelId,
    manufacturer,
    power_source: 'Mains (single phase)',
    interview_state: 'SUCCESSFUL',
    definition: { model: modelId, vendor: manufacturer, description: 'Automatically generated definition', exposes },
    endpoints: { 1: { clusters: { input: ['genBasic', 'genOnOff'], output: ['genOta'] } } }
  });

  const bulb = {
    name: 'Hallway bulb',
    model: 'LCT015',
    external_id: 'zigbee2mqtt:Hallway bulb',
    zigbee2mqtt_support: 'native',
    features: [feature('zigbee2mqtt:Hallway bulb', 'State', 'light', 'binary', { read_only: false, max: 1 })]
  };
  // Known by Zigbee2MQTT, nothing Gladys can use: a battery and the link quality
  const remote = {
    name: 'Bedside remote',
    model: 'E1743',
    external_id: 'zigbee2mqtt:Bedside remote',
    zigbee2mqtt_support: 'native',
    zigbee2mqtt_info: {
      ...info('TRADFRI on/off switch', 'IKEA of Sweden'),
      definition: {
        model: 'E1743',
        vendor: 'IKEA',
        description: 'TRADFRI on/off switch',
        // Long enough for the link of the forum to be cut
        exposes: Array.from({ length: 80 }, (_, i) => ({ type: 'enum', name: `action_${i}`, values: ['on', 'off'] }))
      }
    },
    features: [
      feature('zigbee2mqtt:Bedside remote', 'Battery', 'battery', 'integer', { unit: 'percent' }),
      feature('zigbee2mqtt:Bedside remote', 'Link quality', 'signal', 'integer')
    ]
  };
  const genericSwitch = {
    name: '0xa4c138000000f00d',
    model: 'TS0001',
    external_id: 'zigbee2mqtt:0xa4c138000000f00d',
    ieee_address: '0xa4c138000000f00d',
    zigbee2mqtt_support: 'generic',
    zigbee2mqtt_info: info('TS0001', '_TZ3000_abcd'),
    features: [
      feature('zigbee2mqtt:0xa4c138000000f00d', 'Switch', 'switch', 'binary', { read_only: false, max: 1 }),
      feature('zigbee2mqtt:0xa4c138000000f00d', 'Link quality', 'signal', 'integer')
    ]
  };
  const unsupportedValve = {
    name: '0xa4c138000000cafe',
    model: 'TS0601',
    external_id: 'zigbee2mqtt:0xa4c138000000cafe',
    zigbee2mqtt_support: 'unsupported',
    zigbee2mqtt_info: info('TS0601', '_TZE200_valve'),
    features: [feature('zigbee2mqtt:0xa4c138000000cafe', 'Link quality', 'signal', 'integer')]
  };
  const failedSensor = {
    name: '0x00158d0000000bad',
    external_id: 'zigbee2mqtt:0x00158d0000000bad',
    zigbee2mqtt_support: 'interview_failed',
    zigbee2mqtt_info: { ...info(null, null), definition: null, interview_state: 'FAILED' },
    features: []
  };
  const discovered = [bulb, remote, genericSwitch, unsupportedValve, failedSensor];

  const stubSave = () =>
    cy
      .intercept({ method: 'POST', url: api('/device') }, req => {
        req.reply({ ...req.body, id: 'cy-new-device', created_at: '2026-01-01T00:00:00.000Z' });
      })
      .as('saveDevice');

  const visitDiscover = () => {
    cy.visit(DISCOVER_URL);
    cy.wait('@getDiscovered');
  };

  beforeEach(() => {
    cy.login();
    cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/status') }, { body: onlineStatus });
    cy.intercept(
      { method: 'GET', url: api('/service/zigbee2mqtt/setup') },
      { body: { Z2M_MQTT_MODE: 'local', Z2M_ADAPTER_MODE: 'usb', ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0' } }
    );
    cy.intercept(
      { method: 'GET', url: api('/service/zigbee2mqtt/permit_join') },
      { body: { allowed: false, remainingSeconds: null } }
    );
    cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/discovered*') }, discovered).as('getDiscovered');
  });

  describe('on a desktop', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
    });

    it('should keep the devices Zigbee2MQTT does not support in a folded section after the list', () => {
      visitDiscover();
      cy.get('[data-cy=z2m-discovered-card]').should('have.length', 2);
      cy.get('[data-cy=z2m-discover-unsupported-toggle]')
        .should('have.attr', 'aria-expanded', 'false')
        .and('contain', i18n(`${S}.sectionTitle`).replace('{{count}}', 3))
        .click();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').should('have.attr', 'aria-expanded', 'true');
      cy.get('[data-cy=z2m-discover-unsupported] [data-cy=z2m-discovered-card]').should('have.length', 3);

      // Failed identification: the advice, nothing to add or report
      cy.get('[data-cy=z2m-discovered-card][data-support=interview_failed]').within(() => {
        cy.get('[data-cy=z2m-discovered-interview-failed]').i18n('integration.zigbee2mqtt.pairing.failedText');
        cy.get('[data-cy=z2m-discovered-save]').should('not.exist');
        cy.get('[data-cy=z2m-support-ask-z2m]').should('not.exist');
      });
    });

    it('should add a generic device only once the user confirmed it', () => {
      stubSave();
      visitDiscover();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();
      cy.get('[data-cy=z2m-discovered-card][data-support=generic]').within(() => {
        cy.get('[data-cy=z2m-discovered-generic]').i18n(`${S}.genericBadge`);
        cy.get('input[id^=name_]').clear();
        cy.get('input[id^=name_]').type('Garden switch');
        cy.get('[data-cy=z2m-discovered-save]').click();
      });
      cy.get('[data-cy=z2m-discovered-generic-confirm]')
        .should('be.visible')
        .and('contain', i18n(`${S}.confirmText`));
      // Cancel: nothing sent, the card as it was
      cy.get('[data-cy=confirm-sheet-cancel]').click();
      cy.get('[data-cy=z2m-discovered-generic-confirm]').should('not.exist');
      cy.get('[data-cy=z2m-discovered-card][data-support=generic] input[id^=name_]').should(
        'have.value',
        'Garden switch'
      );

      cy.get('[data-cy=z2m-discovered-card][data-support=generic] [data-cy=z2m-discovered-save]').click();
      cy.get('[data-cy=confirm-sheet-confirm]').click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body.name).to.equal('Garden switch');
        expect(request.body.external_id).to.equal('zigbee2mqtt:0xa4c138000000f00d');
        // What the page gets for itself is not saved
        expect(request.body).to.not.have.property('zigbee2mqtt_support');
        expect(request.body).to.not.have.property('zigbee2mqtt_info');
      });
      cy.get('[data-cy=z2m-discovered-card][data-support=generic]').should('not.exist');
    });

    it('should send a model Zigbee2MQTT does not know to its page, with the information to paste', () => {
      visitDiscover();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();
      cy.get('[data-cy=z2m-discovered-card][data-support=unsupported]').within(() => {
        cy.get('[data-cy=z2m-discovered-unsupported]').i18n(`${S}.unsupportedText`);
        cy.get('[data-cy=z2m-discovered-save]').should('not.exist');
        cy.get('[data-cy=z2m-support-ask-z2m-link]')
          .should('have.attr', 'target', '_blank')
          .and('have.attr', 'href')
          .and('include', 'zigbee2mqtt.io/advanced/support-new-devices');
      });
      cy.window().then(win => {
        // navigator.clipboard only exists in a secure context: the legacy copy of the plain-HTTP local address
        cy.stub(win.navigator.clipboard, 'writeText').rejects(new Error('not allowed'));
        cy.stub(win.document, 'execCommand')
          .returns(true)
          .as('execCommand');
      });
      cy.get('[data-cy=z2m-discovered-card][data-support=unsupported] [data-cy=z2m-support-copy]').click();
      cy.get('@execCommand').should('have.been.calledWith', 'copy');
      cy.get('[data-cy=z2m-discovered-card][data-support=unsupported] [data-cy=z2m-support-copied]')
        .should('have.attr', 'aria-live', 'polite')
        .and('contain', i18n(`${S}.copied`));
    });

    it('should show the information to select by hand when the browser refuses to copy it', () => {
      visitDiscover();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();
      cy.window().then(win => {
        cy.stub(win.navigator.clipboard, 'writeText').rejects(new Error('not allowed'));
        cy.stub(win.document, 'execCommand').returns(false);
      });
      cy.get('[data-cy=z2m-discovered-card][data-support=generic] [data-cy=z2m-support-copy]').click();
      cy.get('[data-cy=z2m-discovered-card][data-support=generic] [data-cy=z2m-support-copy-refused]')
        .should('contain', i18n(`${S}.copyRefused`))
        .find('textarea')
        .invoke('val')
        .should('include', '`TS0001`')
        .and('include', '`_TZ3000_abcd`')
        .and('include', 'genOnOff');
    });

    it('should suggest on the forum a model Zigbee2MQTT knows and Gladys cannot use, its link cut to stay short', () => {
      visitDiscover();
      cy.contains('[data-cy=z2m-discovered-card]', i18n('integration.zigbee2mqtt.discover.deviceNotHandled'))
        .find('[data-cy=z2m-discovered-suggest]')
        .should('have.attr', 'target', '_blank')
        .and('have.attr', 'href')
        .then(href => {
          expect(href).to.match(/^https:\/\/community\.gladysassistant\.com\/new-topic\?/);
          expect(href).to.include('category=feature-requests');
          expect(href.length).to.be.at.most(6000);
          const params = new URL(href).searchParams;
          expect(params.get('title')).to.include('IKEA E1743');
          expect(params.get('body')).to.include('TRADFRI on/off switch');
          expect(params.get('body')).to.include(i18n(`${S}.forumCut`));
        });
    });
  });

  describe('on a phone', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should fold the section and add a generic device after the confirmation sheet', () => {
      stubSave();
      visitDiscover();
      cy.get('[data-cy=z2m-discover-mobile] [data-cy=z2m-discovered-row]').should('have.length', 2);
      cy.get('[data-cy=z2m-discover-unsupported-toggle]')
        .should('have.attr', 'aria-expanded', 'false')
        .click();
      cy.get('[data-cy=z2m-discover-unsupported] [data-cy=z2m-discovered-row]').should('have.length', 3);

      cy.contains('[data-cy=z2m-discovered-row]', '0xa4c138000000f00d')
        .should('contain', i18n(`${S}.genericBadge`))
        .click();
      cy.get('[data-cy=integration-device-sheet]')
        .should('contain', i18n(`${S}.genericText`))
        .find('[data-cy=z2m-support-ask-z2m-link]')
        .should('exist');
      cy.get('[data-cy=integration-device-primary]').click();
      cy.get('[data-cy=integration-device-primary-confirm]').should('contain', i18n(`${S}.confirmText`));
      cy.get('[data-cy=integration-device-primary-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@saveDevice').then(({ request }) => {
        expect(request.body).to.not.have.property('zigbee2mqtt_support');
      });
      cy.get('[data-cy=integration-device-sheet]').should('not.exist');
      cy.get('[data-cy=integration-mobile-toast]').i18n('mobileDeviceList.added');
    });

    it('should say what to do with a model Zigbee2MQTT does not know, and with a failed identification', () => {
      visitDiscover();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();
      cy.contains('[data-cy=z2m-discovered-row]', '0xa4c138000000cafe').click();
      cy.get('[data-cy=integration-device-sheet]').within(() => {
        cy.get('[data-cy=z2m-discovered-unsupported]').i18n(`${S}.unsupportedText`);
        cy.get('[data-cy=z2m-support-ask-z2m-link]').should('exist');
        cy.get('[data-cy=z2m-support-copy]').should('exist');
        cy.get('[data-cy=integration-device-primary]').should('not.exist');
        cy.get('[data-cy=sheet-close]').click();
      });
      cy.contains('[data-cy=z2m-discovered-row]', '0x00158d0000000bad')
        .should('contain', i18n(`${S}.interviewFailed`))
        .click();
      cy.get('[data-cy=integration-device-sheet] [data-cy=z2m-discovered-interview-failed]').i18n(
        'integration.zigbee2mqtt.pairing.failedText'
      );
    });
  });
});
