import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../actions';
import { RequestStatus } from '../../../../../../utils/consts';
import ConfigurePeripheralSuccess from './ConfigurePeripheralSuccess';
import ConfigurePeripheralForm from './ConfigurePeripheralForm';

class ConfigurePeripheral extends Component {
  componentDidMount() {
    this.props.resetSaveStatus();
  }

  render({ device, bluetoothSaveStatus }) {
    return (
      <div>
        <h4>{device.name}</h4>

        {bluetoothSaveStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.bluetooth.discover.saveError" />
          </div>
        )}

        {bluetoothSaveStatus === RequestStatus.Success && <ConfigurePeripheralSuccess />}

        {bluetoothSaveStatus !== RequestStatus.Success && (
          <ConfigurePeripheralForm device={device} bluetoothSaveStatus={bluetoothSaveStatus} />
        )}
      </div>
    );
  }
}

export default connect('bluetoothSaveStatus', actions)(ConfigurePeripheral);
