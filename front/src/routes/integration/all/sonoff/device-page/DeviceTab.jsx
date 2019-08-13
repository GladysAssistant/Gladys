import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import SonoffBox from './SonoffBox';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.sonoff.device.title" />
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
              placeholder={<Text id="integration.sonoff.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
        <button onClick={props.addDevice} class="btn btn-outline-primary ml-2">
          <Text id="integration.sonoff.device.newButton" /> <i class="fe fe-plus" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getSonoffStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.sonoffListBody)}>
          <div class="row">
            {props.sonoffDevices &&
              props.sonoffDevices.map((device, index) => <SonoffBox {...props} device={device} deviceIndex={index} />)}
            {props.sonoffDevices && props.sonoffDevices.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
