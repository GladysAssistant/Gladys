import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import { DeviceStamp, FeatureIcons, IntegrationName } from './helpers';
import style from './style.css';

// One tappable list item: the whole row opens the device in its
// integration, like a native mobile app list
const DeviceMobileItem = ({ device, integration }) => {
  const content = [
    <DeviceStamp device={device} integration={integration} />,
    <div class={style.mobileItemBody}>
      <div class={style.mobileItemName}>{device.name}</div>
      <div class={cx('small', 'text-muted', style.mobileItemDetails)}>
        {device.room && <span class="tag">{device.room.name}</span>}
        <IntegrationName integration={integration} link={false} />
      </div>
      <FeatureIcons device={device} />
    </div>
  ];

  if (integration && integration.deviceUrl) {
    return (
      <Link href={integration.deviceUrl} class={cx('list-group-item', 'list-group-item-action', style.mobileItem)}>
        {content}
        <i class={cx('fe', 'fe-chevron-right', 'text-muted', style.mobileItemChevron)} />
      </Link>
    );
  }
  return <div class={cx('list-group-item', style.mobileItem)}>{content}</div>;
};

export default DeviceMobileItem;
