import { Text } from 'preact-i18n';

const MatterDeviceSaveErrorAlert = ({ errorMessage, errorDetail, isKnownError = true }) => {
  if (!errorMessage) {
    return null;
  }

  return (
    <div class="alert alert-danger">
      <Text id={errorMessage} />
      {errorDetail && (
        <div class="mt-2">
          <Text
            id={isKnownError ? 'integration.matter.error.technicalDetail' : 'integration.matter.error.apiFullResponse'}
          />
          {isKnownError ? (
            <div>
              <code>{errorDetail}</code>
            </div>
          ) : (
            <pre class="mb-0 mt-1 small text-wrap">{errorDetail}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default MatterDeviceSaveErrorAlert;
