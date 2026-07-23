import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import ConfigSchemaForm from './ConfigSchemaForm';
import ActionsCard from './ActionsCard';
import LinkAccountCard from './LinkAccountCard';
import WebhooksCard from './WebhooksCard';
import HardwareCard from './HardwareCard';
import { getRequestedHardwareClasses } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';

const ConfigTab = props => {
  const { integration, loadStatus, user } = props;
  const schema = get(integration, 'manifest.config_schema') || [];
  const actions = get(integration, 'manifest.actions') || [];
  const manifestWebhooks = get(integration, 'manifest.webhooks') || [];
  const transports = get(integration, 'manifest.transports') || [];
  const hasDualTransports = transports.includes('local') && transports.includes('cloud');
  const language = (user && user.language) || 'en';
  const isCommunication = get(integration, 'manifest.type') === 'communication';
  const requestedClasses = getRequestedHardwareClasses(get(integration, 'manifest.containers') || []);
  // permanent link to the mandatory re-hosted docs (store installs): it
  // is while configuring that the user needs them most (create the
  // vendor developer account, get credentials...)
  const docs = get(integration, 'docs') || {};
  const docsUrl = docs[language] || docs.en;

  return (
    <div>
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.externalIntegration.config.title" />
          </h1>
          {docsUrl && (
            <div class="card-options">
              <a href={docsUrl} target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm">
                <i class="fe fe-book-open mr-1" />
                <Text id="integration.externalIntegration.config.docsLink" />
              </a>
            </div>
          )}
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
              {hasDualTransports && loadStatus === RequestStatus.Success && (
                <div class="form-group">
                  <label class="custom-switch">
                    <input
                      type="checkbox"
                      class="custom-switch-input"
                      checked={get(props, 'configValues.GLADYS_PREFER_LOCAL') !== false}
                      onClick={props.togglePreferLocal}
                      disabled={props.preferLocalStatus === RequestStatus.Getting}
                    />
                    <span class="custom-switch-indicator" />
                    <span class="custom-switch-description">
                      <Text id="integration.externalIntegration.transport.preferLocalLabel" />
                    </span>
                  </label>
                  <small class="form-text text-muted">
                    <Text id="integration.externalIntegration.transport.preferLocalDescription" />
                  </small>
                  {props.preferLocalStatus === RequestStatus.Error && (
                    <div class="alert alert-danger mt-2">
                      <Text id="integration.externalIntegration.config.saveError" />
                    </div>
                  )}
                </div>
              )}
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
                  connectionStatus={get(integration, 'connection_status')}
                  oauthStatus={props.oauthStatus}
                  connectOAuth={props.connectOAuth}
                  dynamicOptions={props.dynamicOptions}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {isCommunication && (
        <LinkAccountCard
          contact={props.contact}
          linkCode={props.linkCode}
          linkStatus={props.linkStatus}
          onGenerateCode={props.generateLinkCode}
          onUnlink={props.unlinkContact}
        />
      )}

      {integration && manifestWebhooks.length > 0 && (
        <WebhooksCard
          manifestWebhooks={manifestWebhooks}
          webhooks={get(integration, 'webhooks')}
          gatewayStatus={props.gatewayStatus}
          keyConfigured={(props.configuredSecrets || []).includes('GLADYS_OPEN_API_KEY')}
          openApiKeyValue={props.openApiKeyValue}
          openApiKeyStatus={props.openApiKeyStatus}
          language={language}
          onOpenApiKeyInput={props.updateOpenApiKey}
          onSaveOpenApiKey={props.saveOpenApiKey}
        />
      )}

      {integration && actions.length > 0 && (
        <ActionsCard
          actions={actions}
          language={language}
          actionStates={props.actionStates || {}}
          actionFieldValues={props.actionFieldValues || {}}
          updateActionFieldValue={props.updateActionFieldValue}
          runAction={props.runAction}
          dynamicOptions={props.dynamicOptions}
        />
      )}

      {integration && requestedClasses.length > 0 && (
        <HardwareCard
          requestedClasses={requestedClasses}
          detectedClasses={props.detectedClasses || {}}
          grantedDevices={props.grantedDevices || []}
          hardwareStatus={props.hardwareStatus}
          onToggle={props.toggleHardwareClass}
          onSave={props.saveHardware}
        />
      )}
    </div>
  );
};

export default ConfigTab;
