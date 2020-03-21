import cx from 'classnames';

const documentationURL = 'https://documentation.gladysassistant.com';

const DeviceConfigurationLink = ({ children, documentKey, user, linkClass }) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={`${documentationURL}/${user.language}/configuration#${documentKey}`}
    class={cx({
      [linkClass]: linkClass
    })}
  >
    {children}
  </a>
);

export default DeviceConfigurationLink;
