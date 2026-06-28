import get from 'get-value';

const safeJsonStringify = value => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
};

const serializeApiResponseBody = data => {
  if (!data) {
    return null;
  }
  if (typeof data === 'string') {
    return data;
  }
  return safeJsonStringify(data);
};

const formatConflictErrorObject = error => {
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

const formatValidationProperties = properties => {
  if (!Array.isArray(properties)) {
    return null;
  }
  return properties
    .map(property => {
      if (typeof property === 'string') {
        return property;
      }
      return property.message || safeJsonStringify(property);
    })
    .join('; ');
};

const formatApiErrorDetail = error => {
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

const getUnknownErrorDetail = error => {
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

const getMatterDeviceSaveError = error => {
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
      isKnownError: true
    };
  }

  if (status === 400) {
    return {
      errorMessage: 'integration.matter.error.badRequestError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true
    };
  }

  if (status === 422) {
    return {
      errorMessage: 'integration.matter.error.validationError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true
    };
  }

  if (status === 403 || status === 401) {
    return {
      errorMessage: 'integration.matter.error.forbiddenError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true
    };
  }

  if (status === 404) {
    return {
      errorMessage: 'integration.matter.error.notFoundError',
      errorDetail: formatApiErrorDetail(error) || serializeApiResponseBody(data),
      isKnownError: true
    };
  }

  return {
    errorMessage: 'integration.matter.error.unexpectedError',
    errorDetail: getUnknownErrorDetail(error),
    isKnownError: false
  };
};

const formatHttpError = error => {
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

export { formatHttpError, formatApiErrorDetail, getMatterDeviceSaveError };
