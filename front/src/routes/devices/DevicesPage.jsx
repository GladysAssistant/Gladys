import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import CardFilter from '../../components/layout/CardFilter';
import DeviceRow from './DeviceRow';
import EmptyState from './EmptyState';
import style from './style.css';

const DevicesPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class={cx('page-header', style.pageHeaderResponsive)}>
            <div>
              <h1 class="page-title">
                <Text id="devicesList.title" />
              </h1>
              {props.initialized && (
                <div class="page-subtitle">
                  <Text
                    id="devicesList.deviceCount"
                    plural={props.filteredDevices.length}
                    fields={{ count: props.filteredDevices.length }}
                  />
                </div>
              )}
            </div>
            <div class={cx('page-options', 'd-flex', style.pageOptions)}>
              <select onChange={props.selectRoom} class="form-control custom-select w-auto mr-2">
                <option value="">
                  <Text id="devicesList.allRooms" />
                </option>
                <option value="no-room" selected={props.selectedRoomId === 'no-room'}>
                  <Text id="devicesList.noRoom" />
                </option>
                {props.rooms.map(room => (
                  <option value={room.id} selected={props.selectedRoomId === room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              <select onChange={props.selectIntegration} class="form-control custom-select w-auto mr-2">
                <option value="">
                  <Text id="devicesList.allIntegrations" />
                </option>
                {props.integrationOptions.map(integration => (
                  <option value={integration.slug} selected={props.selectedIntegration === integration.slug}>
                    {integration.i18nKey ? <Text id={integration.i18nKey}>{integration.name}</Text> : integration.name}
                  </option>
                ))}
              </select>
              <Localizer>
                <CardFilter
                  changeOrderDir={props.changeOrderDir}
                  orderValue={props.orderDir}
                  search={props.search}
                  searchValue={props.searchValue}
                  searchPlaceHolder={<Text id="devicesList.searchPlaceholder" />}
                />
              </Localizer>
            </div>
          </div>
          {props.error && (
            <div class="alert alert-danger">
              <Text id="devicesList.error" />
            </div>
          )}
          <div
            class={cx('dimmer', {
              active: props.loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.devicesListContainer)}>
              {props.initialized && props.filteredDevices.length > 0 && (
                <div class="card">
                  <div class="table-responsive">
                    <table class="table table-hover table-outline table-vcenter card-table">
                      <thead>
                        <tr>
                          <th>
                            <Text id="devicesList.device" />
                          </th>
                          <th>
                            <Text id="devicesList.room" />
                          </th>
                          <th>
                            <Text id="devicesList.integration" />
                          </th>
                          <th class="text-center">
                            <Text id="devicesList.features" />
                          </th>
                          <th class="text-right" />
                        </tr>
                      </thead>
                      <tbody>
                        {props.filteredDevices.map(({ device, integration }) => (
                          <DeviceRow key={device.id} device={device} integration={integration} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {props.initialized && props.filteredDevices.length === 0 && !props.error && <EmptyState />}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DevicesPage;
