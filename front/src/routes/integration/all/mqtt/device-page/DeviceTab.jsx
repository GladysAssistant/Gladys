import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import DeviceListItem from './DeviceListItem';
import { Link } from 'preact-router/match';
import CheckMqttPanel from '../commons/CheckMqttPanel';
import CardFilter from '../../../../../components/layout/CardFilter';
import { groupDevicesByRoom } from './utils';

const DeviceTab = ({ children, ...props }) => {
  const deviceGroups = groupDevicesByRoom(props.mqttDevices, props.houses);

  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.mqtt.device.title" />
        </h1>
        <div class="page-options d-flex">
          <Localizer>
            <CardFilter
              changeOrderDir={props.changeOrderDir}
              orderValue={props.getMqttDeviceOrderDir}
              search={props.search}
              searchValue={props.mqttDeviceSearch}
              searchPlaceHolder={<Text id="integration.mqtt.device.searchPlaceholder" />}
            />
          </Localizer>
          <Link href="/dashboard/integration/device/mqtt/edit" class="btn btn-outline-primary ml-2">
            <span class="d-none d-lg-inline-block mr-2">
              <Text id="scene.newButton" />
            </span>
            <i class="fe fe-plus" />
          </Link>
        </div>
      </div>
      <div class="card-body">
        <div class="alert alert-info">
          <MarkupText id="integration.mqtt.virtualDevicesExplanation" />
        </div>
        <CheckMqttPanel />

        <div
          class={cx('dimmer', {
            active: props.getMqttDevicesStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.getMqttDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
            {props.mqttDevices && props.mqttDevices.length === 0 && (
              <div class={style.emptyState}>
                <Text id="integration.mqtt.device.noDevices" />
              </div>
            )}
            {deviceGroups.map(group => (
              <div class={style.roomGroup} key={group.room ? group.room.id : 'unassigned'}>
                <div class={style.roomGroupHeader}>
                  {group.room ? (
                    <>
                      <span class={style.roomGroupName}>{group.room.name}</span>
                      <span class={style.roomGroupHouse}>{group.house.name}</span>
                    </>
                  ) : (
                    <span class={style.roomGroupName}>
                      <Text id="integration.mqtt.device.unassignedRoom" />
                    </span>
                  )}
                  <span class="badge badge-secondary ml-auto">{group.devices.length}</span>
                </div>
                <div class={style.deviceList}>
                  {group.devices.map(device => {
                    const deviceIndex = props.mqttDevices.findIndex(d => d.selector === device.selector);
                    return (
                      <DeviceListItem
                        key={device.selector}
                        device={device}
                        deviceIndex={deviceIndex}
                        deleteDevice={props.deleteDevice}
                        user={props.user}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceTab;
