import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import EweLinkDeviceBox from '../EweLinkDeviceBox';
import CardFilter from '../../../../../components/layout/CardFilter';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.eWeLink.device.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getEweLinkOrderDir}
            search={props.debouncedSearch}
            searchValue={props.eweLinkSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getEweLinkStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.eweLinkListBody)}>
          <div class="row">
            {props.eweLinkDevices &&
              props.eweLinkDevices.length > 0 &&
              props.eweLinkDevices.map((device, index) => (
                <EweLinkDeviceBox
                  {...props}
                  editable
                  saveButton
                  deleteButton
                  editButton
                  device={device}
                  deviceIndex={index}
                  listName="eweLinkDevices"
                />
              ))}
            {!props.eweLinkDevices || (props.eweLinkDevices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
