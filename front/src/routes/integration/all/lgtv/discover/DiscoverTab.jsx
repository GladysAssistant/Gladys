import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from '../EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import ScannedDevices from './ScannedDevices';

const DiscoverTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.lgtv.discover.title" />
      </h1>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.scanLGTVDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content')}>
          <div class="row">
            {!props.scannedDevices || props.scannedDevices.length === 0 ? (
              <EmptyState onScan={props.onScan} onAdd={props.onAdd} />
            ) : (
              <ScannedDevices devices={props.scannedDevices} onAddScannedDevice={props.onAddScannedDevice} />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DiscoverTab;
