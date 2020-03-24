import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { Link } from 'preact-router/match';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.netatmo.device.title" />
      </h3>
      <div class="page-options d-flex">
        <a href="/dashboard/integration/device/netatmo/add">
          <button class="btn btn-outline-success ml-2">
            <Text id="integration.netatmo.device.addDeviceButton" /> <i class="fe fe-plus" />
          </button>
        </a>
        <select onChange={props.changeOrderDir} class="form-control custom-select w-auto ml-2">
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
              placeholder={<Text id="integration.netatmo.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body"></div>
  </div>
);

export default DeviceTab;
