import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router/match';

import RemoteBox from './RemoteBox';
import EmptyState from '../EmptyState';
import { RequestStatus } from '../../../../../utils/consts';

const RemoteTab = ({
  houses,
  changeOrderDir,
  debouncedSearch,
  getBroadlinkDevicesStatus,
  broadlinkDevices = [],
  ...props
}) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.broadlink.remote.title" />
      </h1>
      <div class="page-options d-flex">
        <select onChange={changeOrderDir} class="form-control custom-select w-auto">
          <option value="asc">
            <Text id="global.orderDirAsc" />
          </option>
          <option value="desc">
            <Text id="global.orderDirDesc" />
          </option>
        </select>
        <div class="input-icon ml-2">
          <span class="input-icon-addon">
            <i class="fe fe-search" />
          </span>
          <Localizer>
            <input
              type="text"
              class="form-control w-10"
              placeholder={<Text id="integration.broadlink.remote.searchPlaceholder" />}
              onInput={debouncedSearch}
            />
          </Localizer>
        </div>
        <Link href="/dashboard/integration/device/broadlink/edit">
          <button class="btn btn-outline-primary ml-2">
            <Text id="scene.newButton" /> <i class="fe fe-plus" />
          </button>
        </Link>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: getBroadlinkDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {broadlinkDevices.map((device, index) => (
            <RemoteBox {...props} device={device} deviceIndex={index} houses={houses} />
          ))}
          {broadlinkDevices.length === 0 && <EmptyState id="integration.broadlink.remote.noRemoteFound" />}
        </div>
      </div>
    </div>
  </div>
);

export default RemoteTab;
