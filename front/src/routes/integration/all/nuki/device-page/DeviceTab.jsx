import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import NukiDeviceBox from '../NukiDeviceBox';
import CardFilter from '../../../../../components/layout/CardFilter';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.nuki.device.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getNukiOrderDir}
            search={props.debouncedSearch}
            searchValue={props.nukiSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getNukiStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.nukiListBody)}>
          <div class="row">
            {props.nukiDevices &&
              props.nukiDevices.length > 0 &&
              props.nukiDevices.map((device, index) => (
                <NukiDeviceBox
                  {...props}
                  editable
                  saveButton
                  deleteButton
                  editButton
                  device={device}
                  deviceIndex={index}
                  listName="nukiDevices"
                />
              ))}
            {!props.nukiDevices || (props.nukiDevices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
