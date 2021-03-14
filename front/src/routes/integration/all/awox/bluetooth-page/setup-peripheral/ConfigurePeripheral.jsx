import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../actions';
import { RequestStatus } from '../../../../../../utils/consts';
import ConfigurePeripheralSuccess from './ConfigurePeripheralSuccess';
import ConfigurePeripheralForm from './ConfigurePeripheralForm';

@connect('awoxSaveStatus', actions)
class ConfigurePeripheral extends Component {
  componentDidMount() {
    this.props.resetSaveStatus();
  }

  render({ peripheral, awoxSaveStatus, bluetoothStatus, reloadDevice }) {
    return (
      <div>
        <h4>{peripheral.name || peripheral.address}</h4>

        {awoxSaveStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.awox.setup.saveError" />
          </div>
        )}

        {awoxSaveStatus === RequestStatus.Success && <ConfigurePeripheralSuccess />}

        {awoxSaveStatus !== RequestStatus.Success && (
          <ConfigurePeripheralForm
            peripheral={peripheral}
            bluetoothSaveStatus={awoxSaveStatus}
            bluetoothStatus={bluetoothStatus}
            reloadDevice={reloadDevice}
          />
        )}
      </div>
    );
  }
}

export default ConfigurePeripheral;
