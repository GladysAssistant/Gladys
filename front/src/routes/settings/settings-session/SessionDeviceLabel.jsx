import { Text } from 'preact-i18n';
import uaParser from 'useragent-parser-js';

const SessionDeviceLabel = ({ session }) => {
  let label;
  let icon;

  if (session.client_id) {
    label = session.client_id;
    icon = 'globe';
  } else if (session.useragent) {
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
  } else {
    label = <Text id="sessionsSettings.unknowDevice" />;
    icon = 'alert-triangle';
  }

  return (
    <div>
      <i class={`fe fe-${icon} mr-2`} />
      {label}
    </div>
  );
};

export default SessionDeviceLabel;
