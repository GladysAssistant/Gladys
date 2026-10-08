const { expect } = require('chai');

const { Error422 } = require('../../../utils/httpErrors');
const {
  buildSupervisor,
  TEST_MANIFEST,
  TEST_WIDGET_MANIFEST,
  TEST_PROVIDER_MANIFEST,
  TEST_SCENE_MANIFEST,
} = require('./testUtils.test');

describe('externalIntegration.validateManifest — widgets and provider type', () => {
  let externalIntegration;

  beforeEach(() => {
    ({ externalIntegration } = buildSupervisor());
  });

  const expect422 = (manifest, messagePart) => {
    try {
      externalIntegration.validateManifest(manifest);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include(messagePart);
    }
  };

  const withWidget = (widget, base = TEST_MANIFEST) => ({ ...base, widgets: [widget] });
  const [CINEMA_WIDGET] = TEST_WIDGET_MANIFEST.widgets;

  it('should accept widgets on device, communication and weather manifests', () => {
    expect(externalIntegration.validateManifest(TEST_WIDGET_MANIFEST)).to.deep.equal(TEST_WIDGET_MANIFEST);
    ['communication', 'weather'].forEach((type) => {
      const manifest = { ...TEST_WIDGET_MANIFEST, type };
      expect(externalIntegration.validateManifest(manifest)).to.deep.equal(manifest);
    });
  });

  it('should accept a provider manifest declaring a widget', () => {
    expect(externalIntegration.validateManifest(TEST_PROVIDER_MANIFEST)).to.deep.equal(TEST_PROVIDER_MANIFEST);
  });

  it('should accept a provider manifest declaring only scene triggers or actions', () => {
    // scene declarations are capability fields too: an event source with no
    // device surface (a Frigate-like "events only" bridge) is a provider
    const { widgets, ...providerWithoutWidgets } = TEST_PROVIDER_MANIFEST;
    const triggersOnly = { ...providerWithoutWidgets, scene_triggers: TEST_SCENE_MANIFEST.scene_triggers };
    expect(externalIntegration.validateManifest(triggersOnly)).to.deep.equal(triggersOnly);
    const actionsOnly = { ...providerWithoutWidgets, scene_actions: TEST_SCENE_MANIFEST.scene_actions };
    expect(externalIntegration.validateManifest(actionsOnly)).to.deep.equal(actionsOnly);
    expect(widgets).to.be.an('array');
  });

  it('should reject a provider manifest declaring no capability', () => {
    const { widgets, ...manifest } = TEST_PROVIDER_MANIFEST;
    expect422(
      manifest,
      'type: a provider integration must declare at least one capability field (widgets, scene_triggers, scene_actions, energy_contracts)',
    );
  });

  it('should reject a widgets list that is empty or too long', () => {
    expect422({ ...TEST_MANIFEST, widgets: [] }, 'widgets: must be a list of 1-5 widgets');
    expect422({ ...TEST_MANIFEST, widgets: 'nope' }, 'widgets: must be a list of 1-5 widgets');
    const widgets = [1, 2, 3, 4, 5, 6].map((index) => ({ ...CINEMA_WIDGET, key: `widget_${index}` }));
    expect422({ ...TEST_MANIFEST, widgets }, 'widgets: must be a list of 1-5 widgets');
  });

  it('should reject a widget that is not an object or carries unknown fields', () => {
    expect422({ ...TEST_MANIFEST, widgets: [null] }, 'widgets[0]: must be an object');
    expect422(withWidget({ ...CINEMA_WIDGET, color: 'red' }), 'widgets[0].color: unknown field');
  });

  it('should validate the widget key: shape and duplicate keys', () => {
    expect422(withWidget({ ...CINEMA_WIDGET, key: 'A' }), 'widgets[0].key: must be a string matching [a-z0-9_]{2,32}');
    expect422(withWidget({ ...CINEMA_WIDGET, key: undefined }), 'widgets[0].key: must be a string matching');
    expect422(
      { ...TEST_MANIFEST, widgets: [CINEMA_WIDGET, { ...CINEMA_WIDGET }] },
      'widgets[1].key: duplicate key "upcoming_releases"',
    );
  });

  it('should validate the label and description lengths', () => {
    expect422(withWidget({ ...CINEMA_WIDGET, label: { en: 'Up' } }), 'widgets[0].label.en: must be a string of 3-30');
    expect422(
      withWidget({ ...CINEMA_WIDGET, label: { en: 'x'.repeat(31) } }),
      'widgets[0].label.en: must be a string of 3-30',
    );
    expect422(withWidget({ ...CINEMA_WIDGET, label: 'Upcoming' }), 'widgets[0].label: must be an object');
    expect422(
      withWidget({ ...CINEMA_WIDGET, description: { en: 'x'.repeat(101) } }),
      'widgets[0].description.en: must be a string of 1-100',
    );
  });

  it('should validate the icon shape but never the icon name', () => {
    expect422(withWidget({ ...CINEMA_WIDGET, icon: 'Film Reel' }), 'widgets[0].icon: must be a Feather icon name');
    expect422(withWidget({ ...CINEMA_WIDGET, icon: 42 }), 'widgets[0].icon: must be a Feather icon name');
    const unknownIcon = withWidget({ ...CINEMA_WIDGET, icon: 'not-a-feather-icon' });
    expect(externalIntegration.validateManifest(unknownIcon)).to.deep.equal(unknownIcon);
  });

  it('should validate the settings list with the config_schema engine', () => {
    expect422(
      withWidget({ ...CINEMA_WIDGET, settings: 'nope' }),
      'widgets[0].settings: must be an array of at most 10',
    );
    const tooMany = Array.from({ length: 11 }, (value, index) => ({
      key: `setting_${index}`,
      type: 'string',
      label: { en: 'Setting' },
    }));
    expect422(
      withWidget({ ...CINEMA_WIDGET, settings: tooMany }),
      'widgets[0].settings: must be an array of at most 10',
    );
    expect422(
      withWidget({ ...CINEMA_WIDGET, settings: [{ key: 'a', type: 'string', label: { en: 'A' }, min: 1 }] }),
      'widgets[0].settings[0].min: only allowed on number fields',
    );
    expect422(
      withWidget({
        ...CINEMA_WIDGET,
        settings: [
          { key: 'a', type: 'string', label: { en: 'A' } },
          { key: 'a', type: 'string', label: { en: 'A' } },
        ],
      }),
      'widgets[0].settings[1].key: duplicate key "a"',
    );
    expect422(withWidget({ ...CINEMA_WIDGET, settings: [null] }), 'widgets[0].settings[0]: must be an object');
  });

  it('should reject sensitive setting types (secret, oauth2, account_link)', () => {
    ['secret', 'oauth2', 'account_link'].forEach((type) => {
      expect422(
        withWidget({ ...CINEMA_WIDGET, settings: [{ key: 'token', type, label: { en: 'Token' } }] }),
        `widgets[0].settings[0].type: ${type} is not allowed in widget settings`,
      );
    });
  });

  it('should reject {{port:<name>}} placeholders in setting sections but allow {{gladys_host}}', () => {
    const manifest = {
      ...TEST_MANIFEST,
      containers: [
        {
          name: 'frigate',
          docker_image: 'ghcr.io/blakeblackshear/frigate:0.14.1',
          ports: [{ container_port: 5000, name: 'frigate_ui', label: { en: 'UI' } }],
        },
      ],
      widgets: [
        {
          ...CINEMA_WIDGET,
          settings: [
            {
              key: 'intro',
              type: 'section',
              label: { en: 'Reach the UI on {{port:frigate_ui}}' },
              description: { en: 'http://{{gladys_host}}:{{port:frigate_ui}}' },
            },
          ],
        },
      ],
    };
    expect422(manifest, 'widgets[0].settings[0].label.en: {{port:frigate_ui}} is not available in widget settings');
    expect422(
      manifest,
      'widgets[0].settings[0].description.en: {{port:frigate_ui}} is not available in widget settings',
    );
    const hostOnly = withWidget({
      ...CINEMA_WIDGET,
      settings: [{ key: 'intro', type: 'section', label: { en: 'Open http://{{gladys_host}}' } }],
    });
    expect(externalIntegration.validateManifest(hostOnly)).to.deep.equal(hostOnly);
  });

  it('should accept a source: "devices" setting', () => {
    const manifest = withWidget(TEST_WIDGET_MANIFEST.widgets[1]);
    expect(externalIntegration.validateManifest(manifest)).to.deep.equal(manifest);
  });

  it('should validate action_timeout_seconds bounds', () => {
    expect422(
      withWidget({ ...CINEMA_WIDGET, action_timeout_seconds: 4 }),
      'widgets[0].action_timeout_seconds: must be an integer between 5 and 120',
    );
    expect422(
      withWidget({ ...CINEMA_WIDGET, action_timeout_seconds: 121 }),
      'widgets[0].action_timeout_seconds: must be an integer between 5 and 120',
    );
    expect422(
      withWidget({ ...CINEMA_WIDGET, action_timeout_seconds: '30' }),
      'widgets[0].action_timeout_seconds: must be an integer between 5 and 120',
    );
  });
});
