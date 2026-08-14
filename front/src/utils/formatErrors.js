import get from 'get-value';

const safeJsonStringify = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
};

const serializeApiResponseBody = (data) => {
  if (!data) {
    return null;
  }
  if (typeof data === 'string') {
    return data;
  }
  return safeJsonStringify(data);
};

const formatConflictErrorObject = (error) => {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object') {
    const parts = [];
    if (error.message) {
      parts.push(error.message);
    }
    if (error.attribute) {
      parts.push(`${error.attribute}${error.value !== undefined && error.value !== null ? `: ${error.value}` : ''}`);
    }
    return parts.join(' — ') || safeJsonStringify(error);
  }
  return String(error);
};

const formatValidationProperties = (properties) => {
  if (!Array.isArray(properties)) {
    return null;
  }
  return properties
    .map((property) => {
      if (typeof property === 'string') {
        return property;
      }
      return property.message || safeJsonStringify(property);
    })
    .join('; ');
};

const formatApiErrorDetail = (error) => {
  const data = get(error, 'response.data');
  if (!data) {
    return get(error, 'message') || null;
  }

  if (typeof data.message === 'string' && data.message) {
    const conflictDetail = formatConflictErrorObject(data.error);
    if (conflictDetail && !data.message.includes(conflictDetail)) {
      return `${data.message} — ${conflictDetail}`;
    }
    return data.message;
  }

  const conflictDetail = formatConflictErrorObject(data.error);
  if (conflictDetail) {
    return conflictDetail;
  }

  return formatValidationProperties(data.properties);
};

const getUnknownErrorDetail = (error) => {
  const data = get(error, 'response.data');
  const serialized = serializeApiResponseBody(data);
  if (serialized) {
    return serialized;
  }
  const detail = formatApiErrorDetail(error);
  if (detail) {
    return detail;
  }
  if (error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return safeJsonStringify(error);
};

const getMatterDeviceSaveError = (error) => {
  const status = get(error, 'response.status');
  const data = get(error, 'response.data');
  const conflictAttribute = get(data, 'error.attribute');

  if (status === 409) {
    let errorMessage = 'integration.matter.error.conflictError';
    if (conflictAttribute === 'selector') {
      errorMessage = 'integration.matter.error.selectorConflictError';
    } else if (conflictAttribute === 'external_id') {
      errorMessage = 'integration.matter.error.externalIdConflictError';
    }
    return {
      errorMessage,
      errorDetail: formatApiErrorDetail(error),
      isKnownError: true,
    };
  }

  if (status === 400) {
    return {
      errorMessage: 'integration.matter.error.badRequestError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true,
    };
  }

  if (status === 422) {
    return {
      errorMessage: 'integration.matter.error.validationError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true,
    };
  }

  if (status === 403 || status === 401) {
    return {
      errorMessage: 'integration.matter.error.forbiddenError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true,
    };
  }

  if (status === 404) {
    return {
      errorMessage: 'integration.matter.error.notFoundError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true,
    };
  }

  return {
    errorMessage: 'integration.matter.error.unexpectedError',
    errorDetail: getUnknownErrorDetail(error),
    isKnownError: false,
  };
};

const DISCOVERED_DEVICE_ERROR_PREFIX = 'integration.externalIntegration.discover.error';

// Sequelize validation types we are able to explain in plain words. Anything
// else falls back to the raw message returned by the API.
const VALIDATION_TYPE_KEYS = {
  'notNull Violation': 'notNullViolation',
  'unique violation': 'uniqueViolation',
};

const toValidationError = (property) => {
  if (!property || typeof property !== 'object' || !property.attribute) {
    return null;
  }
  // the API tags the offending entity ({ type: 'device_feature', name })
  // when the rejected field belongs to a feature and not to the device itself.
  // The wording is ours: the API only names the entity, never the sentence.
  const context = property.context && property.context.name ? property.context : null;
  return {
    attribute: property.attribute,
    message: property.message || null,
    context,
    typeKey: VALIDATION_TYPE_KEYS[property.type] || null,
  };
};

// Turn the API payload into the list of precisely rejected fields, so the UI
// can tell WHICH field of WHICH feature was refused instead of "an error occurred".
const extractValidationErrors = (data) => {
  const { properties, error } = data || {};
  if (Array.isArray(properties)) {
    return properties.map(toValidationError).filter(Boolean);
  }
  const conflictError = toValidationError(error);
  return conflictError ? [conflictError] : [];
};

const MAX_TECHNICAL_DETAIL_LENGTH = 1000;

// Compact one-liner meant to be copy-pasted in a bug report.
const buildTechnicalDetail = (error) => {
  const status = get(error, 'response.status');
  const data = get(error, 'response.data');
  const parts = [];
  if (status) {
    parts.push(`HTTP ${status}`);
  }
  const code = get(data, 'code');
  if (code) {
    parts.push(code);
  }
  const detail = formatApiErrorDetail(error);
  if (detail) {
    parts.push(detail);
  }
  const technicalDetail = parts.join(' — ');
  if (technicalDetail.length > MAX_TECHNICAL_DETAIL_LENGTH) {
    return `${technicalDetail.slice(0, MAX_TECHNICAL_DETAIL_LENGTH)}…`;
  }
  return technicalDetail || null;
};

/**
 * @description Build a precise error message for the "Discovered devices" screen
 * of an external integration.
 * @param {object} error - The error thrown by the HTTP client.
 * @returns {object} An object with the i18n key, the technical detail and the rejected fields.
 * @example
 * const { errorMessage, errorDetail } = getDiscoveredDeviceCreateError(e);
 */
const getDiscoveredDeviceCreateError = (error) => {
  const status = get(error, 'response.status');
  const data = get(error, 'response.data');

  if (!status) {
    // axios sets `request` as soon as the call left the browser: no status and
    // a request means the answer never came back (server down, network cut,
    // timeout). Without it, the rejection is a client-side exception, which
    // would be a lie to report as a network problem.
    if (get(error, 'request')) {
      return {
        errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.networkError`,
        errorDetail: get(error, 'message') || null,
        validationErrors: [],
        isKnownError: true,
      };
    }
    return {
      errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.unexpectedError`,
      errorDetail: getUnknownErrorDetail(error),
      validationErrors: [],
      isKnownError: false,
    };
  }

  const validationErrors = extractValidationErrors(data);
  const errorDetail = buildTechnicalDetail(error);

  if (status === 409) {
    const attribute = get(data, 'error.attribute');
    let errorMessage = `${DISCOVERED_DEVICE_ERROR_PREFIX}.conflictError`;
    if (attribute === 'external_id') {
      errorMessage = `${DISCOVERED_DEVICE_ERROR_PREFIX}.externalIdConflictError`;
    } else if (attribute === 'selector') {
      errorMessage = `${DISCOVERED_DEVICE_ERROR_PREFIX}.selectorConflictError`;
    }
    return { errorMessage, errorDetail, validationErrors, isKnownError: true };
  }

  if (status === 422) {
    return {
      errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.validationError`,
      errorDetail,
      validationErrors,
      isKnownError: true,
    };
  }

  if (status === 400) {
    return {
      errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.badRequestError`,
      errorDetail,
      validationErrors,
      isKnownError: true,
    };
  }

  if (status === 401 || status === 403) {
    return {
      errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.forbiddenError`,
      errorDetail,
      validationErrors,
      isKnownError: true,
    };
  }

  if (status === 404) {
    return {
      errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.notFoundError`,
      errorDetail,
      validationErrors,
      isKnownError: true,
    };
  }

  if (status >= 500) {
    return {
      errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.serverError`,
      errorDetail: errorDetail || getUnknownErrorDetail(error),
      validationErrors,
      isKnownError: true,
    };
  }

  return {
    errorMessage: `${DISCOVERED_DEVICE_ERROR_PREFIX}.unexpectedError`,
    errorDetail: getUnknownErrorDetail(error),
    validationErrors,
    isKnownError: false,
  };
};

const formatHttpError = (error) => {
  const errorString = error.toString();
  let errorDetailString = '';
  // If it's a standard Gladys HTTP error
  if (error.response && error.response.data) {
    const responseData = error.response.data;
    if (responseData.code) {
      errorDetailString += responseData.code;
    }
    if (responseData.message) {
      errorDetailString += ': ';
      errorDetailString += responseData.message;
    }
    if (responseData.error && Object.keys(responseData.error).length > 0) {
      errorDetailString += ': ';
      errorDetailString += safeJsonStringify(responseData.error);
    }
  }
  return { errorString, errorDetailString };
};

export { formatHttpError, formatApiErrorDetail, getMatterDeviceSaveError, getDiscoveredDeviceCreateError };
