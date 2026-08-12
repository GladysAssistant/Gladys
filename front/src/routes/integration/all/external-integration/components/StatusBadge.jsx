import { Text } from 'preact-i18n';

import { EXTERNAL_INTEGRATION_STATUS_BADGES } from '../utils';

const StatusBadge = ({ status, className = '' }) => {
  if (!status) {
    return null;
  }
  const badgeClass = EXTERNAL_INTEGRATION_STATUS_BADGES[status] || 'badge-secondary';
  return (
    <span class={`badge ${badgeClass} ${className}`.trim()}>
      <Text id={`integration.externalIntegration.status.${status}`}>{status}</Text>
    </span>
  );
};

export default StatusBadge;
