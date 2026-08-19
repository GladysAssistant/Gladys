import { Text } from 'preact-i18n';

import StatusBadge from './all/external-integration/components/StatusBadge';
import { EXTERNAL_INTEGRATION_STATUS_ORDER } from './all/external-integration/utils';

// "What runs on this instance", answered in one line: the number of installed
// community integrations followed by the breakdown of their live states
// ("3 Running · 1 Stopped · 1 Error"), on the same model as the per-device
// transport summary of an integration's Devices tab. The counts come from the
// installed list the catalog already downloads and keeps up to date with the
// STATUS_CHANGED events, so the strip follows a container going down live.
const InstalledIntegrationsSummary = ({ installedIntegrationsCount = 0, installedStatusCounts = {} }) => {
  const reportedStatuses = EXTERNAL_INTEGRATION_STATUS_ORDER.filter(status => installedStatusCounts[status]);
  return (
    <div class="mb-4">
      <div class="text-muted mb-2">
        <Text
          id="integration.root.installedSummary.title"
          fields={{ count: installedIntegrationsCount }}
          plural={installedIntegrationsCount}
        />
      </div>
      {reportedStatuses.map(status => (
        <span key={status} class="mr-3">
          {installedStatusCounts[status]} <StatusBadge status={status} />
        </span>
      ))}
    </div>
  );
};

export default InstalledIntegrationsSummary;
