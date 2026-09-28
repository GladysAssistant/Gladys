import { Text } from 'preact-i18n';

// The honest rendering of a card whose declaration cannot be resolved: the
// integration is no longer installed, or the installed version no longer
// declares the key (removed by an update). The stored values are shown
// read-only, the card stays deletable and the scene saves as-is — the stale
// trigger is inert, the stale action fails at execution — the user decides.
const formatStoredValue = value => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
};

const ExternalIntegrationDeclarationState = ({ integration, fields, kind }) => {
  const reasonId = integration
    ? `editScene.externalIntegration.${kind}NotDeclared`
    : `editScene.externalIntegration.${kind}NotInstalled`;
  const storedFields = fields || {};
  const storedKeys = Object.keys(storedFields);
  return (
    <div>
      <div class="alert alert-warning">
        <i class="fe fe-alert-triangle mr-1" />
        <Text id={reasonId} />
      </div>
      {storedKeys.length > 0 && (
        <table class="table table-sm mb-0">
          <tbody>
            {storedKeys.map(key => (
              <tr key={key}>
                <td class="text-muted">{key}</td>
                <td>{formatStoredValue(storedFields[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExternalIntegrationDeclarationState;
