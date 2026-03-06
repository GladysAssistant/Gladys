import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { MQTT_MODE } from './constants';

import SetupPanel from './SetupPanel';
import EnableStatus from './status/EnableStatus';
import RunningStatus from './status/RunningStatus';

class SetupTab extends Component {
  showConfirmReset = () => {
    this.setState({ showConfirmReset: true });
  };

  cancelReset = () => {
    this.setState({ showConfirmReset: false });
  };

  confirmReset = async () => {
    this.setState({ showConfirmReset: false });
    await this.props.resetZ2M();
  };

  constructor(props) {
    super(props);
    this.state = {
      showConfirmReset: false
    };
  }

  render(props, { showConfirmReset }) {
    const {
      loadZigbee2mqttStatus,
      loadZigbee2mqttConfig,
      setupZigee2mqttStatus,
      toggleZigee2mqttStatus,
      resetZigbee2mqttStatus,
      configuration = {}
    } = props;
    const { z2mContainerError } = props.zigbee2mqttStatus || {};
    const loading = loadZigbee2mqttStatus === RequestStatus.Getting || loadZigbee2mqttConfig === RequestStatus.Getting;
    const error = loadZigbee2mqttStatus === RequestStatus.Error || loadZigbee2mqttConfig === RequestStatus.Error;
    const success = loadZigbee2mqttStatus === RequestStatus.Success && loadZigbee2mqttConfig === RequestStatus.Success;
    const saving =
      setupZigee2mqttStatus === RequestStatus.Getting ||
      toggleZigee2mqttStatus === RequestStatus.Getting ||
      resetZigbee2mqttStatus === RequestStatus.Getting;
    const disabled = loading || saving;
    const isLocalMode = configuration.mqttMode === MQTT_MODE.LOCAL;

    return (
      <div class="card" data-cy="z2m-setup-wizard">
        <div class="card-header">
          <h2 class="card-title">
            <Text id="integration.zigbee2mqtt.setup.title" />
          </h2>
        </div>
        <div
          class={cx('dimmer', {
            active: loading,
            'py-5': loading
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              {error && (
                <div class="alert alert-danger">
                  <Text id="integration.zigbee2mqtt.setup.errorLoadingStatesLabel" />
                </div>
              )}
              <ul class="list-group list-group-flush list-unstyled">
                {success && <SetupPanel {...props} disabled={disabled} />}
                {setupZigee2mqttStatus === RequestStatus.Error && (
                  <li class="list-group-item">
                    <div class="alert alert-danger my-3" data-cy="z2m-setup-save-error">
                      <Text id="integration.zigbee2mqtt.setup.saveError" />
                    </div>
                  </li>
                )}

                <li class={cx('list-group-item', { 'loading-border': saving })} data-cy="z2m-toggle-status">
                  <EnableStatus {...props} disabled={disabled} />
                </li>

                {props.z2mUrl && (
                  <li class="list-group-item">
                    <MarkupText
                      id="integration.zigbee2mqtt.setup.connectionUrl"
                      fields={{
                        url: props.z2mUrl
                      }}
                    />
                  </li>
                )}
                {z2mContainerError && (
                  <li class="list-group-item">
                    <div class="alert alert-warning my-3">
                      {z2mContainerError.code ? (
                        <MarkupText
                          id={`integration.zigbee2mqtt.setup.modes.local.containerErrors.${z2mContainerError.code}`}
                        />
                      ) : (
                        <span>
                          <Text id="integration.zigbee2mqtt.setup.modes.local.containerErrors.unknownErrorPrefix" />
                          <code>{z2mContainerError.message}</code>
                        </span>
                      )}
                    </div>
                  </li>
                )}
                <li class="list-group-item" data-cy="z2m-running-status">
                  <RunningStatus {...props} disabled={disabled} />
                </li>

                {isLocalMode && (
                  <li class="list-group-item" data-cy="z2m-reset-section">
                    <div class="form-group mt-3">
                      <label class="form-label">
                        <Text id="integration.zigbee2mqtt.setup.reset.title" />
                      </label>
                      <small class="form-text text-muted">
                        <Text id="integration.zigbee2mqtt.setup.reset.description" />
                      </small>
                    </div>
                    {resetZigbee2mqttStatus === RequestStatus.Error && (
                      <div class="alert alert-danger my-3" data-cy="z2m-reset-error">
                        <Text id="integration.zigbee2mqtt.setup.reset.error" />
                      </div>
                    )}
                    {!showConfirmReset && (
                      <button
                        class="btn btn-outline-danger"
                        onClick={this.showConfirmReset}
                        disabled={disabled}
                        data-cy="z2m-reset-button"
                      >
                        <Text id="integration.zigbee2mqtt.setup.reset.button" />
                      </button>
                    )}
                    {showConfirmReset && (
                      <div class="d-flex flex-column align-items-start" style="row-gap: 1em">
                        <div class="alert alert-danger mb-0">
                          <Text id="integration.zigbee2mqtt.setup.reset.confirmMessage" />
                        </div>
                        <div>
                          <button
                            class="btn btn-danger"
                            onClick={this.confirmReset}
                            disabled={disabled}
                            data-cy="z2m-reset-confirm-button"
                          >
                            <Text id="integration.zigbee2mqtt.setup.reset.confirmButton" />
                          </button>
                          <button
                            class="btn ml-2"
                            onClick={this.cancelReset}
                            disabled={disabled}
                            data-cy="z2m-reset-cancel-button"
                          >
                            <Text id="integration.zigbee2mqtt.setup.reset.cancelButton" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SetupTab;
