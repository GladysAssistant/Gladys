import { Text } from 'preact-i18n';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

const StateConnection = props => (
  <div class="col-md-12">
    {!props.accessDenied &&
      ((props.connectNetatmoStatus === STATUS.DISCOVERING_DEVICES && (
        <p class="text-center alert alert-info">
          <Text id="integration.netatmo.discover.dicoveringDevices" />
        </p>
      )) ||
        (props.connectNetatmoStatus === STATUS.GET_DEVICES_VALUES && (
          <p class="text-center alert alert-info">
            <Text id="integration.netatmo.device.getDevicesValues" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.CONNECTING && (
          <p class="text-center alert alert-info">
            <Text id="integration.netatmo.setup.connecting" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.PROCESSING_TOKEN && (
          <p class="text-center alert alert-warning">
            <Text id="integration.netatmo.setup.processingToken" />
          </p>
        )) ||
        (props.connected && (
          <p class="text-center alert alert-success">
            <Text id="integration.netatmo.setup.connect" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.DISCONNECTED && (
          <p class="text-center alert alert-danger">
            <Text id="integration.netatmo.setup.disconnect" />
          </p>
        )) ||
        (props.connectNetatmoStatus === STATUS.NOT_INITIALIZED && (
          <p class="text-center alert alert-warning">
            <Text id="integration.netatmo.setup.notConfigured" />
          </p>
        )))}
  </div>
);

export default StateConnection;
