import { Text } from 'preact-i18n';
import cx from 'classnames';

import { ConfigField } from './ConfigSchemaForm';
import { getLocalizedText } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';

// On-demand actions declared in the manifest (connection test, protocol
// detection, re-pairing...): a button per action, an optional mini form
// rendered by the same engine as the config_schema, and the result
// message of the integration shown under the button.
const ActionsCard = ({
  actions,
  language,
  actionStates,
  actionFieldValues,
  updateActionFieldValue,
  runAction,
  dynamicOptions
}) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.externalIntegration.actions.title" />
      </h3>
    </div>
    <div class="card-body">
      {actions.map((action, index) => {
        const actionState = actionStates[action.key] || {};
        const running = actionState.status === RequestStatus.Getting;
        const description = getLocalizedText(action.description, language);
        return (
          <div class={cx({ 'mb-5': index < actions.length - 1 })}>
            <h4>{getLocalizedText(action.label, language) || action.key}</h4>
            {description && <p class="text-muted small">{description}</p>}
            {(action.fields || []).map(field => (
              <ConfigField
                key={field.key}
                field={field}
                language={language}
                values={actionFieldValues[action.key] || {}}
                configuredSecrets={[]}
                touchedSecrets={{}}
                updateConfigValue={(updatedField, value) => updateActionFieldValue(action.key, updatedField, value)}
                dynamicOptions={dynamicOptions}
              />
            ))}
            <button
              type="button"
              class={cx('btn btn-primary', {
                'btn-loading': running
              })}
              disabled={running}
              onClick={() => runAction(action)}
            >
              <i class="fe fe-play mr-1" />
              <Text id="integration.externalIntegration.actions.runButton" />
            </button>
            {actionState.status === RequestStatus.Success && actionState.message && (
              <div class="alert alert-success mt-3 mb-0">{getLocalizedText(actionState.message, language)}</div>
            )}
            {actionState.status === RequestStatus.Error && (
              <div class="alert alert-danger mt-3 mb-0">
                {getLocalizedText(actionState.message, language) || (
                  <Text id="integration.externalIntegration.actions.error" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default ActionsCard;
