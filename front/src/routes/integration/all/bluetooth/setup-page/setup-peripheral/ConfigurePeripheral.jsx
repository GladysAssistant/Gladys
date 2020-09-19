import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../actions';
import { RequestStatus } from '../../../../../../utils/consts';
import ConfigurePeripheralSuccess from './ConfigurePeripheralSuccess';
import ConfigurePeripheralForm from './ConfigurePeripheralForm';

@connect('bluetoothSaveStatus', actions)
class ConfigurePeripheral extends Component {
  componentDidMount() {
    this.props.resetSaveStatus();
  }

  render(props, {}) {
    const { peripheral, bluetoothSaveStatus } = props;

    return (
      <div>
        <h4>{peripheral.name || peripheral.address}</h4>

        {bluetoothSaveStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.bluetooth.setup.saveError" />
          </div>
        )}

        {bluetoothSaveStatus === RequestStatus.Success && <ConfigurePeripheralSuccess />}

        {bluetoothSaveStatus !== RequestStatus.Success && <ConfigurePeripheralForm {...props} />}
      </div>
    );
  }
}

export default ConfigurePeripheral;
