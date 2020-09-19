import { Text } from 'preact-i18n';
import cx from 'classnames';

import Node from './Peripheral';
import { RequestStatus } from '../../../../../utils/consts';

const NodeTab = ({ children, ...props }) => {
  const bluetoothNotReady =
    props.bluetoothGetDriverStatus === RequestStatus.Error ||
    props.bluetoothStatus === 'loading' ||
    props.bluetoothStatus === 'poweredOff';

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.bluetooth.setup.title" />
        </h3>
        <div class="page-options d-flex">
          <button
            class={cx('btn', {
              'btn-outline-danger': props.bluetoothStatus === 'scanning',
              'btn-outline-primary': props.bluetoothStatus !== 'scanning'
            })}
            onClick={props.scan}
            disabled={bluetoothNotReady}
          >
            <Text id="integration.bluetooth.setup.scanButton" /> <i class="fe fe-radio" />
          </button>
        </div>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active:
              props.bluetoothStatus === 'scanning' || props.bluetoothGetPeripheralsStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {bluetoothNotReady && (
              <div class="alert alert-warning">
                <Text id="integration.bluetooth.setup.bluetoothNotReadyError" />
              </div>
            )}
            <div class="row">
              {!bluetoothNotReady &&
                props.bluetoothPeripheralUuids &&
                props.bluetoothPeripheralUuids.map((uuid, index) => (
                  <Node
                    peripheral={props.bluetoothPeripherals[uuid]}
                    peripheralIndex={index}
                    createDevice={props.createDevice}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeTab;
