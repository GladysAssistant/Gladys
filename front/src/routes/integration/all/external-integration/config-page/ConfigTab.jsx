import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import ConfigSchemaForm from './ConfigSchemaForm';
import SupervisionCard from './SupervisionCard';
import { RequestStatus } from '../../../../../utils/consts';

const ConfigTab = props => {
  const { integration, loadStatus, user } = props;
  const schema = get(integration, 'manifest.config_schema') || [];
  const language = (user && user.language) || 'en';

  return (
    <div>
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.externalIntegration.config.title" />
          </h1>
        </div>
        <div class="card-body">
          {loadStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="integration.externalIntegration.config.loadError" />
            </div>
          )}
          <div
            class={cx('dimmer', {
              active: loadStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {loadStatus === RequestStatus.Success && schema.length === 0 && (
                <div class="text-muted">
                  <Text id="integration.externalIntegration.config.noConfig" />
                </div>
              )}
              {schema.length > 0 && (
                <ConfigSchemaForm
                  schema={schema}
                  language={language}
                  values={props.configValues || {}}
                  configuredSecrets={props.configuredSecrets || []}
                  touchedSecrets={props.touchedSecrets || {}}
                  saveConfigStatus={props.saveConfigStatus}
                  updateConfigValue={props.updateConfigValue}
                  saveConfig={props.saveConfig}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {integration && (
        <SupervisionCard
          integration={integration}
          actionStatus={props.actionStatus}
          actionError={props.actionError}
          uninstallStatus={props.uninstallStatus}
          askingUninstall={props.askingUninstall}
          executeAction={props.executeAction}
          onAskUninstall={props.askUninstall}
          onCancelUninstall={props.cancelUninstall}
          onUninstall={props.uninstall}
        />
      )}
    </div>
  );
};

export default ConfigTab;
