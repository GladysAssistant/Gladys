import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

import Peripheral from './Peripheral';
import EmptyState from '../EmptyState';
import style from '../style.css';

const PeripheralTab = ({ broadlinkPeripherals = [], housesWithRooms = [], ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.broadlink.peripheral.title" />
      </h1>
    </div>
    <div class="card-body">
      {broadlinkPeripherals.length > 0 && (
        <div class="alert alert-secondary">
          <Text id="integration.broadlink.peripheral.description" />
        </div>
      )}
      <div
        class={cx('dimmer', {
          active: props.getBroadlinkPeripheralsStatus === RequestStatus.Getting
        })}
      >
        <div class={cx('loader', style.emptyStateDivBox)} />
        <div class="dimmer-content">
          <div class="row">
            {broadlinkPeripherals.map((peripheral, index) => (
              <Peripheral
                housesWithRooms={housesWithRooms}
                peripheral={peripheral}
                peripheralIndex={index}
                updateDeviceProperty={props.updateDeviceProperty}
                saveDevice={props.saveDevice}
              />
            ))}
            {broadlinkPeripherals.length === 0 && <EmptyState id="integration.broadlink.peripheral.noPeripherals" />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PeripheralTab;
