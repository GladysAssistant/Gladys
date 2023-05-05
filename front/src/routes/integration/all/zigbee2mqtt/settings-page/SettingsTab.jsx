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
        <button class="btn btn-info" onClick={props.loadUsbPorts} disabled={props.loading}>
          <i class="fe fe-rotate-cw" />
          <span class="d-none d-md-inline-block ml-2">
            <Text id="integration.zigbee2mqtt.settings.refreshButton" />
          </span>
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
              value={props.zigbeeDriverPath ? { label: props.zigbeeDriverPath, value: props.zigbeeDriverPath } : null}
              onChange={props.updateZigbeeDriverPath}
              options={props.usbPorts}
              isLoading={props.getZigbee2mqttUsbPortStatus === RequestStatus.Getting}
              placeholder={<Text id="integration.zigbee2mqtt.settings.zigbee2mqttUsbDriverPathPlaceholder" />}
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zigbee2mqtt.settings.zigbee2mqttUsbDongleNameLabel" />
            </label>
            <Select
              value={props.zigbeeDongleName ? { label: props.zigbeeDongleName, value: props.zigbeeDongleName } : null}
              onChange={props.updateZigbeeDongleName}
              options={props.zigbeeAdapters}
              isClearable
              placeholder={<Text id="integration.zigbee2mqtt.settings.zigbee2mqttUsbDongleNamePlaceholder" />}
            />
          </div>
          <div class="form-group">
            <button
              class="btn btn-success"
              onClick={props.saveDriverPath}
              disabled={
                props.loading ||
                props.getZigbee2mqttUsbPortStatus === RequestStatus.Getting ||
                !props.zigbeeDriverPath ||
                props.zigbeeDriverPath === ''
              }
            >
              <i class="fe fe-save" /> <Text id="integration.zigbee2mqtt.settings.saveButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsTab;
