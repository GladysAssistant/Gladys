const semver = require('semver');

const { Error422 } = require('../../utils/httpErrors');
const {
  SUPPORTED_MANIFEST_VERSION,
  MAX_SUB_CONTAINERS,
  MAX_SUB_CONTAINER_VOLUMES,
  MAX_SUB_CONTAINER_PORTS,
  SUB_CONTAINER_NAME_REGEX,
  SUB_CONTAINER_MEMORY_MIN_MB,
  SUB_CONTAINER_MEMORY_MAX_MB,
  SUB_CONTAINER_CPU_MIN,
  SUB_CONTAINER_CPU_MAX,
  SUB_CONTAINER_SHM_MIN_MB,
  SUB_CONTAINER_SHM_MAX_MB,
  SUB_CONTAINER_START_MODES,
  HARDWARE_CLASSES,
  NETWORK_DISCOVERY_TYPES,
  MAX_NETWORK_DISCOVERY_ENTRIES,
  MAX_UDP_BROADCAST_PORTS,
  MAX_ACTIONS,
  ACTION_MIN_TIMEOUT_SECONDS,
  ACTION_MAX_TIMEOUT_SECONDS,
  MANIFEST_TRANSPORTS,
} = require('./constants');

// These rules are the exact mirror of the canonical manifest schema owned by
// GladysAssistant/integration-store (vendored copy in manifest.schema.json):
// a manifest accepted by the indexer must always install here, and vice versa.
const MANIFEST_TYPES = ['device', 'communication'];
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
  'containers',
  'network_discovery',
  'actions',
  'transports',
];
const SUB_CONTAINER_FIELDS = [
  'name',
  'docker_image',
  'start',
  'env',
  'volumes',
  'ports',
  'devices',
  'read_only',
  'memory_mb',
  'cpu',
  'shm_mb',
  'command',
];
const PORT_FIELDS = ['container_port', 'protocol', 'label'];
const PORT_PROTOCOLS = ['tcp', 'udp'];
const ACTION_FIELDS = ['key', 'label', 'description', 'timeout_seconds', 'fields'];
// per capture type: the required specific field + its rules. The entries
// are an authorization contract (same philosophy as hardware requests):
// shown on the install screen, no arbitrary capture ever.
const NETWORK_DISCOVERY_FIELDS = {
  'udp-broadcast': ['type', 'ports'],
  'udp-active-broadcast': ['type', 'ports'],
  mdns: ['type', 'service'],
  ssdp: ['type', 'st'],
};
// standard DNS-SD service type, e.g. _hue._tcp
const MDNS_SERVICE_REGEX = /^_[a-z0-9-]+\._(tcp|udp)$/;
const SSDP_ST_MAX_LENGTH = 200;
const CONFIG_FIELD_TYPES = ['string', 'number', 'boolean', 'select', 'multi_select', 'secret', 'oauth2'];
const OPTION_FIELD_TYPES = ['select', 'multi_select'];
const SELECT_DISPLAYS = ['dropdown', 'radio'];
// Dynamic options of a select/multi_select: a reserved enum defined by the
// core — never a URL nor an expression, nothing arbitrary enters the
// rendering. "devices": the UI populates the options with the
// already-created devices of the integration (value = external_id).
const SELECT_SOURCES = ['devices'];
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
  'source',
  'display',
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
  if (field.source !== undefined && OPTION_FIELD_TYPES.includes(field.type)) {
    // the dynamic values are unknown at validation time
    errors.push(`${path}.default: not allowed with a dynamic source`);
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
    case 'multi_select': {
      const validValues = (Array.isArray(field.options) ? field.options : []).map((option) => option.value);
      if (!Array.isArray(field.default) || !field.default.every((value) => validValues.includes(value))) {
        errors.push(`${path}.default: must be an array of the multi_select option values`);
      }
      break;
    }
    default:
      // secret: it would end up published in the store ;
      // oauth2: the value is the Connect flow, tokens live off-schema
      errors.push(`${path}.default: not allowed for ${field.type} fields`);
  }
}

/**
 * @description Validate one entry of the config_schema flat list.
 * @param {object} field - The field to validate.
 * @param {number} index - Index of the field in the list.
 * @param {Set} seenKeys - Keys already seen, to detect duplicates.
 * @param {Array} errors - The array of errors to push to.
 * @param {string} [basePath] - Path prefix for error messages (the action
 * mini forms reuse the same format under another path).
 * @example
 * validateConfigField({ key: 'latitude', type: 'number', label: { en: 'Latitude' } }, 0, seenKeys, errors);
 */
function validateConfigField(field, index, seenKeys, errors, basePath = 'config_schema') {
  const path = `${basePath}[${index}]`;
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
  if (field.display !== undefined) {
    if (field.type !== 'select') {
      errors.push(`${path}.display: only allowed on select fields`);
    } else if (!SELECT_DISPLAYS.includes(field.display)) {
      errors.push(`${path}.display: must be one of ${SELECT_DISPLAYS.join(', ')}`);
    }
  }
  if (field.source !== undefined) {
    if (!OPTION_FIELD_TYPES.includes(field.type)) {
      errors.push(`${path}.source: only allowed on select and multi_select fields`);
    } else if (!SELECT_SOURCES.includes(field.source)) {
      errors.push(`${path}.source: must be one of ${SELECT_SOURCES.join(', ')}`);
    }
    if (field.options !== undefined) {
      errors.push(`${path}.options: mutually exclusive with source`);
    }
  } else if (OPTION_FIELD_TYPES.includes(field.type)) {
    if (!Array.isArray(field.options) || field.options.length === 0) {
      errors.push(`${path}.options: ${field.type} fields must have a non-empty options list`);
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
    errors.push(`${path}.options: only allowed on select and multi_select fields`);
  }
}

/**
 * @description Validate one entry of the manifest actions list: an
 * on-demand operation rendered as a button in the Configuration screen,
 * with an optional flat form reusing the config_schema field format and a
 * per-action ack timeout (these operations can be long).
 * @param {object} action - The action to validate.
 * @param {number} index - Index of the action in the list.
 * @param {Set} seenKeys - Action keys already seen, to detect duplicates.
 * @param {Array} errors - The array of errors to push to.
 * @example
 * validateAction({ key: 'detect_protocol', label: { en: 'Detect' } }, 0, seenKeys, errors);
 */
function validateAction(action, index, seenKeys, errors) {
  const path = `actions[${index}]`;
  if (action === null || typeof action !== 'object' || Array.isArray(action)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  Object.keys(action).forEach((key) => {
    if (!ACTION_FIELDS.includes(key)) {
      errors.push(`${path}.${key}: unknown field`);
    }
  });
  if (typeof action.key !== 'string' || !CONFIG_KEY_REGEX.test(action.key)) {
    errors.push(`${path}.key: must be a non-empty string matching [a-z0-9_]`);
  } else if (seenKeys.has(action.key)) {
    errors.push(`${path}.key: duplicate key "${action.key}"`);
  } else {
    seenKeys.add(action.key);
  }
  validateMultiLanguageText(action.label, `${path}.label`, errors);
  if (action.description !== undefined) {
    validateMultiLanguageText(action.description, `${path}.description`, errors);
  }
  if (action.timeout_seconds !== undefined) {
    if (
      !Number.isInteger(action.timeout_seconds) ||
      action.timeout_seconds < ACTION_MIN_TIMEOUT_SECONDS ||
      action.timeout_seconds > ACTION_MAX_TIMEOUT_SECONDS
    ) {
      errors.push(
        `${path}.timeout_seconds: must be an integer between ${ACTION_MIN_TIMEOUT_SECONDS} and ${ACTION_MAX_TIMEOUT_SECONDS}`,
      );
    }
  }
  if (action.fields !== undefined) {
    if (!Array.isArray(action.fields)) {
      errors.push(`${path}.fields: must be an array`);
    } else {
      // same format and rules as the config_schema (the mini form is
      // rendered by the same engine); keys unique within the action
      const seenFieldKeys = new Set();
      action.fields.forEach((field, fieldIndex) => {
        validateConfigField(field, fieldIndex, seenFieldKeys, errors, `${path}.fields`);
      });
    }
  }
}

/**
 * @description Validate one entry of the network_discovery capture list.
 * @param {object} entry - The capture request to validate.
 * @param {number} index - Index of the entry in the list.
 * @param {Array} errors - The array of errors to push to.
 * @example
 * validateNetworkDiscoveryEntry({ type: 'udp-broadcast', ports: [6666] }, 0, errors);
 */
function validateNetworkDiscoveryEntry(entry, index, errors) {
  const path = `network_discovery[${index}]`;
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (!NETWORK_DISCOVERY_TYPES.includes(entry.type)) {
    errors.push(`${path}.type: must be one of ${NETWORK_DISCOVERY_TYPES.join(', ')}`);
    return;
  }
  const allowedFields = NETWORK_DISCOVERY_FIELDS[entry.type];
  Object.keys(entry).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`${path}.${key}: unknown field for type ${entry.type}`);
    }
  });
  if (entry.type === 'udp-broadcast' || entry.type === 'udp-active-broadcast') {
    if (!Array.isArray(entry.ports) || entry.ports.length === 0 || entry.ports.length > MAX_UDP_BROADCAST_PORTS) {
      errors.push(`${path}.ports: must be a list of 1-${MAX_UDP_BROADCAST_PORTS} ports`);
    } else {
      const seenPorts = new Set();
      entry.ports.forEach((port, portIndex) => {
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          errors.push(`${path}.ports[${portIndex}]: must be an integer between 1 and 65535`);
        } else if (seenPorts.has(port)) {
          errors.push(`${path}.ports[${portIndex}]: duplicate port ${port}`);
        } else {
          seenPorts.add(port);
        }
      });
    }
  } else if (entry.type === 'mdns') {
    if (typeof entry.service !== 'string' || !MDNS_SERVICE_REGEX.test(entry.service)) {
      errors.push(`${path}.service: must be a DNS-SD service type (e.g. _hue._tcp)`);
    }
  } else if (typeof entry.st !== 'string' || entry.st.length === 0 || entry.st.length > SSDP_ST_MAX_LENGTH) {
    errors.push(`${path}.st: must be a string of 1-${SSDP_ST_MAX_LENGTH} characters`);
  }
}

/**
 * @description Validate one `ports` entry of a sub-container declaration.
 * The host port is never declared: it is chosen by Gladys (free, persisted).
 * @param {object} port - The port entry.
 * @param {string} path - The path of the entry, for error messages.
 * @param {Array} errors - The array of errors to push to.
 * @example
 * validateSubContainerPort({ container_port: 5000, label: { en: 'UI' } }, 'containers[0].ports[0]', errors);
 */
function validateSubContainerPort(port, path, errors) {
  if (port === null || typeof port !== 'object' || Array.isArray(port)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  Object.keys(port).forEach((key) => {
    if (!PORT_FIELDS.includes(key)) {
      errors.push(`${path}.${key}: unknown field`);
    }
  });
  if (!Number.isInteger(port.container_port) || port.container_port < 1 || port.container_port > 65535) {
    errors.push(`${path}.container_port: must be an integer between 1 and 65535`);
  }
  if (port.protocol !== undefined && !PORT_PROTOCOLS.includes(port.protocol)) {
    errors.push(`${path}.protocol: must be one of ${PORT_PROTOCOLS.join(', ')}`);
  }
  validateMultiLanguageText(port.label, `${path}.label`, errors);
}

/**
 * @description Validate one entry of the `containers` list: the
 * authorization contract of the sub-containers (everything shown on the
 * install screen; the /container API can only drive what is declared here).
 * @param {object} entry - The sub-container declaration.
 * @param {number} index - Index of the entry in the list.
 * @param {Set} seenNames - Names already seen, to detect duplicates.
 * @param {Array} errors - The array of errors to push to.
 * @example
 * validateSubContainer({ name: 'mqtt', docker_image: 'eclipse-mosquitto:2.0.18' }, 0, seenNames, errors);
 */
function validateSubContainer(entry, index, seenNames, errors) {
  const path = `containers[${index}]`;
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  Object.keys(entry).forEach((key) => {
    if (!SUB_CONTAINER_FIELDS.includes(key)) {
      errors.push(`${path}.${key}: unknown field`);
    }
  });
  if (typeof entry.name !== 'string' || !SUB_CONTAINER_NAME_REGEX.test(entry.name)) {
    errors.push(`${path}.name: must be a string matching [a-z0-9-]{2,20}`);
  } else if (seenNames.has(entry.name)) {
    errors.push(`${path}.name: duplicate name "${entry.name}"`);
  } else {
    seenNames.add(entry.name);
  }
  if (!isValidDockerImageReference(entry.docker_image)) {
    errors.push(`${path}.docker_image: must be a valid image reference with an explicit tag or digest`);
  }
  if (entry.start !== undefined && !SUB_CONTAINER_START_MODES.includes(entry.start)) {
    errors.push(`${path}.start: must be one of ${SUB_CONTAINER_START_MODES.join(', ')}`);
  }
  if (entry.env !== undefined) {
    if (entry.env === null || typeof entry.env !== 'object' || Array.isArray(entry.env)) {
      errors.push(`${path}.env: must be an object mapping keys to strings`);
    } else {
      Object.keys(entry.env).forEach((key) => {
        // the manifest is public: GLADYS_* is reserved (no token, no identity)
        if (key.toUpperCase().startsWith('GLADYS_')) {
          errors.push(`${path}.env.${key}: GLADYS_* keys are reserved`);
        }
        if (typeof entry.env[key] !== 'string') {
          errors.push(`${path}.env.${key}: must be a string`);
        }
      });
    }
  }
  if (entry.volumes !== undefined) {
    if (!Array.isArray(entry.volumes) || entry.volumes.length > MAX_SUB_CONTAINER_VOLUMES) {
      errors.push(`${path}.volumes: must be an array of at most ${MAX_SUB_CONTAINER_VOLUMES} container paths`);
    } else {
      entry.volumes.forEach((volume, volumeIndex) => {
        // the host path is derived from the volume path by the supervisor:
        // absolute, and no `..` segment that could escape the integration folder
        const hasTraversal = typeof volume === 'string' && volume.split('/').includes('..');
        if (typeof volume !== 'string' || !volume.startsWith('/') || hasTraversal) {
          errors.push(`${path}.volumes[${volumeIndex}]: must be an absolute container path without ..`);
        }
      });
    }
  }
  if (entry.ports !== undefined) {
    if (!Array.isArray(entry.ports) || entry.ports.length > MAX_SUB_CONTAINER_PORTS) {
      errors.push(`${path}.ports: must be an array of at most ${MAX_SUB_CONTAINER_PORTS} entries`);
    } else {
      entry.ports.forEach((port, portIndex) => validateSubContainerPort(port, `${path}.ports[${portIndex}]`, errors));
    }
  }
  if (entry.devices !== undefined) {
    if (!Array.isArray(entry.devices)) {
      errors.push(`${path}.devices: must be an array of hardware classes`);
    } else {
      const seenClasses = new Set();
      entry.devices.forEach((hardwareClass, classIndex) => {
        if (!Object.keys(HARDWARE_CLASSES).includes(hardwareClass)) {
          errors.push(`${path}.devices[${classIndex}]: must be one of ${Object.keys(HARDWARE_CLASSES).join(', ')}`);
        } else if (seenClasses.has(hardwareClass)) {
          errors.push(`${path}.devices[${classIndex}]: duplicate class "${hardwareClass}"`);
        } else {
          seenClasses.add(hardwareClass);
        }
      });
    }
  }
  if (entry.read_only !== undefined && typeof entry.read_only !== 'boolean') {
    errors.push(`${path}.read_only: must be a boolean`);
  }
  if (
    entry.memory_mb !== undefined &&
    (!Number.isInteger(entry.memory_mb) ||
      entry.memory_mb < SUB_CONTAINER_MEMORY_MIN_MB ||
      entry.memory_mb > SUB_CONTAINER_MEMORY_MAX_MB)
  ) {
    errors.push(
      `${path}.memory_mb: must be an integer between ${SUB_CONTAINER_MEMORY_MIN_MB} and ${SUB_CONTAINER_MEMORY_MAX_MB}`,
    );
  }
  if (
    entry.cpu !== undefined &&
    (typeof entry.cpu !== 'number' || entry.cpu < SUB_CONTAINER_CPU_MIN || entry.cpu > SUB_CONTAINER_CPU_MAX)
  ) {
    errors.push(`${path}.cpu: must be a number between ${SUB_CONTAINER_CPU_MIN} and ${SUB_CONTAINER_CPU_MAX}`);
  }
  if (
    entry.shm_mb !== undefined &&
    (!Number.isInteger(entry.shm_mb) ||
      entry.shm_mb < SUB_CONTAINER_SHM_MIN_MB ||
      entry.shm_mb > SUB_CONTAINER_SHM_MAX_MB)
  ) {
    errors.push(
      `${path}.shm_mb: must be an integer between ${SUB_CONTAINER_SHM_MIN_MB} and ${SUB_CONTAINER_SHM_MAX_MB}`,
    );
  }
  if (entry.command !== undefined) {
    if (!Array.isArray(entry.command) || entry.command.some((part) => typeof part !== 'string')) {
      errors.push(`${path}.command: must be an array of strings`);
    }
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
  if (manifest.containers !== undefined) {
    if (!Array.isArray(manifest.containers) || manifest.containers.length > MAX_SUB_CONTAINERS) {
      errors.push(`containers: must be an array of at most ${MAX_SUB_CONTAINERS} entries`);
    } else {
      const seenNames = new Set();
      manifest.containers.forEach((entry, index) => validateSubContainer(entry, index, seenNames, errors));
    }
  }
  if (manifest.network_discovery !== undefined) {
    if (
      !Array.isArray(manifest.network_discovery) ||
      manifest.network_discovery.length === 0 ||
      manifest.network_discovery.length > MAX_NETWORK_DISCOVERY_ENTRIES
    ) {
      errors.push(`network_discovery: must be a list of 1-${MAX_NETWORK_DISCOVERY_ENTRIES} capture requests`);
    } else {
      manifest.network_discovery.forEach((entry, index) => validateNetworkDiscoveryEntry(entry, index, errors));
    }
  }
  if (manifest.actions !== undefined) {
    if (!Array.isArray(manifest.actions) || manifest.actions.length === 0 || manifest.actions.length > MAX_ACTIONS) {
      errors.push(`actions: must be a list of 1-${MAX_ACTIONS} actions`);
    } else {
      const seenActionKeys = new Set();
      manifest.actions.forEach((action, index) => validateAction(action, index, seenActionKeys, errors));
    }
  }
  if (manifest.transports !== undefined) {
    if (
      !Array.isArray(manifest.transports) ||
      manifest.transports.length === 0 ||
      !manifest.transports.every((transport) => MANIFEST_TRANSPORTS.includes(transport)) ||
      new Set(manifest.transports).size !== manifest.transports.length
    ) {
      errors.push(`transports: must be a non-empty subset of ${MANIFEST_TRANSPORTS.join(', ')}`);
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
