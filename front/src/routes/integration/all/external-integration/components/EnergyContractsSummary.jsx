import { Text } from 'preact-i18n';

import { getLocalizedText } from '../utils';

// The `energy_contracts` field of the manifest is shown on the install screen like
// the other declared capabilities (docs/specs/external-integrations/capabilities/energy-contracts.md §1):
// the contract templates the integration offers and the tariff calendars it feeds.
const EnergyContractsSummary = ({ energyContracts, language }) => {
  const templates = (energyContracts && energyContracts.templates) || [];
  const calendars = (energyContracts && energyContracts.calendars) || [];
  if (templates.length === 0 && calendars.length === 0) {
    return null;
  }
  const delegated = templates.some(template => template.pricing_mode === 'delegated');
  return (
    <div class="mb-4" data-cy="energy-contracts-summary">
      <h4>
        <i class="fe fe-zap mr-1" />
        <Text id="integration.externalIntegration.install.energyContractsTitle" />
      </h4>
      <p class="text-muted small">
        <Text id="integration.externalIntegration.install.energyContractsText" />
      </p>
      {templates.length > 0 && (
        <ul class="mb-2">
          {templates.map(template => (
            <li key={template.key}>
              {getLocalizedText(template.name, language) || template.key}
              {template.country && <span class="text-muted"> ({template.country})</span>}
              {template.pricing_mode === 'delegated' && (
                <span class="badge badge-warning ml-2">
                  <Text id="integration.externalIntegration.install.energyContractsDelegated" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {calendars.length > 0 && (
        <p class="small mb-2">
          <Text id="integration.externalIntegration.install.energyContractsCalendars" />{' '}
          {calendars.map(calendar => (
            <code key={calendar.key} class="mr-1">
              {calendar.key}
            </code>
          ))}
        </p>
      )}
      {delegated && (
        <p class="text-muted small mb-0">
          <Text id="integration.externalIntegration.install.energyContractsDelegatedText" />
        </p>
      )}
    </div>
  );
};

export default EnergyContractsSummary;
