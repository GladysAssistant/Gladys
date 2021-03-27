import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router/match';

import RemoteBox from './RemoteBox';
import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';

const RemoteTab = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.broadlink.remote.title" />
                  </h1>
                  <div class="page-options d-flex">
                    <select onChange={props.changeOrderDir} class="form-control custom-select w-auto">
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
                          onInput={props.debouncedSearch}
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
                      active: props.getBroadlinkDevicesStatus === RequestStatus.Getting
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      {props.broadlinkDevices &&
                        props.broadlinkDevices.map((remote, index) => (
                          <RemoteBox {...props} remote={remote} remoteIndex={index} />
                        ))}
                      {props.broadlinkDevices && props.broadlinkDevices.length === 0 && <EmptyState />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default RemoteTab;
