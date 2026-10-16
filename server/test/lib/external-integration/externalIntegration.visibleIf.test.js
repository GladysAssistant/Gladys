const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { BadParameters } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { EVENTS } = require('../../../utils/constants');
const {
  getVisibleFields,
  isFieldVisible,
  matchesVisibleIf,
} = require('../../../lib/external-integration/externalIntegration.fieldVisibility');
const { validateActionValues } = require('../../../lib/external-integration/externalIntegration.runWidgetAction');
const {
  validateWidgetSettings,
} = require('../../../lib/external-integration/externalIntegration.validateWidgetSettings');
const { resolveSceneActionFields } = require('../../../lib/external-integration/externalIntegration.runSceneAction');
const { triggersFunc } = require('../../../lib/scene/scene.triggers');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// The Tasmota case: one connection mode, then the fields of each mode.
const MODE = {
  key: 'mqtt_mode',
  type: 'select',
  label: { en: 'Connection mode' },
  default: 'external',
  options: [
    { value: 'external', label: { en: 'My MQTT broker' } },
    { value: 'embedded', label: { en: 'Dedicated broker' } },
    { value: 'disabled', label: { en: 'HTTP only' } },
  ],
};
const URL_FIELD = {
  key: 'mqtt_url',
  type: 'string',
  label: { en: 'Broker URL' },
  required: true,
  visible_if: { field: 'mqtt_mode', in: ['external'] },
};
const TLS = {
  key: 'use_tls',
  type: 'boolean',
  label: { en: 'Use TLS' },
  visible_if: { field: 'mqtt_mode', in: ['external'] },
};
const CA = {
  key: 'ca_certificate',
  type: 'string',
  label: { en: 'CA certificate' },
  required: true,
  visible_if: { field: 'use_tls', in: [true] },
};
const FORM = [MODE, URL_FIELD, TLS, CA];
const keysOf = (fields) => fields.map((field) => field.key);

// an Error422 carries its reason in `properties`
const expect422 = async (run, reason) => {
  try {
    await run();
  } catch (e) {
    expect(e).to.be.instanceOf(Error422);
    expect(e.properties).to.include(reason);
    return;
  }
  throw new Error('should have thrown');
};

describe('externalIntegration visible_if', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getVisibleFields', () => {
    it('should keep the fields of the chosen value, the default applying to a missing one', () => {
      expect(keysOf(getVisibleFields(FORM, {}))).to.deep.equal(['mqtt_mode', 'mqtt_url', 'use_tls']);
      expect(keysOf(getVisibleFields(FORM, { mqtt_mode: 'embedded' }))).to.deep.equal(['mqtt_mode']);
    });

    it('should chain the conditions: a hidden field hides the fields depending on it', () => {
      expect(keysOf(getVisibleFields(FORM, { use_tls: true }))).to.deep.equal([
        'mqtt_mode',
        'mqtt_url',
        'use_tls',
        'ca_certificate',
      ]);
      expect(keysOf(getVisibleFields(FORM, { mqtt_mode: 'disabled', use_tls: true }))).to.deep.equal(['mqtt_mode']);
    });

    it('should match a multi_select as soon as one of its values is listed', () => {
      const fields = [
        { key: 'zones', type: 'multi_select', options: [{ value: 'a' }, { value: 'b' }] },
        { key: 'detail', type: 'string', visible_if: { field: 'zones', in: ['b'] } },
      ];
      expect(keysOf(getVisibleFields(fields, { zones: ['a', 'b'] }))).to.deep.equal(['zones', 'detail']);
      expect(keysOf(getVisibleFields(fields, { zones: ['a'] }))).to.deep.equal(['zones']);
    });

    it('should hide a field whose condition points to an unknown or later field', () => {
      const fields = [{ key: 'early', type: 'string', visible_if: { field: 'late', in: ['x'] } }, MODE];
      expect(keysOf(getVisibleFields(fields, { late: 'x' }))).to.deep.equal(['mqtt_mode']);
    });

    it('should accept missing arguments', () => {
      expect(getVisibleFields()).to.deep.equal([]);
      expect(keysOf(getVisibleFields(FORM, null))).to.deep.equal(['mqtt_mode', 'mqtt_url', 'use_tls']);
      expect(isFieldVisible(FORM, 'mqtt_url', { mqtt_mode: 'disabled' })).to.equal(false);
      expect(matchesVisibleIf({ field: 'mqtt_mode', in: ['external'] }, MODE, {})).to.equal(true);
    });
  });

  describe('validateManifest', () => {
    let externalIntegration;

    beforeEach(() => {
      ({ externalIntegration } = buildSupervisor());
    });

    const errorsOf = (manifest) => {
      try {
        externalIntegration.validateManifest(manifest);
        return '';
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        return e.properties;
      }
    };

    it('should accept visible_if in every form of the manifest', () => {
      const scene = {
        key: 'object_seen',
        label: { en: 'Object seen' },
        fields: [
          { ...MODE, default: undefined },
          { key: 'zone', type: 'string', label: { en: 'Zone' }, visible_if: { field: 'mqtt_mode', in: ['external'] } },
        ],
      };
      delete scene.fields[0].default;
      const manifest = {
        ...TEST_MANIFEST,
        gladys_version: '>=5.1.0',
        config_schema: [
          MODE,
          URL_FIELD,
          TLS,
          CA,
          {
            key: 'intro',
            type: 'section',
            label: { en: 'Dedicated broker' },
            visible_if: { field: 'mqtt_mode', in: ['embedded'] },
          },
        ],
        actions: [{ key: 'test', label: { en: 'Test' }, fields: FORM }],
        widgets: [{ key: 'status', label: { en: 'Status box' }, settings: [MODE, { ...URL_FIELD, required: false }] }],
        scene_triggers: [scene],
        scene_actions: [{ key: 'run', label: { en: 'Run' }, fields: FORM }],
      };
      expect(errorsOf(manifest)).to.equal('');
    });

    it('should reject a malformed condition', () => {
      const errors = errorsOf({
        ...TEST_MANIFEST,
        config_schema: [
          MODE,
          { key: 'a', type: 'string', label: { en: 'A' }, visible_if: 'external' },
          {
            key: 'b',
            type: 'string',
            label: { en: 'B' },
            visible_if: { field: 'mqtt_mode', in: ['external'], not: 1 },
          },
          { key: 'c', type: 'string', label: { en: 'C' }, visible_if: { field: 'mqtt_mode', in: [] } },
          { key: 'd', type: 'string', label: { en: 'D' }, visible_if: { field: 'mqtt_mode', in: ['nope'] } },
        ],
      });
      expect(errors).to.include('config_schema[1].visible_if: must be an object { field, in }');
      expect(errors).to.include('config_schema[2].visible_if.not: unknown field');
      expect(errors).to.include('config_schema[3].visible_if.in: must be a non-empty list of values');
      expect(errors).to.include('config_schema[4].visible_if.in[0]: must be a value of "mqtt_mode"');
    });

    it('should reject a reference to a later, unknown or unsuitable field', () => {
      const errors = errorsOf({
        ...TEST_MANIFEST,
        config_schema: [
          { key: 'a', type: 'string', label: { en: 'A' }, visible_if: { field: 'mqtt_mode', in: ['external'] } },
          MODE,
          { key: 'host', type: 'string', label: { en: 'Host' } },
          { key: 'b', type: 'string', label: { en: 'B' }, visible_if: { field: 'host', in: ['x'] } },
          { key: 'station', type: 'select', source: 'devices', label: { en: 'Station' } },
          { key: 'c', type: 'string', label: { en: 'C' }, visible_if: { field: 'station', in: ['x'] } },
          { key: 'tls', type: 'boolean', label: { en: 'TLS' } },
          { key: 'd', type: 'string', label: { en: 'D' }, visible_if: { field: 'tls', in: ['yes'] } },
        ],
      });
      expect(errors).to.include('config_schema[0].visible_if.field: must be the key of an earlier field');
      expect(errors).to.include('config_schema[3].visible_if.field: "host" must be a boolean');
      expect(errors).to.include('config_schema[5].visible_if.field: "station" must be a boolean');
      expect(errors).to.include('config_schema[7].visible_if.in[0]: must be a value of "tls"');
    });

    it('should not let a section be referenced, and survive a malformed field', () => {
      const errors = errorsOf({
        ...TEST_MANIFEST,
        config_schema: [
          null,
          { key: 'intro', type: 'section', label: { en: 'Intro' } },
          { key: 'a', type: 'string', label: { en: 'A' }, visible_if: { field: 'intro', in: ['x'] } },
          { key: 'broken', type: 'select', label: { en: 'Broken' }, options: 'x' },
          { key: 'b', type: 'string', label: { en: 'B' }, visible_if: { field: 'broken', in: ['x'] } },
        ],
      });
      expect(errors).to.include('config_schema[2].visible_if.field: must be the key of an earlier field');
      expect(errors).to.include('config_schema[4].visible_if.in[0]: must be a value of "broken"');
    });

    it('should check the contact and account schemas too', () => {
      const field = { key: 'x', type: 'string', label: { en: 'X' }, visible_if: { field: 'nope', in: ['a'] } };
      const contactErrors = errorsOf({
        ...TEST_MANIFEST,
        type: 'communication',
        messaging: { receive: false },
        contact_schema: [field],
      });
      expect(contactErrors).to.include('contact_schema[0].visible_if.field: must be the key of an earlier field');
      const accountErrors = errorsOf({ ...TEST_MANIFEST, type: 'calendar', account_schema: [field] });
      expect(accountErrors).to.include('account_schema[0].visible_if.field: must be the key of an earlier field');
    });
  });

  describe('required only when visible', () => {
    it('should not require a hidden field of a manifest action, and require it once visible', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedExternalService({
        manifest: { ...TEST_MANIFEST, actions: [{ key: 'connect', label: { en: 'Connect' }, fields: FORM }] },
      });
      externalIntegration.sendCommand = fake.resolves({ success: true, data: {} });
      await externalIntegration.runAction(service.selector, 'connect', { mqtt_mode: 'embedded' });
      expect(externalIntegration.sendCommand.firstCall.args[2]).to.deep.equal({
        key: 'connect',
        fields: { mqtt_mode: 'embedded' },
      });
      await expect422(
        () => externalIntegration.runAction(service.selector, 'connect', {}),
        'fields.mqtt_url: required',
      );
      await expect422(
        () => externalIntegration.runAction(service.selector, 'connect', { mqtt_url: 'mqtt://h', use_tls: true }),
        'fields.ca_certificate: required',
      );
    });

    it('should apply the same rule to the values of a widget button form', async () => {
      expect(validateActionValues({ fields: FORM }, { mqtt_mode: 'disabled' })).to.deep.equal({
        mqtt_mode: 'disabled',
      });
      await expect422(() => validateActionValues({ fields: FORM }, {}), 'values.mqtt_url: required');
    });

    it('should apply the same rule to the settings of a widget', async () => {
      const service = { id: 'service-id', selector: 'ext-dev-demo', manifest: TEST_MANIFEST };
      expect(await validateWidgetSettings(service, { settings: FORM }, { mqtt_mode: 'embedded' })).to.deep.equal({
        mqtt_mode: 'embedded',
      });
      await expect422(() => validateWidgetSettings(service, { settings: FORM }, {}), 'settings.mqtt_url: required');
    });

    it('should apply the same rule to the fields of a scene action', async () => {
      const service = { id: 'service-id', selector: 'ext-dev-demo', manifest: TEST_MANIFEST };
      const render = (text) => text;
      expect(
        await resolveSceneActionFields(service, { fields: FORM }, { mqtt_mode: 'disabled' }, render),
      ).to.deep.equal({ mqtt_mode: 'disabled' });
      await expect(resolveSceneActionFields(service, { fields: FORM }, {}, render)).to.be.rejectedWith(
        BadParameters,
        'fields.mqtt_url: required',
      );
    });
  });

  describe('scene trigger filters', () => {
    const DECLARATION = {
      key: 'code_received',
      label: { en: 'Code received' },
      fields: [
        { key: 'intro', type: 'section', label: { en: 'Filters' } },
        {
          key: 'source',
          type: 'select',
          label: { en: 'Source' },
          options: [
            { value: 'rf', label: { en: 'RF' } },
            { value: 'ir', label: { en: 'IR' } },
          ],
        },
        { key: 'protocol', type: 'string', label: { en: 'IR protocol' }, visible_if: { field: 'source', in: ['ir'] } },
      ],
    };
    const service = {
      id: 'service-id',
      selector: 'ext-dev-demo',
      manifest: { ...TEST_MANIFEST, scene_triggers: [DECLARATION] },
    };

    it('should carry the display conditions of the filters in the event', () => {
      const { externalIntegration } = buildSupervisor();
      const event = externalIntegration.publishSceneEvent(service, {
        key: 'code_received',
        data: { source: 'rf', protocol: 'NEC' },
      });
      expect(event.filter_fields).to.deep.equal([
        { key: 'source', default: undefined, visible_if: undefined },
        { key: 'protocol', default: undefined, visible_if: { field: 'source', in: ['ir'] } },
      ]);
    });

    it('should not carry them when no filter declares a condition', () => {
      const { externalIntegration } = buildSupervisor();
      const plain = { ...DECLARATION, fields: DECLARATION.fields.slice(0, 2) };
      const event = externalIntegration.publishSceneEvent(
        { ...service, manifest: { ...TEST_MANIFEST, scene_triggers: [plain] } },
        { key: 'code_received', data: { source: 'rf' } },
      );
      expect(event).not.to.have.property('filter_fields');
    });

    it('should treat a hidden filter as a wildcard', () => {
      const { externalIntegration } = buildSupervisor();
      const event = externalIntegration.publishSceneEvent(service, {
        key: 'code_received',
        data: { source: 'rf', protocol: 'NEC' },
      });
      const match = triggersFunc[EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT];
      const trigger = { integration: service.selector, trigger_key: 'code_received' };
      // a stale protocol stored while the scene listened to IR codes: hidden now, ignored
      expect(match(null, 'scene', event, { ...trigger, fields: { source: 'rf', protocol: 'SONY' } })).not.to.equal(
        false,
      );
      // visible, it filters as usual
      expect(match(null, 'scene', event, { ...trigger, fields: { source: 'ir', protocol: 'SONY' } })).to.equal(false);
      // an event without conditions keeps the plain matching
      const { filter_fields: ignored, ...plainEvent } = event;
      expect(match(null, 'scene', plainEvent, { ...trigger, fields: { source: 'rf', protocol: 'SONY' } })).to.equal(
        false,
      );
    });
  });
});
