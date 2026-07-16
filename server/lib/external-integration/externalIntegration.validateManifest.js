const semver = require('semver');

const { Error422 } = require('../../utils/httpErrors');
const { SUPPORTED_MANIFEST_VERSION } = require('./constants');

// These rules are the exact mirror of the canonical manifest schema owned by
// GladysAssistant/integration-store (vendored copy in manifest.schema.json):
// a manifest accepted by the indexer must always install here, and vice versa.
const MANIFEST_TYPES = ['device'];
const MANIFEST_FIELDS = [
  'manifest_version',
  'type',
  'name',
  'description',
  'version',
  'docker_image',
  'gladys_version',
  'cover_image',
  'config_schema',
];
const CONFIG_FIELD_TYPES = ['string', 'number', 'boolean', 'select', 'secret'];
const CONFIG_FIELD_FIELDS = [
  'key',
  'type',
  'label',
  'description',
  'placeholder',
  'required',
  'default',
  'min',
  'max',
  'options',
];
// boolean has no input to hint, select shows its options
const PLACEHOLDER_FIELD_TYPES = ['string', 'number', 'secret'];
const OPTION_FIELDS = ['value', 'label'];
const LANGUAGE_KEY_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;
const CONFIG_KEY_REGEX = /^[a-z0-9_]+$/;

// Grammar from the OCI distribution reference specification, restricted to a
// well-formed name with an EXPLICIT tag or digest (same as the indexer — an
// implicit `latest` would make update detection meaningless).
const DOMAIN_COMPONENT = '(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])';
const DOMAIN = `${DOMAIN_COMPONENT}(?:\\.${DOMAIN_COMPONENT})*(?::[0-9]+)?`;
const PATH_COMPONENT = '[a-z0-9]+(?:(?:\\.|_|__|-+)[a-z0-9]+)*';
const NAME = `(?:${DOMAIN}/)?${PATH_COMPONENT}(?:/${PATH_COMPONENT})*`;
const TAG = '[\\w][\\w.-]{0,127}';
const DIGEST = '[a-z0-9]+(?:[.+_-][a-z0-9]+)*:[a-fA-F0-9]{32,}';
const DOCKER_IMAGE_REGEX = new RegExp(`^(${NAME})(?::(${TAG}))?(?:@(${DIGEST}))?$`);
const DOCKER_IMAGE_NAME_MAX_LENGTH = 255;

/**
 * @description Check a Docker image reference: well-formed OCI reference with
 * an explicit tag or digest.
 * @param {string} reference - The image reference.
 * @returns {boolean} True when the reference is acceptable.
 * @example
 * isValidDockerImageReference('ghcr.io/john/demo:1.2.0');
 */
function isValidDockerImageReference(reference) {
  if (typeof reference !== 'string') {
    return false;
  }
  const match = DOCKER_IMAGE_REGEX.exec(reference);
  if (!match) {
    return false;
  }
  const [, name, tag, digest] = match;
  if (name.length > DOCKER_IMAGE_NAME_MAX_LENGTH) {
    return false;
  }
  return tag !== undefined || digest !== undefined;
}

/**
 * @description Validate a multi-language text object ({ en: '...', fr: '...' }).
 * @param {object} value - The value to validate.
 * @param {string} path - The path of the field, for error messages.
 * @param {Array} errors - The array of errors to push to.
 * @param {number} [minLength] - Minimum length of each translation.
 * @param {number} [maxLength] - Maximum length of each translation.
 * @example
 * validateMultiLanguageText({ en: 'My integration' }, 'description', errors);
 */
function validateMultiLanguageText(value, path, errors, minLength = 1, maxLength = Infinity) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${path}: must be an object mapping language codes to strings`);
    return;
  }
  if (typeof value.en !== 'string') {
    errors.push(`${path}.en: english translation is required`);
  }
  Object.keys(value).forEach((language) => {
    if (!LANGUAGE_KEY_REGEX.test(language)) {
      errors.push(`${path}.${language}: invalid language code`);
      return;
    }
    const text = value[language];
    if (typeof text !== 'string' || text.length < minLength || text.length > maxLength) {
      errors.push(`${path}.${language}: must be a string of ${minLength}-${maxLength} characters`);
    }
  });
}

/**
 * @description Validate the `default` value of a config field against its type.
 * A secret has no meaningful default: it would end up published in the store.
 * @param {object} field - The config field.
 * @param {string} path - The path of the field, for error messages.
 * @param {Array} errors - The array of errors to push to.
 * @example
 * validateConfigFieldDefault({ key: 'latitude', type: 'number', default: 48.85 }, 'config_schema[0]', errors);
 */
function validateConfigFieldDefault(field, path, errors) {
  if (field.default === undefined) {
    return;
  }
  switch (field.type) {
    case 'string':
      if (typeof field.default !== 'string') {
        errors.push(`${path}.default: must be a string`);
      }
      break;
    case 'number':
      if (typeof field.default !== 'number') {
        errors.push(`${path}.default: must be a number`);
      }
      break;
    case 'boolean':
      if (typeof field.default !== 'boolean') {
        errors.push(`${path}.default: must be a boolean`);
      }
      break;
    case 'select':
      if (!Array.isArray(field.options) || !field.options.some((option) => option.value === field.default)) {
        errors.push(`${path}.default: must be one of the select options`);
      }
      break;
    default:
      errors.push(`${path}.default: not allowed for secret fields`);
  }
}

/**
 * @description Validate one entry of the config_schema flat list.
 * @param {object} field - The field to validate.
 * @param {number} index - Index of the field in the list.
 * @param {Set} seenKeys - Keys already seen, to detect duplicates.
 * @param {Array} errors - The array of errors to push to.
 * @example
 * validateConfigField({ key: 'latitude', type: 'number', label: { en: 'Latitude' } }, 0, seenKeys, errors);
 */
function validateConfigField(field, index, seenKeys, errors) {
  const path = `config_schema[${index}]`;
  if (field === null || typeof field !== 'object' || Array.isArray(field)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  Object.keys(field).forEach((key) => {
    if (!CONFIG_FIELD_FIELDS.includes(key)) {
      errors.push(`${path}.${key}: unknown field`);
    }
  });
  if (typeof field.key !== 'string' || !CONFIG_KEY_REGEX.test(field.key)) {
    errors.push(`${path}.key: must be a non-empty string matching [a-z0-9_]`);
  } else if (seenKeys.has(field.key)) {
    errors.push(`${path}.key: duplicate key "${field.key}"`);
  } else {
    seenKeys.add(field.key);
  }
  if (!CONFIG_FIELD_TYPES.includes(field.type)) {
    errors.push(`${path}.type: must be one of ${CONFIG_FIELD_TYPES.join(', ')}`);
  }
  validateMultiLanguageText(field.label, `${path}.label`, errors);
  if (field.description !== undefined) {
    validateMultiLanguageText(field.description, `${path}.description`, errors);
  }
  if (field.placeholder !== undefined) {
    if (!PLACEHOLDER_FIELD_TYPES.includes(field.type)) {
      errors.push(`${path}.placeholder: only allowed on ${PLACEHOLDER_FIELD_TYPES.join(', ')} fields`);
    } else {
      validateMultiLanguageText(field.placeholder, `${path}.placeholder`, errors);
    }
  }
  if (field.required !== undefined && typeof field.required !== 'boolean') {
    errors.push(`${path}.required: must be a boolean`);
  }
  validateConfigFieldDefault(field, path, errors);
  if (field.type === 'number') {
    if (field.min !== undefined && typeof field.min !== 'number') {
      errors.push(`${path}.min: must be a number`);
    }
    if (field.max !== undefined && typeof field.max !== 'number') {
      errors.push(`${path}.max: must be a number`);
    }
    if (typeof field.min === 'number' && typeof field.max === 'number' && field.min > field.max) {
      errors.push(`${path}.min: must be lower than or equal to max`);
    }
  } else if (field.min !== undefined || field.max !== undefined) {
    errors.push(`${path}.min: only allowed on number fields`);
  }
  if (field.type === 'select') {
    if (!Array.isArray(field.options) || field.options.length === 0) {
      errors.push(`${path}.options: select fields must have a non-empty options list`);
    } else {
      field.options.forEach((option, optionIndex) => {
        if (option === null || typeof option !== 'object' || Array.isArray(option)) {
          errors.push(`${path}.options[${optionIndex}]: must be an object`);
          return;
        }
        Object.keys(option).forEach((key) => {
          if (!OPTION_FIELDS.includes(key)) {
            errors.push(`${path}.options[${optionIndex}].${key}: unknown field`);
          }
        });
        if (typeof option.value !== 'string' || option.value.length === 0) {
          errors.push(`${path}.options[${optionIndex}].value: must be a non-empty string`);
        }
        validateMultiLanguageText(option.label, `${path}.options[${optionIndex}].label`, errors);
      });
    }
  } else if (field.options !== undefined) {
    errors.push(`${path}.options: only allowed on select fields`);
  }
}

/**
 * @description Validate an external integration manifest against the vendored
 * manifest schema rules (exact same rules as the store indexer, see
 * manifest.schema.json). Throws an Error422 listing every problem if the
 * manifest is invalid.
 * @param {object} manifest - The manifest to validate.
 * @returns {object} The validated manifest.
 * @example
 * gladys.externalIntegration.validateManifest(manifest);
 */
function validateManifest(manifest) {
  const errors = [];
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error422('manifest: must be an object');
  }
  if (!Number.isInteger(manifest.manifest_version)) {
    errors.push('manifest_version: must be an integer');
  } else if (manifest.manifest_version > SUPPORTED_MANIFEST_VERSION) {
    errors.push(
      `manifest_version: version ${manifest.manifest_version} is not supported by this Gladys (max: ${SUPPORTED_MANIFEST_VERSION})`,
    );
  } else if (manifest.manifest_version < 1) {
    errors.push('manifest_version: must be >= 1');
  }
  Object.keys(manifest).forEach((key) => {
    if (!MANIFEST_FIELDS.includes(key)) {
      errors.push(`${key}: unknown field`);
    }
  });
  if (!MANIFEST_TYPES.includes(manifest.type)) {
    errors.push(`type: must be one of ${MANIFEST_TYPES.join(', ')}`);
  }
  if (typeof manifest.name !== 'string' || manifest.name.length < 3 || manifest.name.length > 30) {
    errors.push('name: must be a string of 3-30 characters');
  }
  validateMultiLanguageText(manifest.description, 'description', errors, 10, 100);
  if (typeof manifest.version !== 'string' || semver.valid(manifest.version) !== manifest.version) {
    errors.push('version: must be valid semver');
  }
  if (!isValidDockerImageReference(manifest.docker_image)) {
    errors.push('docker_image: must be a valid image reference with an explicit tag or digest');
  }
  if (typeof manifest.gladys_version !== 'string' || semver.validRange(manifest.gladys_version) === null) {
    errors.push('gladys_version: must be a valid semver range');
  }
  if (manifest.cover_image !== undefined) {
    if (typeof manifest.cover_image !== 'string' || !manifest.cover_image.startsWith('https://')) {
      errors.push('cover_image: must be an https URL');
    }
  }
  if (manifest.config_schema !== undefined) {
    if (!Array.isArray(manifest.config_schema)) {
      errors.push('config_schema: must be an array');
    } else {
      const seenKeys = new Set();
      manifest.config_schema.forEach((field, index) => validateConfigField(field, index, seenKeys, errors));
    }
  }
  if (errors.length > 0) {
    throw new Error422(errors.join(' ; '));
  }
  return manifest;
}

module.exports = {
  validateManifest,
};
