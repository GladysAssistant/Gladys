import { Text } from 'preact-i18n';

import { getLocalizedText } from '../utils';

// The webhooks field of the manifest is shown on the install screen like
// the other requests: the user approves that the integration will be able
// to receive events from the Internet through the Gladys Plus relay.
const WebhooksSummary = ({ webhooks, language }) => {
  if (!webhooks || webhooks.length === 0) {
    return null;
  }
  return (
    <div class="mb-4">
      <h4>
        <i class="fe fe-cloud-lightning mr-1" />
        <Text id="integration.externalIntegration.install.webhooksTitle" />
      </h4>
      <p class="text-muted small">
        <Text id="integration.externalIntegration.install.webhooksText" />
      </p>
      <ul class="mb-0">
        {webhooks.map(webhook => (
          <li>{getLocalizedText(webhook.label, language) || webhook.key}</li>
        ))}
      </ul>
    </div>
  );
};

export default WebhooksSummary;
