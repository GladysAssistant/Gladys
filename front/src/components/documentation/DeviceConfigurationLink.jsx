import cx from 'classnames';

const documentationURL = 'https://gladysassistant.com';

const DeviceConfigurationLink = ({ children, configurationKey, documentKey, user, linkClass }) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={`${documentationURL}/${user.language}/docs/${configurationKey}/${documentKey}`}
    class={cx({
      [linkClass]: linkClass
    })}
  >
    {children}
  </a>
);

export default DeviceConfigurationLink;
