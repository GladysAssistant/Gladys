---
to: ../front/src/routes/integration/all/<%= module %>/device-page/DeviceTab.jsx
---
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import <%= className %>DeviceBox from '../<%= className %>DeviceBox';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.<%= module %>.device.title" />
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
              placeholder={<Text id="integration.<%= module %>.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.get<%= className %>Status === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.<%= attributeName %>ListBody)}>
          <div class="row">
            {props.<%= attributeName %>Devices &&
              props.<%= attributeName %>Devices.length > 0 &&
              props.<%= attributeName %>Devices.map((device, index) => (
                <<%= className %>DeviceBox
                  {...props}
                  editable
                  saveButton
                  deleteButton
                  device={device}
                  deviceIndex={index}
                  listName="<%= attributeName %>Devices"
                  displayStatus="true"
                />
              ))}
            {!props.<%= attributeName %>Devices || (props.<%= attributeName %>Devices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;