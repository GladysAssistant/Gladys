import { Text, Localizer } from 'preact-i18n';

// Transport badge of a device (the GLADYS_TRANSPORT reserved param,
// reported by the integration): the user sees at a glance whether a
// device answers through the LAN, the vendor cloud, or not at all.
const BADGE_CLASSES = {
  local: 'badge-success',
  cloud: 'badge-info',
  unreachable: 'badge-danger'
};

const TransportBadge = ({ transport }) => {
  if (!BADGE_CLASSES[transport]) {
    return null;
  }
  return (
    <Localizer>
      <span
        class={`badge ${BADGE_CLASSES[transport]}`}
        title={<Text id={`integration.externalIntegration.transport.${transport}Tooltip`} />}
      >
        <Text id={`integration.externalIntegration.transport.${transport}Badge`} />
      </span>
    </Localizer>
  );
};

export default TransportBadge;
