import { Text } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import Select from 'react-select';

const SettingsTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.zigbee2mqtt.settings.title" />
      </h2>
      <div class="page-options d-flex">
        <button class="btn btn-info" onClick={props.getUsbPorts}>
          <i class="fe fe-rotate-cw" /> <Text id="integration.zigbee2mqtt.settings.refreshButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.usbConfigured && (
            <div class="alert alert-success">
              <Text id="integration.zigbee2mqtt.settings.attached" />
            </div>
          )}
          {!props.usbConfigured && (
            <div class="alert alert-warning">
              <Text id="integration.zigbee2mqtt.settings.notAttached" />
            </div>
          )}
          {props.zigbee2mqttSaveStatus === RequestStatus.Getting && (
            <div class="alert alert-info">
              <Text id="integration.zigbee2mqtt.settings.saving" />
            </div>
          )}
          <p>
            <Text id="integration.zigbee2mqtt.settings.description" />
          </p>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zigbee2mqtt.settings.zigbee2mqttUsbDriverPathLabel" />
            </label>
            <Select
              value={{ label: props.zigbeeDriverPath, value: props.zigbeeDriverPath }}
              onChange={props.updateZigbeeDriverPath}
              options={props.usbPorts}
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zigbee2mqtt.settings.zigbee2mqttUsbDongleNameLabel" />
            </label>
            <Select
              value={{ label: props.zigbeeDongleName, value: props.zigbeeDongleName }}
              onChange={props.updateZigbeeDongleName}
              options={props.zigbeeAdapters}
              isClearable
            />
          </div>
          <div class="form-group">
            <button class="btn btn-success" onClick={props.saveDriverPath}>
              <i class="fe fe-save" /> <Text id="integration.zigbee2mqtt.settings.saveButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsTab;
