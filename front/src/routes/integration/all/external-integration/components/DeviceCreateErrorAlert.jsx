import { Text } from 'preact-i18n';

const PREFIX = 'integration.externalIntegration.discover.error';

const DeviceCreateErrorAlert = ({ errorMessage, errorDetail, validationErrors, isKnownError = true }) => {
  if (!errorMessage) {
    return null;
  }

  const hasValidationErrors = validationErrors && validationErrors.length > 0;

  return (
    <div class="alert alert-danger" role="alert">
      <Text id={errorMessage} />
      {hasValidationErrors && (
        <div class="mt-2">
          <Text id={`${PREFIX}.rejectedFieldsTitle`} />
          <ul class="mt-1 mb-0">
            {/* the index keeps the key unique: two features sharing a name can
                have the very same field rejected for the very same reason */}
            {validationErrors.map((validationError, index) => (
              <li
                key={`${index}-${validationError.context ? validationError.context.name : ''}-${
                  validationError.attribute
                }`}
              >
                {validationError.context && (
                  <span>
                    <Text
                      id={`${PREFIX}.contextTypes.${validationError.context.type}`}
                      fields={{ name: validationError.context.name }}
                    >
                      {validationError.context.name}
                    </Text>
                    {' — '}
                  </span>
                )}
                <strong>
                  <Text id={`${PREFIX}.fieldLabels.${validationError.attribute}`}>{validationError.attribute}</Text>
                </strong>
                {' : '}
                {validationError.typeKey ? (
                  <Text id={`${PREFIX}.fieldErrorTypes.${validationError.typeKey}`}>{validationError.message}</Text>
                ) : (
                  validationError.message
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {errorDetail && (
        <div class="mt-2">
          <Text id={isKnownError ? `${PREFIX}.technicalDetail` : `${PREFIX}.apiFullResponse`} />
          <pre class="mt-1 mb-0 small text-wrap">{errorDetail}</pre>
          <div class="small">
            <Text id={`${PREFIX}.reportHint`} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceCreateErrorAlert;
