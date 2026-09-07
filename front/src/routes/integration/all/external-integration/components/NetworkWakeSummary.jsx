import { Text } from 'preact-i18n';

const NetworkWakeSummary = ({ networkWake }) => {
  if (!networkWake) {
    return null;
  }

  return (
    <div class="mb-4">
      <h4>
        <i class="fe fe-power mr-1" />
        <Text id="integration.externalIntegration.install.networkWakeTitle" />
      </h4>

      <p class="text-muted small mb-0">
        <Text id="integration.externalIntegration.install.networkWakeText" />
      </p>
    </div>
  );
};

export default NetworkWakeSummary;
