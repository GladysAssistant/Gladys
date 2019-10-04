import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import XiaomiSensor from './XiaomiSensor';
import { RequestStatus } from '../../../../utils/consts';

const SetupTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.xiaomi.setup.title" />
      </h3>
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        <MarkupText id="integration.xiaomi.setup.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.getXiaomiSensorsStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="row">
            {props.xiaomiSensors &&
              props.xiaomiSensors.map((xiaomiSensor, index) => (
                <XiaomiSensor
                  key={xiaomiSensor.external_id}
                  sensor={xiaomiSensor}
                  sensorIndex={index}
                  createDevice={props.createDevice}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SetupTab;
