import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { ConfigField } from './ConfigSchemaForm';
import { getLocalizedText } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';
import integrationText from '../integrationText.css';

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
  dynamicOptions,
  placeholderPorts,
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
            {description && <p class={cx('text-muted small', integrationText.integrationText)}>{description}</p>}
            {(action.fields || []).map((field) => (
              <ConfigField
                key={field.key}
                field={field}
                language={language}
                values={actionFieldValues[action.key] || {}}
                configuredSecrets={[]}
                touchedSecrets={{}}
                updateConfigValue={(updatedField, value) => updateActionFieldValue(action.key, updatedField, value)}
                dynamicOptions={dynamicOptions}
                placeholderPorts={placeholderPorts}
              />
            ))}
            <button
              type="button"
              class={cx('btn btn-primary', {
                'btn-loading': running,
              })}
              disabled={running}
              onClick={() => runAction(action)}
            >
              <i class="fe fe-play mr-1" />
              <Text id="integration.externalIntegration.actions.runButton" />
            </button>
            {/* the result is a scroll container (its length is whatever the
                integration decided to return): tabIndex makes it focusable,
                without which a keyboard-only user cannot scroll a long one,
                and the named region gives that tab stop something to announce
                — the message itself is the integration's, untranslatable here */}
            {actionState.status === RequestStatus.Success && actionState.message && (
              <Localizer>
                <div
                  class={cx(
                    'alert alert-success mt-3 mb-0',
                    integrationText.integrationText,
                    integrationText.resultScroll,
                  )}
                  tabIndex={0}
                  role="region"
                  aria-label={<Text id="integration.externalIntegration.actions.resultRegionLabel" />}
                >
                  {getLocalizedText(actionState.message, language)}
                </div>
              </Localizer>
            )}
            {actionState.status === RequestStatus.Error && (
              <Localizer>
                <div
                  class={cx(
                    'alert alert-danger mt-3 mb-0',
                    integrationText.integrationText,
                    integrationText.resultScroll,
                  )}
                  tabIndex={0}
                  role="region"
                  aria-label={<Text id="integration.externalIntegration.actions.resultRegionLabel" />}
                >
                  {getLocalizedText(actionState.message, language) || (
                    <Text id="integration.externalIntegration.actions.error" />
                  )}
                </div>
              </Localizer>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default ActionsCard;
