import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import BluetoothPage from '../../BluetoothPage';
import PeripheralNotFound from './PeripheralNotFound';
import ConfigurePeripheral from './ConfigurePeripheral';
import { RequestStatus } from '../../../../../../utils/consts';
import actions from '../actions';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';

@connect('session,httpClient,houses,bluetoothStatus', actions)
class BluetoothConnnectPage extends Component {
  updatePeripheral = peripheral => {
    if (peripheral.uuid === this.state.peripheral.uuid) {
      this.setState({ peripheral });
    }
  };

  loadDevice = async () => {
    try {
      const peripheral = await this.props.httpClient.get(`/api/v1/service/bluetooth/peripheral/${this.state.uuid}`);

      this.setState({
        peripheral,
        status: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  reloadDevice = async () => {
    try {
      const bluetoothStatus = await this.props.httpClient.post(`/api/v1/service/bluetooth/scan/${this.state.uuid}`);
      this.props.updateStatus(bluetoothStatus);
    } catch (e) {}
  };

  constructor(props) {
    super(props);

    const { matches } = props;

    this.state = {
      uuid: matches.uuid,
      status: RequestStatus.Getting
    };
  }

  async componentWillMount() {
    this.props.getStatus();
    this.props.getHouses();

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.updateStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER, this.updatePeripheral);

    await this.loadDevice();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.props.updateStatus);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER, this.updatePeripheral);
  }

  render({ bluetoothStatus = {} }, { uuid, peripheral, status }) {
    let content;
    if (bluetoothStatus.ready) {
      switch (status) {
        case RequestStatus.Getting:
          content = (
            <div class="dimmer active">
              <div class="loader emptyStateDivBox" />
            </div>
          );
          break;
        case RequestStatus.Success:
          content = (
            <ConfigurePeripheral
              peripheral={peripheral}
              bluetoothStatus={bluetoothStatus}
              reloadDevice={this.reloadDevice}
            />
          );
          break;
        case RequestStatus.Error:
        default:
          content = <PeripheralNotFound uuid={uuid} />;
      }
    } else {
      content = (
        <div class="alert alert-warning">
          <Text id="integration.bluetooth.setup.bluetoothNotReadyError" />
        </div>
      );
    }

    return (
      <BluetoothPage {...uuid}>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.bluetooth.setup.peripheral.title" />
            </h3>
          </div>
          <div class="card-body">{content}</div>
        </div>
      </BluetoothPage>
    );
  }
}

export default BluetoothConnnectPage;
