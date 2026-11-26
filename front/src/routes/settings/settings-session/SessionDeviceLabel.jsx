import { Text } from 'preact-i18n';
import uaParser from 'useragent-parser-js';

// What a session runs on, for the rows of the phone layout: an icon and the parts of its name
// that are known ("Chrome", "iPhone") — a user agent the parser does not know gives "unknown"
// parts, which are left out. No part at all: the device is unknown.
const UNKNOWN_PART = 'unknown';

export const describeSession = session => {
  if (session.token_type === 'api_key') {
    return { icon: 'key', parts: [], apiKey: true };
  }
  if (!session.useragent) {
    return { icon: 'help-circle', parts: [] };
  }
  const useragent = uaParser.parse(session.useragent);
  let icon = 'help-circle';
  if (useragent.isTablet) {
    icon = 'tablet';
  } else if (useragent.isMobile) {
    icon = 'smartphone';
  } else if (useragent.isDesktop) {
    icon = 'monitor';
  }
  const parts = [useragent.browser, useragent.platform].filter(
    part => part && String(part).toLowerCase() !== UNKNOWN_PART
  );
  return { icon, parts };
};

const SessionDeviceLabel = ({ session }) => {
  let label;
  let icon;

  if (!session.useragent) {
    label = <Text id="sessionsSettings.unknowDevice" />;
    icon = 'alert-triangle';
  } else {
    const useragent = uaParser.parse(session.useragent);
    label = `${useragent.browser} - ${useragent.platform} - ${useragent.os}`;

    if (useragent.isTablet) {
      icon = 'tablet';
    } else if (useragent.isMobile) {
      icon = 'smartphone';
    } else if (useragent.isDesktop) {
      icon = 'airplay';
    } else {
      icon = 'help-circle';
    }
  }

  return (
    <div>
      <i class={`fe fe-${icon} mr-2`} />
      {label}
    </div>
  );
};

export default SessionDeviceLabel;
