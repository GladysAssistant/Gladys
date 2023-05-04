import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

import SetupPanel from './SetupPanel';

const SetupTab = props => (
  <div class="card" data-cy="z2m-setup-wizard">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.zigbee2mqtt.setup.title" />
      </h2>
    </div>
    <div
      class={cx('dimmer', {
        active: props.loadZigbee2mqttStatus === RequestStatus.Getting
      })}
    >
      <div class="loader py-3" />
      <div class="dimmer-content">
        {props.loadZigbee2mqttStatus === RequestStatus.Success && <SetupPanel {...props} />}
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

export default SetupTab;
