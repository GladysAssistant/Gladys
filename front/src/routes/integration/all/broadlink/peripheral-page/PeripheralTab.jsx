import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import Peripheral from './Peripheral';
import EmptyState from './EmptyState';

const PeripheralTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.broadlink.peripheral.title" />
      </h3>
    </div>
    <div class="card-body">
      <div class="alert alert-secondary">
        <Text id="integration.broadlink.peripheral.description" />
      </div>
      <div
        class={cx('dimmer', {
          active: props.getBroadlinkPeripheralsStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getBroadlinkPeripheralsStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.broadlinkPeripherals &&
              props.broadlinkPeripherals.map((peripheral, index) => (
                <Peripheral
                  peripheral={peripheral}
                  peripheralIndex={index}
                  updatePeripheralProperty={props.updatePeripheralProperty}
                />
              ))}
            {!props.broadlinkPeripherals || (props.broadlinkPeripherals.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PeripheralTab;
