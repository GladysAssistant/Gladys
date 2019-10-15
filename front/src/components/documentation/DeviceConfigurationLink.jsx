import { Text } from 'preact-i18n';
import cx from 'classnames';

const documentationURL = 'https://documentation.gladysassistant.com';

const DeviceConfigurationLink = ({ labelKey, documentKey, user, buttonClass }) => (
  <a
    target="_blank"
    class={cx('btn', buttonClass, {
      'btn-outline-secondary': !buttonClass
    })}
    role="button"
    href={`${documentationURL}/${user.language}/configuration#${documentKey}`}
  >
    <i class="fe fe-book-open mr-2" />
    <Text id={labelKey} />
  </a>
);

export default DeviceConfigurationLink;
