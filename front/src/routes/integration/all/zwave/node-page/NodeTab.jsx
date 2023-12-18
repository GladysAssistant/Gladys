import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';

const NodeTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.zwave.device.title" />
      </h1>
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getZwaveDeviceOrderDir}
            search={props.debouncedSearch}
            searchValue={props.zwaveDeviceSearch}
            searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
          />
        </Localizer>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getZwaveDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="alert alert-danger">
            <MarkupText id="integration.zwave.device.oldIntegrationWarning" />
          </div>
          {props.zwaveDevices && props.zwaveDevices.length === 0 && (
            <div class="alert alert-info">
              <Text id="integration.zwave.device.noDevices" />
            </div>
          )}
          {props.getZwaveDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.zwaveDevices &&
              props.zwaveDevices.map((zwaveDevice, index) => (
                <Device
                  device={zwaveDevice}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  convertToMqtt={props.convertToMqtt}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                  user={props.user}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NodeTab;
