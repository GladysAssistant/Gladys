import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

import SetupPanel from './SetupPanel';

const SetupTab = props => {
  const { loadZigbee2mqttStatus, loadZigbee2mqttConfig } = props;
  const loading = loadZigbee2mqttStatus === RequestStatus.Getting || loadZigbee2mqttConfig === RequestStatus.Getting;
  const error = loadZigbee2mqttStatus === RequestStatus.Error || loadZigbee2mqttConfig === RequestStatus.Error;
  const success = loadZigbee2mqttStatus === RequestStatus.Success && loadZigbee2mqttConfig === RequestStatus.Success;

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
            {success && <SetupPanel {...props} />}
          </div>
          {/**
           
          <p>
            <MarkupText id="integration.zigbee2mqtt.setup.description" />
          </p>
          {props.zigbee2mqttContainerStatus === RequestStatus.Error && (
            <p class="alert alert-danger">
              <Text id="integration.zigbee2mqtt.setup.error" />
            </p>
          )}
          <CheckStatus />

          {props.zigbee2mqttConnected && (
            <p class="alert alert-success">
              <Text id="integration.zigbee2mqtt.setup.connected" />
            </p>
          )}
          </div>
        */}
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
