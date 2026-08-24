import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import CardFilter from '../../components/layout/CardFilter';
import DeviceRow from './DeviceRow';
import DeviceMobileItem from './DeviceMobileItem';
import EmptyState from './EmptyState';
import style from './style.css';
import dashboardStyle from '../dashboard/style.css';

const IntegrationOption = ({ integration, selectedIntegration }) => (
  <option value={integration.slug} selected={selectedIntegration === integration.slug}>
    {integration.i18nKey ? <Text id={integration.i18nKey}>{integration.name}</Text> : integration.name}
  </option>
);

const DevicesPage = ({ children, ...props }) => (
  <div class="page">
    {/* The devices page lives on the same Horizon glass scene as the dashboard:
        the global .glass-theme layer provides the glass cards and inks, the
        page-scoped class below carries the page-specific pieces */}
    <div
      class={cx(
        'page-main',
        'glass-theme',
        style.devicesPage,
        dashboardStyle.dashboardBackground,
        dashboardStyle.glassScene
      )}
    >
      {/* padding, not margin: the wallpaper wrappers space themselves with
          padding so a top margin can never collapse through the glass
          page-main and shift the scene down (same as SettingsLayout) */}
      <div class="py-3 py-md-5">
        <div class="container">
          <div class={cx('page-header', style.pageHeaderResponsive)}>
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
                {/* built-in and community integrations are grouped, so both
                    families stay identifiable even when they share a name */}
                {props.nativeIntegrationOptions.length > 0 && (
                  <Localizer>
                    <optgroup label={<Text id="devicesList.nativeIntegrations" />}>
                      {props.nativeIntegrationOptions.map(integration => (
                        <IntegrationOption integration={integration} selectedIntegration={props.selectedIntegration} />
                      ))}
                    </optgroup>
                  </Localizer>
                )}
                {props.communityIntegrationOptions.length > 0 && (
                  <Localizer>
                    <optgroup label={<Text id="devicesList.communityIntegrations" />}>
                      {props.communityIntegrationOptions.map(integration => (
                        <IntegrationOption integration={integration} selectedIntegration={props.selectedIntegration} />
                      ))}
                    </optgroup>
                  </Localizer>
                )}
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
                <div class="card d-lg-none">
                  <div class="list-group list-group-flush">
                    {props.filteredDevices.map(({ device, integration }) => (
                      <DeviceMobileItem key={device.id} device={device} integration={integration} />
                    ))}
                  </div>
                </div>
              )}
              {props.initialized && props.filteredDevices.length > 0 && (
                <div class="card d-none d-lg-block">
                  <div class="table-responsive">
                    {/* device-list-table: same Horizon pill-row grammar as the
                        devices widgets on the dashboard */}
                    <table class="table card-table table-vcenter device-list-table">
                      <thead>
                        <tr>
                          <th class="w-1" />
                          <th>
                            <Text id="devicesList.device" />
                          </th>
                          <th>
                            <Text id="devicesList.room" />
                          </th>
                          <th>
                            <Text id="devicesList.integration" />
                          </th>
                          <th>
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
