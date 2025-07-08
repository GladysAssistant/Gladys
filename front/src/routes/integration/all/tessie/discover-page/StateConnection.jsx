import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { STATUS } from '../../../../../../../server/services/tessie/lib/utils/tessie.constants';

const StateConnection = props => (
  <div>
    {!props.accessDenied &&
      ((props.connectTessieStatus === STATUS.DISCOVERING_DEVICES && (
        <p class="text-center alert alert-info">
          <Text id="integration.tessie.status.dicoveringDevices" />
        </p>
      )) ||
        (props.connectTessieStatus === STATUS.GET_DEVICES_VALUES && (
          <p class="text-center alert alert-info">
            <Text id="integration.tessie.status.getDevicesValues" />
          </p>
        )) ||
        (props.connectTessieStatus === STATUS.CONNECTING && (
          <p class="text-center alert alert-info">
            <Text id="integration.tessie.status.connecting" />
          </p>
        )) ||
        (props.connectTessieStatus === STATUS.PROCESSING_TOKEN && (
          <p class="text-center alert alert-warning">
            <Text id="integration.tessie.status.processingToken" />
          </p>
        )) ||
        (props.connected && (
          <p class="text-center alert alert-success">
            <Text id="integration.tessie.status.connect" />
          </p>
        )) ||
        (props.connectTessieStatus === STATUS.DISCONNECTED && (
          <p class="text-center alert alert-danger">
            <Text id="integration.tessie.status.disconnect" />
          </p>
        )) ||
        ((props.errorLoading || props.connectTessieStatus === STATUS.NOT_INITIALIZED) && (
          <p class="text-center alert alert-warning">
            <Text id="integration.tessie.status.notConnected" />
            <Link href="/dashboard/integration/device/tessie/setup">
              <Text id="integration.tessie.status.setupPageLink" />
            </Link>
          </p>
        )))}
  </div>
);

export default StateConnection;
