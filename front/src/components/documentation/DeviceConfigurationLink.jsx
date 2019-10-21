import { Text } from 'preact-i18n';
import cx from 'classnames';

const documentationURL = 'https://documentation.gladysassistant.com';

const DeviceConfigurationLink = ({ children, documentKey, user, linkClass }) => (
  <a
    target="_blank"
    href={`${documentationURL}/${user.language}/configuration#${documentKey}`}
    class={cx({
      [linkClass]: linkClass
    })}
  >
    {children}
  </a>
);

export default DeviceConfigurationLink;
