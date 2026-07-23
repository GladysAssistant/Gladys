const { expect } = require('chai');

const { Error422 } = require('../../../utils/httpErrors');
const { buildSupervisor, TEST_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.validateManifest', () => {
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

  it('should accept a valid manifest', () => {
    const validated = externalIntegration.validateManifest(TEST_MANIFEST);
    expect(validated).to.deep.equal(TEST_MANIFEST);
  });

  it('should accept a communication manifest', () => {
    const manifest = { ...TEST_MANIFEST, type: 'communication' };
    expect(externalIntegration.validateManifest(manifest)).to.equal(manifest);
  });

  it('should accept a manifest without optional fields', () => {
    const { cover_image: coverImage, config_schema: configSchema, ...minimalManifest } = TEST_MANIFEST;
    const validated = externalIntegration.validateManifest(minimalManifest);
    expect(validated).to.deep.equal(minimalManifest);
  });

  it('should reject a non-object manifest', () => {
    expect422(null, 'manifest: must be an object');
    expect422([], 'manifest: must be an object');
  });

  it('should reject a missing manifest_version', () => {
    expect422({ ...TEST_MANIFEST, manifest_version: '1' }, 'manifest_version: must be an integer');
  });

  it('should reject an unsupported manifest_version', () => {
    expect422({ ...TEST_MANIFEST, manifest_version: 2 }, 'not supported');
  });

  it('should reject a manifest_version below 1', () => {
    expect422({ ...TEST_MANIFEST, manifest_version: 0 }, 'manifest_version: must be >= 1');
  });

  it('should reject an unknown type', () => {
    expect422({ ...TEST_MANIFEST, type: 'weather' }, 'type: must be one of device');
  });

  it('should reject a name out of bounds', () => {
    expect422({ ...TEST_MANIFEST, name: 'ab' }, 'name: must be a string of 3-30 characters');
    expect422({ ...TEST_MANIFEST, name: 'a'.repeat(31) }, 'name: must be a string of 3-30 characters');
  });

  it('should reject a description without english', () => {
    expect422({ ...TEST_MANIFEST, description: { fr: 'Une description en français' } }, 'description.en');
  });

  it('should reject a description out of bounds', () => {
    expect422({ ...TEST_MANIFEST, description: { en: 'too short' } }, 'description.en: must be a string of 10-100');
    expect422({ ...TEST_MANIFEST, description: 'not an object' }, 'description: must be an object');
    expect422(
      { ...TEST_MANIFEST, description: { en: 'a valid description', french: 'x'.repeat(20) } },
      'invalid language code',
    );
  });

  it('should accept regional language codes', () => {
    const manifest = {
      ...TEST_MANIFEST,
      description: { en: 'A valid description here.', 'pt-BR': 'Uma descrição válida aqui.' },
    };
    expect(externalIntegration.validateManifest(manifest)).to.equal(manifest);
  });

  it('should reject unknown manifest fields', () => {
    expect422({ ...TEST_MANIFEST, homepage: 'https://example.com' }, 'homepage: unknown field');
  });

  it('should reject an invalid semver version', () => {
    expect422({ ...TEST_MANIFEST, version: 'not-semver' }, 'version: must be valid semver');
    // strict semver: the normalized form must be the exact input
    expect422({ ...TEST_MANIFEST, version: 'v1.2.0' }, 'version: must be valid semver');
  });

  it('should reject an invalid docker image reference', () => {
    expect422({ ...TEST_MANIFEST, docker_image: 'Invalid Image!!' }, 'docker_image: must be a valid image reference');
    // an image longer than 255 characters is rejected
    expect422({ ...TEST_MANIFEST, docker_image: `ghcr.io/${'a'.repeat(250)}/demo:1.0.0` }, 'docker_image');
  });

  it('should reject a missing docker image', () => {
    const { docker_image: dockerImage, ...manifestWithoutImage } = TEST_MANIFEST;
    expect422(manifestWithoutImage, 'docker_image: must be a valid image reference');
  });

  it('should reject a malformed select option entry', () => {
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'select', label: { en: 'L' }, options: [null] }] },
      'config_schema[0].options[0]: must be an object',
    );
  });

  it('should reject an image without explicit tag or digest', () => {
    // an implicit `latest` would make update detection meaningless (same rule as the indexer)
    expect422({ ...TEST_MANIFEST, docker_image: 'ghcr.io/john/demo' }, 'explicit tag or digest');
  });

  it('should accept OCI image names with double underscores and repeated dashes', () => {
    const manifest = { ...TEST_MANIFEST, docker_image: 'ghcr.io/my-org/my__weird---image:1.0.0' };
    expect(externalIntegration.validateManifest(manifest)).to.equal(manifest);
  });

  it('should accept a docker image pinned by digest', () => {
    const manifest = {
      ...TEST_MANIFEST,
      docker_image: `ghcr.io/john/demo@sha256:${'a'.repeat(64)}`,
    };
    expect(externalIntegration.validateManifest(manifest)).to.equal(manifest);
  });

  it('should reject an invalid gladys_version range', () => {
    expect422({ ...TEST_MANIFEST, gladys_version: 'not-a-range' }, 'gladys_version: must be a valid semver range');
  });

  it('should reject a non-https cover image', () => {
    expect422({ ...TEST_MANIFEST, cover_image: 'http://example.com/cover.jpg' }, 'cover_image: must be an https URL');
  });

  it('should reject a non-array config_schema', () => {
    expect422({ ...TEST_MANIFEST, config_schema: {} }, 'config_schema: must be an array');
  });

  it('should reject invalid config_schema fields', () => {
    expect422({ ...TEST_MANIFEST, config_schema: [null] }, 'config_schema[0]: must be an object');
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'BAD KEY', type: 'string', label: { en: 'Label' } }] },
      'config_schema[0].key',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'good_key', type: 'unknown', label: { en: 'Label' } }] },
      'config_schema[0].type',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          { key: 'dup', type: 'string', label: { en: 'Label' } },
          { key: 'dup', type: 'string', label: { en: 'Label' } },
        ],
      },
      'duplicate key "dup"',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'sel', type: 'select', label: { en: 'Label' } }] },
      'config_schema[0].options',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'sel', type: 'select', label: { en: 'Label' }, options: [{ value: 1 }] }],
      },
      'options[0].value',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          {
            key: 'num',
            type: 'number',
            label: { en: 'Label' },
            description: { fr: 'sans anglais' },
            min: 'x',
            max: 'y',
            required: 'yes',
          },
        ],
      },
      'config_schema[0].min: must be a number',
    );
    // same strict rules as the indexer schema
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'string', label: { en: 'Label' }, custom: true }],
      },
      'config_schema[0].custom: unknown field',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'string', label: { en: 'Label' }, min: 0 }],
      },
      'config_schema[0].min: only allowed on number fields',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'string', label: { en: 'Label' }, options: [] }],
      },
      'config_schema[0].options: only allowed on select and multi_select fields',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'number', label: { en: 'Label' }, min: 10, max: 5 }],
      },
      'config_schema[0].min: must be lower than or equal to max',
    );
  });

  it('should accept a placeholder on string, number and secret fields', () => {
    const manifest = {
      ...TEST_MANIFEST,
      config_schema: [
        { key: 'k', type: 'string', label: { en: 'L' }, placeholder: { en: 'e.g. Paris', fr: 'ex. Paris' } },
        { key: 'n', type: 'number', label: { en: 'L' }, placeholder: { en: 'e.g. 48.85' } },
        { key: 's', type: 'secret', label: { en: 'L' }, placeholder: { en: 'e.g. sk-...' } },
      ],
    };
    const validated = externalIntegration.validateManifest(manifest);
    expect(validated).to.deep.equal(manifest);
  });

  it('should reject invalid placeholders', () => {
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'boolean', label: { en: 'L' }, placeholder: { en: 'x' } }],
      },
      'config_schema[0].placeholder: only allowed on string, number, secret fields',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'string', label: { en: 'L' }, placeholder: 'not object' }],
      },
      'config_schema[0].placeholder: must be an object',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'string', label: { en: 'L' }, placeholder: { fr: 'x' } }] },
      'config_schema[0].placeholder.en',
    );
  });

  it('should reject defaults not matching their field type', () => {
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'string', label: { en: 'L' }, default: 1 }] },
      'config_schema[0].default: must be a string',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'number', label: { en: 'L' }, default: 'x' }] },
      'config_schema[0].default: must be a number',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'boolean', label: { en: 'L' }, default: 'yes' }] },
      'config_schema[0].default: must be a boolean',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          {
            key: 'k',
            type: 'select',
            label: { en: 'L' },
            default: 'z',
            options: [{ value: 'a', label: { en: 'A' } }],
          },
        ],
      },
      'config_schema[0].default: must be one of the select options',
    );
    // a secret default would end up published in the store index
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'secret', label: { en: 'L' }, default: 's3cr3t' }] },
      'config_schema[0].default: not allowed for secret fields',
    );
    // the value of an oauth2 field is the Connect flow, tokens live off-schema
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'oauth2', label: { en: 'L' }, default: 'x' }] },
      'config_schema[0].default: not allowed for oauth2 fields',
    );
  });

  it('should accept an oauth2 config field without placeholder', () => {
    const manifest = {
      ...TEST_MANIFEST,
      config_schema: [{ key: 'netatmo_account', type: 'oauth2', label: { en: 'Netatmo account' } }],
    };
    const validated = externalIntegration.validateManifest(manifest);
    expect(validated).to.deep.equal(manifest);
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'oauth2', label: { en: 'L' }, placeholder: { en: 'x' } }],
      },
      'config_schema[0].placeholder: only allowed on',
    );
  });

  it('should accept a valid network_discovery capture list', () => {
    const manifest = {
      ...TEST_MANIFEST,
      network_discovery: [
        { type: 'udp-broadcast', ports: [6666, 6667, 7000] },
        // the active query/response case (TP-Link Kasa)
        { type: 'udp-active-broadcast', ports: [9999, 20002] },
        { type: 'mdns', service: '_hue._tcp' },
        { type: 'ssdp', st: 'urn:dial-multiscreen-org:service:dial:1' },
      ],
    };
    const validated = externalIntegration.validateManifest(manifest);
    expect(validated).to.deep.equal(manifest);
  });

  it('should bound the active broadcast capture like the passive one', () => {
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-active-broadcast' }] },
      'network_discovery[0].ports: must be a list of 1-5 ports',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-active-broadcast', ports: [9999], st: 'x' }] },
      'network_discovery[0].st: unknown field for type udp-active-broadcast',
    );
  });

  it('should reject a malformed network_discovery list', () => {
    expect422({ ...TEST_MANIFEST, network_discovery: 'all' }, 'network_discovery: must be a list');
    expect422({ ...TEST_MANIFEST, network_discovery: [] }, 'network_discovery: must be a list');
    expect422(
      { ...TEST_MANIFEST, network_discovery: Array(6).fill({ type: 'mdns', service: '_hue._tcp' }) },
      'network_discovery: must be a list of 1-5 capture requests',
    );
    expect422({ ...TEST_MANIFEST, network_discovery: ['udp'] }, 'network_discovery[0]: must be an object');
    expect422({ ...TEST_MANIFEST, network_discovery: [{ type: 'pcap' }] }, 'network_discovery[0].type: must be one of');
  });

  it('should reject invalid udp-broadcast capture requests', () => {
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-broadcast' }] },
      'network_discovery[0].ports: must be a list of 1-5 ports',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-broadcast', ports: [1, 2, 3, 4, 5, 6] }] },
      'network_discovery[0].ports: must be a list of 1-5 ports',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-broadcast', ports: [0] }] },
      'network_discovery[0].ports[0]: must be an integer between 1 and 65535',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-broadcast', ports: [6666, 6666] }] },
      'network_discovery[0].ports[1]: duplicate port 6666',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-broadcast', ports: [6666], service: '_hue._tcp' }] },
      'network_discovery[0].service: unknown field for type udp-broadcast',
    );
  });

  it('should reject invalid mdns and ssdp capture requests', () => {
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'mdns', service: 'not a service' }] },
      'network_discovery[0].service: must be a DNS-SD service type',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'mdns' }] },
      'network_discovery[0].service: must be a DNS-SD service type',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'ssdp', st: '' }] },
      'network_discovery[0].st: must be a string of 1-200 characters',
    );
    expect422(
      { ...TEST_MANIFEST, network_discovery: [{ type: 'ssdp', st: 's'.repeat(201) }] },
      'network_discovery[0].st: must be a string of 1-200 characters',
    );
  });

  it('should accept multi_select fields and radio selects', () => {
    const manifest = {
      ...TEST_MANIFEST,
      config_schema: [
        {
          key: 'rooms',
          type: 'multi_select',
          label: { en: 'Rooms' },
          default: ['living', 'kitchen'],
          options: [
            { value: 'living', label: { en: 'Living room' } },
            { value: 'kitchen', label: { en: 'Kitchen' } },
          ],
        },
        {
          key: 'mode',
          type: 'select',
          label: { en: 'Mode' },
          display: 'radio',
          options: [
            { value: 'auto', label: { en: 'Auto' } },
            { value: 'manual', label: { en: 'Manual' } },
          ],
        },
      ],
    };
    const validated = externalIntegration.validateManifest(manifest);
    expect(validated).to.deep.equal(manifest);
  });

  it('should reject invalid multi_select and display usages', () => {
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'multi_select', label: { en: 'L' } }] },
      'config_schema[0].options: multi_select fields must have a non-empty options list',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          {
            key: 'k',
            type: 'multi_select',
            label: { en: 'L' },
            default: ['nope'],
            options: [{ value: 'a', label: { en: 'A' } }],
          },
        ],
      },
      'config_schema[0].default: must be an array of the multi_select option values',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'string', label: { en: 'L' }, display: 'radio' }] },
      'config_schema[0].display: only allowed on select fields',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          {
            key: 'k',
            type: 'select',
            label: { en: 'L' },
            display: 'carousel',
            options: [{ value: 'a', label: { en: 'A' } }],
          },
        ],
      },
      'config_schema[0].display: must be one of dropdown, radio',
    );
  });

  it('should accept select and multi_select fields with the devices dynamic source', () => {
    const manifest = {
      ...TEST_MANIFEST,
      config_schema: [{ key: 'main_device', type: 'select', label: { en: 'Device' }, source: 'devices' }],
      actions: [
        {
          key: 'detect_protocol',
          label: { en: 'Detect protocol' },
          fields: [{ key: 'targets', type: 'multi_select', label: { en: 'Devices' }, source: 'devices' }],
        },
      ],
    };
    const validated = externalIntegration.validateManifest(manifest);
    expect(validated).to.deep.equal(manifest);
  });

  it('should reject invalid dynamic source usages', () => {
    // unknown source: the enum is reserved and defined by the core
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'select', label: { en: 'L' }, source: 'rooms' }] },
      'config_schema[0].source: must be one of devices',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'string', label: { en: 'L' }, source: 'devices' }] },
      'config_schema[0].source: only allowed on select and multi_select fields',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          {
            key: 'k',
            type: 'select',
            label: { en: 'L' },
            source: 'devices',
            options: [{ value: 'a', label: { en: 'A' } }],
          },
        ],
      },
      'config_schema[0].options: mutually exclusive with source',
    );
    // the dynamic values are unknown at validation time
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'k', type: 'select', label: { en: 'L' }, source: 'devices', default: 'a' }],
      },
      'config_schema[0].default: not allowed with a dynamic source',
    );
  });

  it('should accept section intro blocks in the config_schema and in action fields', () => {
    const section = {
      key: 'intro',
      type: 'section',
      label: { en: 'Getting started', fr: 'Pour commencer' },
      description: { en: 'Create a developer account to get your API key.' },
      links: [{ url: 'https://open-meteo.com/en/docs', label: { en: 'Open-Meteo docs' } }],
    };
    const manifest = {
      ...TEST_MANIFEST,
      config_schema: [section, ...TEST_MANIFEST.config_schema],
      actions: [{ key: 'pair', label: { en: 'Pair' }, fields: [{ ...section, key: 'pair_intro' }] }],
    };
    const validated = externalIntegration.validateManifest(manifest);
    expect(validated).to.deep.equal(manifest);
  });

  it('should reject value semantics and malformed links on section fields', () => {
    const section = { key: 'intro', type: 'section', label: { en: 'Intro' } };
    // purely presentational: nothing value-related is allowed
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ ...section, required: true }] },
      'config_schema[0].required: not allowed on section fields',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ ...section, default: 'x' }] },
      'config_schema[0].default: not allowed for section fields',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ ...section, placeholder: { en: 'x' } }] },
      'config_schema[0].placeholder: only allowed on string, number, secret fields',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ ...section, description: { en: 'x'.repeat(1001) } }] },
      'config_schema[0].description.en: must be a string of 1-1000 characters',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ key: 'k', type: 'string', label: { en: 'L' }, links: [] }] },
      'config_schema[0].links: only allowed on section fields',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ ...section, links: [] }] },
      'config_schema[0].links: must be a list of 1-5 links',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ ...section, links: Array(6).fill({ url: 'https://a.com', label: { en: 'A' } }) }],
      },
      'config_schema[0].links: must be a list of 1-5 links',
    );
    expect422({ ...TEST_MANIFEST, config_schema: [{ ...section, links: ['x'] }] }, 'links[0]: must be an object');
    // third-party content: https only, the front shows the target domain
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ ...section, links: [{ url: 'http://a.com', label: { en: 'A' } }] }] },
      'links[0].url: must be an https URL',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [{ ...section, links: [{ url: 'https://a.com', label: { en: 'A' }, icon: 'x' }] }],
      },
      'links[0].icon: unknown field',
    );
    expect422(
      { ...TEST_MANIFEST, config_schema: [{ ...section, links: [{ url: 'https://a.com', label: { fr: 'A' } }] }] },
      'links[0].label.en: english translation is required',
    );
  });

  it('should accept a valid actions list', () => {
    const manifest = {
      ...TEST_MANIFEST,
      actions: [
        {
          key: 'detect_protocol',
          label: { en: 'Detect protocol version', fr: 'Détecter la version de protocole' },
          description: { en: 'Tries each protocol version against the device.' },
          timeout_seconds: 30,
          fields: [{ key: 'ip', type: 'string', label: { en: 'Device IP' }, required: true }],
        },
        { key: 'test_connection', label: { en: 'Test connection' } },
      ],
    };
    const validated = externalIntegration.validateManifest(manifest);
    expect(validated).to.deep.equal(manifest);
  });

  it('should reject a malformed actions list', () => {
    expect422({ ...TEST_MANIFEST, actions: 'all' }, 'actions: must be a list of 1-10 actions');
    expect422({ ...TEST_MANIFEST, actions: [] }, 'actions: must be a list of 1-10 actions');
    expect422(
      { ...TEST_MANIFEST, actions: Array(11).fill({ key: 'a', label: { en: 'A' } }) },
      'actions: must be a list of 1-10 actions',
    );
    expect422({ ...TEST_MANIFEST, actions: ['run'] }, 'actions[0]: must be an object');
    expect422({ ...TEST_MANIFEST, actions: [{ key: 'Bad Key', label: { en: 'A' } }] }, 'actions[0].key');
    expect422(
      {
        ...TEST_MANIFEST,
        actions: [
          { key: 'a', label: { en: 'A' } },
          { key: 'a', label: { en: 'A again' } },
        ],
      },
      'actions[1].key: duplicate key "a"',
    );
    expect422({ ...TEST_MANIFEST, actions: [{ key: 'a', label: { fr: 'Sans anglais' } }] }, 'actions[0].label.en');
    expect422(
      { ...TEST_MANIFEST, actions: [{ key: 'a', label: { en: 'A' }, unknown_field: true }] },
      'actions[0].unknown_field: unknown field',
    );
    expect422(
      { ...TEST_MANIFEST, actions: [{ key: 'a', label: { en: 'A' }, timeout_seconds: 4 }] },
      'actions[0].timeout_seconds: must be an integer between 5 and 120',
    );
    expect422(
      { ...TEST_MANIFEST, actions: [{ key: 'a', label: { en: 'A' }, timeout_seconds: 121 }] },
      'actions[0].timeout_seconds: must be an integer between 5 and 120',
    );
    expect422(
      { ...TEST_MANIFEST, actions: [{ key: 'a', label: { en: 'A' }, fields: 'ip' }] },
      'actions[0].fields: must be an array',
    );
    // the mini form reuses the config_schema engine, errors included
    expect422(
      { ...TEST_MANIFEST, actions: [{ key: 'a', label: { en: 'A' }, fields: [{ key: 'ip', type: 'unknown-type' }] }] },
      'actions[0].fields[0].type',
    );
  });

  it('should accept a valid containers declaration', () => {
    const manifest = {
      ...TEST_MANIFEST,
      containers: [
        {
          name: 'mqtt',
          docker_image: 'eclipse-mosquitto:2.0.18',
          start: 'manual',
          volumes: ['/mosquitto/config', '/mosquitto/data'],
          memory_mb: 128,
        },
        {
          name: 'frigate',
          docker_image: 'ghcr.io/blakeblackshear/frigate:0.14.1',
          read_only: false,
          memory_mb: 1024,
          shm_mb: 128,
          cpu: 1,
          env: { LIBVA_DRIVER_NAME: 'i965' },
          command: ['python3', '-m', 'frigate'],
          ports: [{ container_port: 5000, protocol: 'tcp', label: { en: 'Frigate UI' } }],
          devices: ['coral-usb', 'gpu'],
        },
      ],
    };
    expect(externalIntegration.validateManifest(manifest)).to.equal(manifest);
  });

  it('should reject an invalid containers list', () => {
    expect422({ ...TEST_MANIFEST, containers: {} }, 'containers: must be an array');
    const entry = { name: 'ok', docker_image: 'img:1.0.0' };
    expect422(
      { ...TEST_MANIFEST, containers: [entry, entry, entry, entry, entry, entry] },
      'containers: must be an array of at most 5 entries',
    );
    expect422({ ...TEST_MANIFEST, containers: [null] }, 'containers[0]: must be an object');
  });

  it('should reject invalid sub-container names and images', () => {
    expect422(
      { ...TEST_MANIFEST, containers: [{ name: 'BAD NAME', docker_image: 'img:1.0.0' }] },
      'containers[0].name',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        containers: [
          { name: 'dup', docker_image: 'img:1.0.0' },
          { name: 'dup', docker_image: 'img:1.0.0' },
        ],
      },
      'duplicate name "dup"',
    );
    expect422(
      { ...TEST_MANIFEST, containers: [{ name: 'mqtt', docker_image: 'no-tag' }] },
      'containers[0].docker_image',
    );
    expect422(
      { ...TEST_MANIFEST, containers: [{ name: 'mqtt', docker_image: 'img:1.0.0', unknown: true }] },
      'containers[0].unknown: unknown field',
    );
    expect422(
      { ...TEST_MANIFEST, containers: [{ name: 'mqtt', docker_image: 'img:1.0.0', start: 'always' }] },
      'containers[0].start',
    );
  });

  it('should reject invalid sub-container env declarations', () => {
    const base = { name: 'mqtt', docker_image: 'img:1.0.0' };
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, env: [] }] }, 'containers[0].env: must be an object');
    // the manifest is public: GLADYS_* is reserved, checked case-insensitively
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, env: { gladys_token: 'x' } }] },
      'containers[0].env.gladys_token: GLADYS_* keys are reserved',
    );
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, env: { KEY: 1 } }] }, 'containers[0].env.KEY');
  });

  it('should reject invalid sub-container volumes', () => {
    const base = { name: 'mqtt', docker_image: 'img:1.0.0' };
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, volumes: {} }] }, 'containers[0].volumes');
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, volumes: ['/a', '/b', '/c', '/d', '/e', '/f'] }] },
      'containers[0].volumes: must be an array of at most 5',
    );
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, volumes: ['relative'] }] }, 'containers[0].volumes[0]');
    // a .. segment could escape the integration folder on the host
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, volumes: ['/config/../../etc'] }] },
      'containers[0].volumes[0]: must be an absolute container path without ..',
    );
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, volumes: [42] }] }, 'containers[0].volumes[0]');
  });

  it('should reject invalid sub-container ports', () => {
    const base = { name: 'ui', docker_image: 'img:1.0.0' };
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, ports: {} }] }, 'containers[0].ports');
    const port = { container_port: 80, label: { en: 'UI' } };
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, ports: [port, port, port, port] }] },
      'containers[0].ports: must be an array of at most 3',
    );
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, ports: [null] }] },
      'containers[0].ports[0]: must be an object',
    );
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, ports: [{ container_port: 0, label: { en: 'UI' } }] }] },
      'containers[0].ports[0].container_port',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        containers: [{ ...base, ports: [{ container_port: 80, protocol: 'sctp', label: { en: 'UI' } }] }],
      },
      'containers[0].ports[0].protocol',
    );
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, ports: [{ container_port: 80, label: { fr: 'UI' } }] }] },
      'containers[0].ports[0].label.en',
    );
    // the host port is never declared: chosen by Gladys
    expect422(
      {
        ...TEST_MANIFEST,
        containers: [{ ...base, ports: [{ container_port: 80, host_port: 8080, label: { en: 'UI' } }] }],
      },
      'containers[0].ports[0].host_port: unknown field',
    );
  });

  it('should reject invalid sub-container hardware classes', () => {
    const base = { name: 'frigate', docker_image: 'img:1.0.0' };
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, devices: {} }] }, 'containers[0].devices');
    // never a free /dev path
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, devices: ['/dev/sda'] }] },
      'containers[0].devices[0]: must be one of coral-usb, coral-pcie, gpu, video',
    );
    expect422(
      { ...TEST_MANIFEST, containers: [{ ...base, devices: ['gpu', 'gpu'] }] },
      'containers[0].devices[1]: duplicate class "gpu"',
    );
  });

  it('should reject out-of-bounds sub-container limits', () => {
    const base = { name: 'mqtt', docker_image: 'img:1.0.0' };
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, read_only: 'yes' }] }, 'containers[0].read_only');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, memory_mb: 16 }] }, 'containers[0].memory_mb');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, memory_mb: 8192 }] }, 'containers[0].memory_mb');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, cpu: 4 }] }, 'containers[0].cpu');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, cpu: '1' }] }, 'containers[0].cpu');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, shm_mb: 32 }] }, 'containers[0].shm_mb');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, shm_mb: 1024 }] }, 'containers[0].shm_mb');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, command: 'mosquitto' }] }, 'containers[0].command');
    expect422({ ...TEST_MANIFEST, containers: [{ ...base, command: [1] }] }, 'containers[0].command');
  });

  it('should accept a valid transports declaration', () => {
    ['local', 'cloud'].forEach((transport) => {
      const manifest = { ...TEST_MANIFEST, transports: [transport] };
      expect(externalIntegration.validateManifest(manifest)).to.deep.equal(manifest);
    });
    const dualManifest = { ...TEST_MANIFEST, transports: ['local', 'cloud'] };
    expect(externalIntegration.validateManifest(dualManifest)).to.deep.equal(dualManifest);
  });

  it('should reject an invalid transports declaration', () => {
    [[], ['satellite'], ['local', 'local'], 'local'].forEach((transports) => {
      expect422({ ...TEST_MANIFEST, transports }, 'transports: must be a non-empty subset of local, cloud');
    });
  });

  it('should accept the messaging declaration and its contact_schema on send-only channels', () => {
    const chatManifest = { ...TEST_MANIFEST, type: 'communication', messaging: { receive: true } };
    expect(externalIntegration.validateManifest(chatManifest)).to.deep.equal(chatManifest);
    const notificationManifest = {
      ...TEST_MANIFEST,
      type: 'communication',
      config_schema: undefined,
      messaging: { receive: false },
      contact_schema: [
        { key: 'username', type: 'string', label: { en: 'Username' }, required: true },
        { key: 'access_token', type: 'secret', label: { en: 'Access token' } },
      ],
    };
    expect(externalIntegration.validateManifest(notificationManifest)).to.deep.equal(notificationManifest);
  });

  it('should reject a malformed messaging declaration', () => {
    expect422({ ...TEST_MANIFEST, messaging: { receive: true } }, 'messaging: only allowed on communication');
    expect422({ ...TEST_MANIFEST, type: 'communication', messaging: 'yes' }, 'messaging: must be an object');
    expect422(
      { ...TEST_MANIFEST, type: 'communication', messaging: { receive: 'no' } },
      'messaging.receive: must be a boolean',
    );
    expect422(
      { ...TEST_MANIFEST, type: 'communication', messaging: { receive: true, channels: 3 } },
      'messaging.channels: unknown field',
    );
  });

  it('should reject contact_schema outside send-only channels and invalid entries', () => {
    const contactSchema = [{ key: 'username', type: 'string', label: { en: 'Username' } }];
    // a chat channel identity comes from the code-based link
    expect422({ ...TEST_MANIFEST, contact_schema: contactSchema }, 'contact_schema: only allowed on send-only');
    expect422(
      { ...TEST_MANIFEST, type: 'communication', messaging: { receive: true }, contact_schema: contactSchema },
      'contact_schema: only allowed on send-only',
    );
    const base = { ...TEST_MANIFEST, type: 'communication', messaging: { receive: false } };
    expect422({ ...base, contact_schema: 'username' }, 'contact_schema: must be an array');
    expect422({ ...base, contact_schema: [{ key: 'x', type: 'unknown', label: { en: 'X' } }] }, 'contact_schema[0]');
    expect422(
      {
        ...base,
        contact_schema: [
          { key: 'dup', type: 'string', label: { en: 'X' } },
          { key: 'dup', type: 'string', label: { en: 'X' } },
        ],
      },
      'contact_schema[1].key: duplicate key "dup"',
    );
    // the OAuth relay is integration-scoped, never per user
    expect422(
      { ...base, contact_schema: [{ key: 'account', type: 'oauth2', label: { en: 'Account' } }] },
      'contact_schema[0].type: oauth2 is not allowed in the per-user contact schema',
    );
  });

  it('should accept a valid webhooks declaration', () => {
    const manifest = {
      ...TEST_MANIFEST,
      webhooks: [
        { key: 'events', label: { en: 'Netatmo events' } },
        { key: 'callback', label: { en: 'Subscription callback', fr: "Rappel d'abonnement" }, mode: 'sync' },
        { key: 'status', label: { en: 'Status' }, mode: 'fire_and_forget' },
      ],
    };
    expect(externalIntegration.validateManifest(manifest)).to.deep.equal(manifest);
  });

  it('should reject a malformed webhooks declaration', () => {
    const webhook = { key: 'events', label: { en: 'Events' } };
    expect422({ ...TEST_MANIFEST, webhooks: [] }, 'webhooks: must be a list of 1-3 webhooks');
    expect422({ ...TEST_MANIFEST, webhooks: 'events' }, 'webhooks: must be a list of 1-3 webhooks');
    expect422(
      { ...TEST_MANIFEST, webhooks: [webhook, webhook, webhook, webhook] },
      'webhooks: must be a list of 1-3 webhooks',
    );
    expect422({ ...TEST_MANIFEST, webhooks: ['events'] }, 'webhooks[0]: must be an object');
    expect422({ ...TEST_MANIFEST, webhooks: [{ ...webhook, url: 'https://x' }] }, 'webhooks[0].url: unknown field');
    expect422(
      { ...TEST_MANIFEST, webhooks: [{ label: { en: 'Events' } }] },
      'webhooks[0].key: must be a non-empty string matching [a-z0-9_]',
    );
    expect422(
      { ...TEST_MANIFEST, webhooks: [{ key: 'BAD-KEY', label: { en: 'Events' } }] },
      'webhooks[0].key: must be a non-empty string matching [a-z0-9_]',
    );
    expect422({ ...TEST_MANIFEST, webhooks: [webhook, webhook] }, 'webhooks[1].key: duplicate key "events"');
    expect422({ ...TEST_MANIFEST, webhooks: [{ key: 'events' }] }, 'webhooks[0].label: must be an object');
    expect422(
      { ...TEST_MANIFEST, webhooks: [{ ...webhook, mode: 'async' }] },
      'webhooks[0].mode: must be one of fire_and_forget, sync',
    );
  });

  it('should reject unknown fields and empty values in select options', () => {
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          {
            key: 'k',
            type: 'select',
            label: { en: 'L' },
            options: [{ value: '', label: { en: 'A' }, icon: 'x' }],
          },
        ],
      },
      'config_schema[0].options[0].value: must be a non-empty string',
    );
    expect422(
      {
        ...TEST_MANIFEST,
        config_schema: [
          {
            key: 'k',
            type: 'select',
            label: { en: 'L' },
            options: [{ value: 'a', label: { en: 'A' }, icon: 'x' }],
          },
        ],
      },
      'config_schema[0].options[0].icon: unknown field',
    );
  });
});
