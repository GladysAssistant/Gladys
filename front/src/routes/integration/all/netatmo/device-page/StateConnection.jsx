import { Text } from 'preact-i18n';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

const StateConnection = props => (
  <div>
    {!props.accessDenied &&
      ((props.connectNetatmoStatus === STATUS.DISCOVERING_DEVICES && (
        <p class="text-center alert alert-info">
          <Text id="integration.netatmo.status.dicoveringDevices" />
        </p>
      )) ||
        (props.connectNetatmoStatus === STATUS.GET_DEVICES_VALUES && (
          <p class="text-center alert alert-info">
            <Text id="integration.netatmo.status.getDevicesValues" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.CONNECTING && (
          <p class="text-center alert alert-info">
            <Text id="integration.netatmo.status.connecting" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.PROCESSING_TOKEN && (
          <p class="text-center alert alert-warning">
            <Text id="integration.netatmo.status.processingToken" />
          </p>
        )) ||
        (props.connected && (
          <p class="text-center alert alert-success">
            <Text id="integration.netatmo.status.connect" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.DISCONNECTED && (
          <p class="text-center alert alert-danger">
            <Text id="integration.netatmo.status.disconnect" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.NOT_INITIALIZED && (
          <p class="text-center alert alert-warning">
            <Text id="integration.netatmo.status.notConfigured" />
          </p>
        )))}
  </div>
);

export default StateConnection;
