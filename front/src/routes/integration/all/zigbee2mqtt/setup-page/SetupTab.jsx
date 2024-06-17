import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

import SetupPanel from './SetupPanel';
import EnableStatus from './status/EnableStatus';
import RunningStatus from './status/RunningStatus';

const SetupTab = props => {
  const { loadZigbee2mqttStatus, loadZigbee2mqttConfig, setupZigee2mqttStatus, toggleZigee2mqttStatus } = props;
  const loading = loadZigbee2mqttStatus === RequestStatus.Getting || loadZigbee2mqttConfig === RequestStatus.Getting;
  const error = loadZigbee2mqttStatus === RequestStatus.Error || loadZigbee2mqttConfig === RequestStatus.Error;
  const success = loadZigbee2mqttStatus === RequestStatus.Success && loadZigbee2mqttConfig === RequestStatus.Success;
  const saving = setupZigee2mqttStatus === RequestStatus.Getting || toggleZigee2mqttStatus === RequestStatus.Getting;
  const disabled = loading || saving;

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
              <li class="list-group-item" data-cy="z2m-running-status">
                <RunningStatus {...props} disabled={disabled} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
