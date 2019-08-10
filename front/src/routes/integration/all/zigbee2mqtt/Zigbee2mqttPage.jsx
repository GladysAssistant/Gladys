import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import Zigbee2mqttBox from './Zigbee2mqttBox';
import { RequestStatus } from '../../../../utils/consts';
import style from './style.css';

const Zigbee2mqttPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.zigbee2mqtt.title" />
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
                          placeholder={<Text id="integration.zigbee2mqtt.search" />}
                          onInput={props.debouncedSearch}
                        />
                      </Localizer>
                    </div>
                    <button onClick={props.addDevice} class="btn btn-outline-primary ml-2">
                      <Text id="integration.zigbee2mqtt.newButton" /> <i class="fe fe-plus" />
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.getZigbee2mqttStatus === RequestStatus.Getting
                    })}
                  >
                    <div class="loader" />
                    <div class={cx('dimmer-content', style.zigbee2mqttListBody)}>
                      <div class="row">
                        {props.zigbee2mqttDevices &&
                          props.zigbee2mqttDevices.map((device, index) => (
                            <Zigbee2mqttBox {...props} device={device} deviceIndex={index} />
                          ))}
                        {props.zigbee2mqttDevices && props.zigbee2mqttDevices.length === 0 && <EmptyState />}
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
  </div>
);

export default Zigbee2mqttPage;
