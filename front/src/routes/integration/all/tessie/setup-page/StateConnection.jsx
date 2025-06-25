import { Text, MarkupText } from 'preact-i18n';
import { STATUS } from '../../../../../../../server/services/tessie/lib/utils/tessie.constants';

const StateConnection = props => (
  <div>
    {props.accessDenied && (
      <p class="text-center alert alert-warning">
        <MarkupText id={`integration.tessie.status.errorConnecting.${props.messageAlert}`} />
      </p>
    )}
    {!props.accessDenied &&
      ((props.connectTessieStatus === STATUS.CONNECTING && (
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
        (props.connectTessieStatus === STATUS.NOT_INITIALIZED && (
          <p class="text-center alert alert-warning">
            <Text id="integration.tessie.status.notConfigured" />
          </p>
        )))}
  </div>
);

export default StateConnection;
