import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';

const CodePage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.arduino.device.title" />
      </h3>
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
              placeholder={<Text id="integration.arduino.device.search" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
        <div class="page-options d-flex ml-2">
          <button class="btn btn-info" onClick={props.getUsbPorts && props.getArduinoDevices && props.getDevices}>
            <Text id="integration.arduino.device.refreshButton" />
          </button>
        </div>
        {props.arduinoDevices && props.arduinoDevices.length > 0 && (
          <button class="btn btn-outline-primary ml-2" onClick={props.addDevice}>
            <Text id="scene.newButton" /> <i class="fe fe-plus" />
          </button>
        )}
      </div>
    </div>
    <div class="card-body">
      <div class="loader" />
      <div class="dimmer-content">
        
      </div>
    </div>
  </div>
);

export default CodePage;
