import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { getLocalizedText } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';

// Standard core-rendered block (GLADYS_PREFER_LOCAL pattern) shown only
// when the manifest declares webhooks: the user creates their Open API key
// in Gladys Plus (Settings -> Open API) and pastes it here, stored as the
// reserved GLADYS_OPEN_API_KEY secret. Once available, the full webhook
// URLs built by the core are displayed — some providers require pasting
// them manually in the vendor console. The URL is the secret: it only
// exists when the key is set, and this screen is admin only.
const WebhooksCard = ({
  manifestWebhooks,
  webhooks,
  gatewayStatus,
  keyConfigured,
  openApiKeyValue,
  openApiKeyStatus,
  language,
  onOpenApiKeyInput,
  onSaveOpenApiKey
}) => {
  const gatewayConfigured = Boolean(gatewayStatus && gatewayStatus.configured);
  const available = Boolean(webhooks && webhooks.available);
  const urlByKey = {};
  ((webhooks && webhooks.webhooks) || []).forEach(webhook => {
    urlByKey[webhook.key] = webhook.url;
  });
  const saving = openApiKeyStatus === RequestStatus.Getting;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fe fe-cloud-lightning mr-1" />
          <Text id="integration.externalIntegration.webhooks.title" />
        </h3>
      </div>
      <div class="card-body">
        {!gatewayConfigured && (
          <div class="alert alert-info mb-0">
            <Text id="integration.externalIntegration.webhooks.plusRequiredText" />
          </div>
        )}
        {gatewayConfigured && (
          <div>
            <p class="text-muted small">
              <Text id="integration.externalIntegration.webhooks.explanationText" />
            </p>
            {openApiKeyStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.externalIntegration.webhooks.saveKeyError" />
              </div>
            )}
            <div class="form-group">
              <label class="form-label" for="gladys_open_api_key">
                <Text id="integration.externalIntegration.webhooks.openApiKeyLabel" />
              </label>
              <div class="row gutters-xs">
                <div class="col">
                  <Localizer>
                    <input
                      id="gladys_open_api_key"
                      type="password"
                      class="form-control"
                      autocomplete="new-password"
                      value={openApiKeyValue || ''}
                      placeholder={
                        keyConfigured ? (
                          <Text id="integration.externalIntegration.config.secretConfiguredPlaceholder" />
                        ) : (
                          <Text id="integration.externalIntegration.webhooks.openApiKeyPlaceholder" />
                        )
                      }
                      onInput={onOpenApiKeyInput}
                    />
                  </Localizer>
                </div>
                <span class="col-auto">
                  <button
                    type="button"
                    class={cx('btn btn-success', { 'btn-loading': saving })}
                    disabled={saving || !openApiKeyValue}
                    onClick={onSaveOpenApiKey}
                  >
                    <Text id="integration.externalIntegration.webhooks.saveKeyButton" />
                  </button>
                </span>
              </div>
            </div>
            {!available && (
              <p class="text-muted mb-0">
                <Text id="integration.externalIntegration.webhooks.notAvailableText" />
              </p>
            )}
            {available && (
              <div>
                <p class="text-muted small mb-2">
                  <Text id="integration.externalIntegration.webhooks.urlsText" />
                </p>
                {(manifestWebhooks || []).map(webhook => (
                  <div class="mb-2">
                    <div>
                      <strong>{getLocalizedText(webhook.label, language) || webhook.key}</strong>
                    </div>
                    <code style="word-break: break-all;">{urlByKey[webhook.key]}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhooksCard;
