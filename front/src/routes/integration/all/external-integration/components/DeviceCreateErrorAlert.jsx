import { Text } from 'preact-i18n';

const PREFIX = 'integration.externalIntegration.discover.error';

// what the alert says, without its frame: the phone sheet shows it in a notice of the kit
const DeviceCreateErrorContent = ({ errorMessage, errorDetail, validationErrors, isKnownError = true }) => {
  const hasValidationErrors = validationErrors && validationErrors.length > 0;

  return (
    <div>
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

const DeviceCreateErrorAlert = ({ errorMessage, errorDetail, validationErrors, isKnownError = true }) => {
  if (!errorMessage) {
    return null;
  }

  return (
    <div class="alert alert-danger" role="alert">
      <DeviceCreateErrorContent
        errorMessage={errorMessage}
        errorDetail={errorDetail}
        validationErrors={validationErrors}
        isKnownError={isKnownError}
      />
    </div>
  );
};

export { DeviceCreateErrorContent };
export default DeviceCreateErrorAlert;
