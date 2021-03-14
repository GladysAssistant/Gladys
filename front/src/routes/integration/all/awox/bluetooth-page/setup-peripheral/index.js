import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../../utils/consts';
import actions from '../actions';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';

import AwoxPage from '../../AwoxPage';
import PeripheralNotFound from './PeripheralNotFound';
import ConfigurePeripheral from './ConfigurePeripheral';
import CheckBluetoothPanel from '../../../bluetooth/commons/CheckBluetoothPanel';

import style from '../../style.css';

@connect('user,session,httpClient,houses,bluetoothStatus', actions)
class AwoxDeviceSetupPage extends Component {
  updatePeripheral = peripheral => {
    if (peripheral.uuid === this.state.peripheral.uuid) {
      this.setState({ peripheral });
    }
  };

  loadDevice = async () => {
    try {
      const peripheral = await this.props.httpClient.get(`/api/v1/service/awox/peripheral/${this.state.uuid}`);

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
    let bluetoothStatus;
    try {
      bluetoothStatus = await this.props.httpClient.post(`/api/v1/service/bluetooth/scan/${this.state.uuid}`);
    } finally {
      this.props.updateStatus(bluetoothStatus);
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

    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.loadDevice);

    await this.loadDevice();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE, this.loadDevice);
  }

  render({ bluetoothStatus = {}, user }, { uuid, peripheral, status }) {
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
    }

    return (
      <AwoxPage user={user}>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.awox.setup.peripheral.title" />
            </h3>
          </div>
          <div class="card-body">
            <CheckBluetoothPanel />
            <div>{content}</div>
          </div>
        </div>
      </AwoxPage>
    );
  }
}

export default AwoxDeviceSetupPage;
