import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import actions from '../actions';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';

import BluetoothPage from '../../BluetoothPage';
import PeripheralNotFound from './PeripheralNotFound';
import ConfigurePeripheral from './ConfigurePeripheral';
import CheckBluetoothPanel from '../../commons/CheckBluetoothPanel';

import style from '../../style.css';

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

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER, this.updatePeripheral);

    await this.loadDevice();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER, this.updatePeripheral);
  }

  render({ bluetoothStatus = {} }, { uuid, peripheral, status }) {
    let content;
    if (bluetoothStatus.ready) {
      switch (status) {
        case RequestStatus.Getting:
          content = (
            <div class="dimmer active">
              <div class={cx('loader', style.emptyStateDivBox)} />
            </div>
          );
          break;
        case RequestStatus.Success:
          content = <ConfigurePeripheral device={peripheral} />;
          break;
        case RequestStatus.Error:
        default:
          content = <PeripheralNotFound uuid={uuid} />;
      }
    }

    return (
      <BluetoothPage {...uuid} user={this.props.user}>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.bluetooth.discover.peripheral.title" />
            </h3>
          </div>
          <div class="card-body">
            <CheckBluetoothPanel />
            <div>{content}</div>
          </div>
        </div>
      </BluetoothPage>
    );
  }
}

export default connect('user,session,httpClient,houses,bluetoothStatus', actions)(BluetoothConnnectPage);
