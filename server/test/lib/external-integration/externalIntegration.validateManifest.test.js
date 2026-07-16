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
      'config_schema[0].options: only allowed on select fields',
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
