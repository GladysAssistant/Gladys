import { Text, Localizer } from 'preact-i18n';

import style from './transportBadge.css';

// Transport badge of a device (the GLADYS_TRANSPORT reserved param,
// reported by the integration): the user sees at a glance whether a
// device answers through the LAN, the vendor cloud, or not at all.
// The degraded state (GLADYS_TRANSPORT_DEGRADED) keeps the transport
// color and overlays an orange dot: the device works, but not in its
// nominal mode — the tooltip carries the reason published by the
// integration ("cloud + degraded" is what lets the user diagnose).
const BADGE_CLASSES = {
  local: 'badge-success',
  cloud: 'badge-info',
  unreachable: 'badge-danger'
};

const TransportBadge = ({ transport, degraded, message }) => {
  if (!BADGE_CLASSES[transport]) {
    return null;
  }
  const title = degraded ? (
    message || <Text id="integration.externalIntegration.transport.degradedTooltip" />
  ) : (
    <Text id={`integration.externalIntegration.transport.${transport}Tooltip`} />
  );
  return (
    <span class={style.badgeWrapper}>
      <Localizer>
        <span class={`badge ${BADGE_CLASSES[transport]}`} title={title}>
          <Text id={`integration.externalIntegration.transport.${transport}Badge`} />
        </span>
      </Localizer>
      {degraded && <span class={style.degradedDot} />}
    </span>
  );
};

export default TransportBadge;
