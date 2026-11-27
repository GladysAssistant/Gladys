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

    it('should keep the devices Zigbee2MQTT does not support in a section after the list, open with one to add', () => {
      visitDiscover();
      cy.get('[data-cy=z2m-discover-unsupported] [data-cy=z2m-discovered-card]').should('have.length', 3);
      // A generic device can be added: the section is open, and says how many can
      cy.get('[data-cy=z2m-discover-unsupported-toggle]')
        .should('have.attr', 'aria-expanded', 'true')
        .and('contain', i18n(`${S}.sectionTitle`).replace('{{count}}', 3));
      cy.get('[data-cy=z2m-discover-unsupported-addable]').should(
        'contain',
        i18n(`${S}.sectionAddable.one`).replace('{{count}}', 1)
      );
      cy.get('[data-cy=z2m-discovered-card]').should('have.length', 5);
      // The list holds devices: no line saying it is empty
      cy.get('[data-cy=z2m-discover-no-native]').should('not.exist');
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').should('have.attr', 'aria-expanded', 'false');
      cy.get('[data-cy=z2m-discovered-card]').should('have.length', 2);
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();

      // Failed identification: the advice, nothing to add or report, what it is as text
      cy.get('[data-cy=z2m-discovered-card][data-support=interview_failed]').within(() => {
        cy.get('[data-cy=z2m-discovered-interview-failed]').i18n('integration.zigbee2mqtt.pairing.failedText');
        cy.get('[data-cy=z2m-discovered-save]').should('not.exist');
        cy.get('[data-cy=z2m-support-ask-z2m]').should('not.exist');
        cy.get('input').should('not.exist');
        cy.get('[data-cy=z2m-discovered-name]').should('have.text', '0x00158d0000000bad');
      });
    });

    it('should fold the section when nothing in it can be added', () => {
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/discovered*') }, [
        bulb,
        unsupportedValve,
        failedSensor
      ]).as('getDiscovered');
      visitDiscover();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').should('have.attr', 'aria-expanded', 'false');
      cy.get('[data-cy=z2m-discover-unsupported-addable]').should('not.exist');
      cy.get('[data-cy=z2m-discovered-card]').should('have.length', 1);
    });

    it('should add a generic device only once the user confirmed it', () => {
      stubSave();
      visitDiscover();
      cy.get('[data-cy=z2m-discovered-card][data-support=generic]').within(() => {
        cy.get('[data-cy=z2m-discovered-generic]').i18n(`${S}.genericBadge`);
        // On the card, not inside the warning whose colours it would take
        cy.get('[data-cy=z2m-discovered-generic]')
          .parents('.alert')
          .should('have.length', 0);
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
      cy.get('[data-cy=z2m-discovered-card][data-support=unsupported]').within(() => {
        cy.get('[data-cy=z2m-discovered-unsupported]').i18n(`${S}.unsupportedText`);
        cy.get('[data-cy=z2m-discovered-save]').should('not.exist');
        // Which device it is, as text: no field to fill in with nothing to save
        cy.get('input').should('not.exist');
        cy.get('[data-cy=z2m-discovered-name]').should('have.text', '0xa4c138000000cafe');
        cy.get('[data-cy=z2m-discovered-identity]')
          .should('contain', i18n(`${S}.modelIdLabel`))
          .and('contain', 'TS0601')
          .and('contain', i18n(`${S}.manufacturerLabel`))
          .and('contain', '_TZE200_valve');
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

    it('should add a model of which Gladys only uses the signal, and suggest it on the forum with a short link', () => {
      visitDiscover();
      // Added as before the section existed: a router is added for its signal
      cy.contains('[data-cy=z2m-discovered-card]', i18n(`${S}.onlySecondary`))
        .find('[data-cy=z2m-discovered-save]')
        .should('exist');
      cy.contains('[data-cy=z2m-discovered-card]', i18n(`${S}.onlySecondary`))
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

  describe('forum link', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
    });

    it('should keep the link of the forum short even when the fields of the device alone are too long', () => {
      const longRemote = {
        ...remote,
        zigbee2mqtt_info: {
          ...remote.zigbee2mqtt_info,
          model_id: '\u00e9'.repeat(1000),
          definition: { ...remote.zigbee2mqtt_info.definition, description: '\u00e9'.repeat(1000) }
        }
      };
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/discovered*') }, [longRemote]).as('getDiscovered');
      visitDiscover();
      cy.get('[data-cy=z2m-discovered-suggest]')
        .should('have.attr', 'href')
        .then(href => {
          expect(href.length).to.be.at.most(6000);
          const params = new URL(href).searchParams;
          expect(params.get('title')).to.include('IKEA E1743');
          // The fields alone did not fit: cut to a few words, and said so
          expect(params.get('body')).to.include(`${'\u00e9'.repeat(80)}\u2026`);
          expect(params.get('body')).to.not.include('\u00e9'.repeat(81));
        });
    });
  });

  describe('devices already in Gladys', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
    });

    it('should tell a device not recognized since it was added as in Gladys, without offering to update it', () => {
      const inGladys = {
        ...unsupportedValve,
        id: 'cy-valve',
        created_at: '2026-01-01T00:00:00.000Z',
        updatable: true
      };
      cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/discovered*') }, [inGladys]).as('getDiscovered');
      visitDiscover();
      // Only a device in the section: the list does not say there is nothing, but that it holds no supported device
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();
      cy.contains(i18n('integration.zigbee2mqtt.discover.noDeviceDiscovered')).should('not.exist');
      cy.get('[data-cy=z2m-discover-no-native]').i18n('integration.zigbee2mqtt.discover.noNewSupportedDevice');
      cy.get('[data-cy=z2m-discovered-card][data-support=unsupported]').within(() => {
        cy.get('[data-cy=z2m-discovered-in-gladys]')
          .should('be.disabled')
          .and('contain', i18n('integration.zigbee2mqtt.alreadyExistsButton'));
        cy.contains(i18n('integration.zigbee2mqtt.updateButton')).should('not.exist');
      });
    });
  });

  describe('on a phone', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should open the section holding a generic device and add it after the confirmation sheet', () => {
      stubSave();
      visitDiscover();
      cy.get('[data-cy=z2m-discover-unsupported-toggle]')
        .should('have.attr', 'aria-expanded', 'true')
        .and('contain', i18n(`${S}.sectionAddable.one`).replace('{{count}}', 1));
      cy.get('[data-cy=z2m-discover-unsupported] [data-cy=z2m-discovered-row]').should('have.length', 3);
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();
      cy.get('[data-cy=z2m-discover-mobile] [data-cy=z2m-discovered-row]').should('have.length', 2);
      cy.get('[data-cy=z2m-discover-unsupported-toggle]').click();

      cy.contains('[data-cy=z2m-discovered-row]', '0xa4c138000000f00d')
        .should('contain', i18n(`${S}.genericBadge`))
        .click();
      cy.get('[data-cy=integration-device-sheet]').should('contain', i18n(`${S}.genericText`));
      // The reports after "Add to Gladys": the action of the sheet comes first
      cy.get('[data-cy=integration-device-footer] [data-cy=z2m-support-ask-z2m-link]').should('exist');
      cy.get('[data-cy=integration-device-sheet]')
        .find(
          '[data-cy=integration-device-primary], [data-cy=integration-device-features], [data-cy=integration-device-footer]'
        )
        .then(elements => {
          expect([...elements].map(element => element.dataset.cy)).to.deep.equal([
            'integration-device-features',
            'integration-device-primary',
            'integration-device-footer'
          ]);
        });
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
      cy.contains('[data-cy=z2m-discovered-row]', '0xa4c138000000cafe')
        .should('contain', i18n(`${S}.unknownModel`))
        .click();
      cy.get('[data-cy=integration-device-sheet]').within(() => {
        cy.get('[data-cy=z2m-discovered-unsupported]').i18n(`${S}.unsupportedText`);
        cy.get('[data-cy=integration-device-footer] [data-cy=z2m-support-ask-z2m-link]').should('exist');
        cy.get('[data-cy=integration-device-footer] [data-cy=z2m-support-copy]').should('exist');
        cy.get('[data-cy=integration-device-primary]').should('not.exist');
        // What it is, not a disabled name repeating the title
        cy.get('[data-cy=integration-device-name]').should('not.exist');
        cy.get('[data-cy=integration-device-details]')
          .should('contain', 'TS0601')
          .and('contain', '_TZE200_valve');
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
