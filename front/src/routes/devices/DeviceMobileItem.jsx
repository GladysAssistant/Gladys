import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import { DeviceStamp, FeatureIcons, IntegrationName } from './helpers';
import style from './style.css';

// One tappable list item: the whole row opens the device in its
// integration, like a native mobile app list. The history editor gets its
// own button next to it, since a link cannot be nested inside a link.
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

  const historyButton = (
    <Localizer>
      <Link
        href={`/dashboard/devices/${device.selector}/history`}
        class={cx('btn', 'btn-sm', 'btn-outline-secondary', style.mobileItemHistoryButton)}
        title={<Text id="devicesList.editHistory" />}
      >
        <i class="fe fe-list" />
      </Link>
    </Localizer>
  );

  if (integration && integration.deviceUrl) {
    return (
      <div class={cx('list-group-item', style.mobileItem)}>
        <Link href={integration.deviceUrl} class={cx('list-group-item-action', style.mobileItemLink)}>
          {content}
          <i class={cx('fe', 'fe-chevron-right', 'text-muted', style.mobileItemChevron)} />
        </Link>
        {historyButton}
      </div>
    );
  }
  return (
    <div class={cx('list-group-item', style.mobileItem)}>
      {content}
      {historyButton}
    </div>
  );
};

export default DeviceMobileItem;
