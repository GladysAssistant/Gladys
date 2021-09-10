import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

const SettingsTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.zwave2mqtt.settings.title" />
      </h2>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {get(props, 'zwave2mqttStatus.zwave2mqttConfigured') && (
            <div class="alert alert-success">
              <Text id="integration.zwave2mqtt.settings.connected" />
            </div>
          )}
          {!get(props, 'zwave2mqttStatus.zwave2mqttConfigured') && (
            <div class="alert alert-warning">
              <Text id="integration.zwave2mqtt.settings.notConnected" />
            </div>
          )}
          {props.zwave2mqttSavingInProgress && (
            <div class="alert alert-info">
              <Text id="integration.zwave2mqtt.settings.saving" />
            </div>
          )}
          <p>
            <Text id="integration.zwave2mqtt.settings.description" />
          </p>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zwave2mqtt.settings.zwave2mqttUrlLabel" />
            </label>
            <Localizer>
              <input
                id="zwave2mqttUrl"
                name="zwave2mqttUrl"
                placeholder={<Text id="integration.zwave2mqtt.settings.zwave2mqttUrlPlaceholder" />}
                value={props.zwave2mqttUrl}
                class="form-control"
                onInput={props.updateZwave2mqttUrl}
                disabled={props.useEmbeddedBroker}
              />
            </Localizer>
          </div>
          <div class="form-group">
            <button class="btn btn-success" onClick={props.saveZwave2mqttUrl}>
              <i class="fe fe-save" /> <Text id="integration.zwave2mqtt.settings.saveButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsTab;
