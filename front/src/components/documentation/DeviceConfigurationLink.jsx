import cx from 'classnames';

const documentationURL = 'https://gladysassistant.com';

const LANGUAGES_IN_DOCUMENTATION = ['en', 'fr'];

const DEFAULT_LANGUAGE = 'en';

const getLanguage = userLanguage =>
  LANGUAGES_IN_DOCUMENTATION.includes(userLanguage) ? userLanguage : DEFAULT_LANGUAGE;

const DeviceConfigurationLink = ({ children, configurationKey, documentKey, user, linkClass }) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={`${documentationURL}/${getLanguage(user.language)}/docs/${configurationKey}/${documentKey}`}
    class={cx({
      [linkClass]: linkClass
    })}
  >
    {children}
  </a>
);

export default DeviceConfigurationLink;
