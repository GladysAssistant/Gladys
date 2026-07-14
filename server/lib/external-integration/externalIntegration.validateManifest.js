const semver = require('semver');

const { Error422 } = require('../../utils/httpErrors');
const { SUPPORTED_MANIFEST_VERSION } = require('./constants');

const MANIFEST_TYPES = ['device'];
const CONFIG_FIELD_TYPES = ['string', 'number', 'boolean', 'select', 'secret'];
const LANGUAGE_KEY_REGEX = /^[a-z]{2}$/;
const CONFIG_KEY_REGEX = /^[a-z0-9_]+$/;
// host[:port]/path/name[:tag|@sha256:digest], all lowercase except tag
const DOCKER_IMAGE_REGEX = /^(?:[a-z0-9]+(?:[.-][a-z0-9]+)*(?::[0-9]+)?\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[a-zA-Z0-9_][a-zA-Z0-9._-]{0,127}|@sha256:[a-f0-9]{64})?$/;

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
  if (field.required !== undefined && typeof field.required !== 'boolean') {
    errors.push(`${path}.required: must be a boolean`);
  }
  if (field.min !== undefined && typeof field.min !== 'number') {
    errors.push(`${path}.min: must be a number`);
  }
  if (field.max !== undefined && typeof field.max !== 'number') {
    errors.push(`${path}.max: must be a number`);
  }
  if (field.type === 'select') {
    if (!Array.isArray(field.options) || field.options.length === 0) {
      errors.push(`${path}.options: select fields must have a non-empty options list`);
    } else {
      field.options.forEach((option, optionIndex) => {
        if (option === null || typeof option !== 'object' || typeof option.value !== 'string') {
          errors.push(`${path}.options[${optionIndex}].value: must be a string`);
        } else {
          validateMultiLanguageText(option.label, `${path}.options[${optionIndex}].label`, errors);
        }
      });
    }
  }
}

/**
 * @description Validate an external integration manifest against the vendored
 * manifest schema rules (same rules as the store indexer, see manifest.schema.json).
 * Throws an Error422 listing every problem if the manifest is invalid.
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
  if (!MANIFEST_TYPES.includes(manifest.type)) {
    errors.push(`type: must be one of ${MANIFEST_TYPES.join(', ')}`);
  }
  if (typeof manifest.name !== 'string' || manifest.name.length < 3 || manifest.name.length > 30) {
    errors.push('name: must be a string of 3-30 characters');
  }
  validateMultiLanguageText(manifest.description, 'description', errors, 10, 100);
  if (typeof manifest.version !== 'string' || semver.valid(manifest.version) === null) {
    errors.push('version: must be valid semver');
  }
  if (typeof manifest.docker_image !== 'string' || !DOCKER_IMAGE_REGEX.test(manifest.docker_image)) {
    errors.push('docker_image: must be a valid image reference');
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
