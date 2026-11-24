import { Text } from 'preact-i18n';

// what the alert says, without its frame: the phone sheet shows it in a notice of the kit
const MatterDeviceSaveErrorContent = ({ errorMessage, errorDetail, isKnownError = true }) => (
  <div>
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

const MatterDeviceSaveErrorAlert = ({ errorMessage, errorDetail, isKnownError = true }) => {
  if (!errorMessage) {
    return null;
  }

  return (
    <div class="alert alert-danger">
      <MatterDeviceSaveErrorContent errorMessage={errorMessage} errorDetail={errorDetail} isKnownError={isKnownError} />
    </div>
  );
};

export { MatterDeviceSaveErrorContent };
export default MatterDeviceSaveErrorAlert;
