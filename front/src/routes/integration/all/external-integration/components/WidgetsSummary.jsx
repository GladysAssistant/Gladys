import { Text } from 'preact-i18n';

import { getLocalizedText } from '../utils';

// The `widgets` field of the manifest is shown on the install screen like
// the other declared contracts: the dashboard widgets the integration will
// offer in the box picker once installed.
const WidgetsSummary = ({ widgets, language }) => {
  if (!widgets || widgets.length === 0) {
    return null;
  }
  return (
    <div class="mb-4">
      <h4>
        <i class="fe fe-grid mr-1" />
        <Text id="integration.externalIntegration.install.widgetsTitle" />
      </h4>
      <p class="text-muted small">
        <Text id="integration.externalIntegration.install.widgetsText" />
      </p>
      <ul class="mb-0">
        {widgets.map(widget => (
          <li key={widget.key}>
            {getLocalizedText(widget.label, language) || widget.key}
            {widget.description && <span class="text-muted"> — {getLocalizedText(widget.description, language)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WidgetsSummary;
