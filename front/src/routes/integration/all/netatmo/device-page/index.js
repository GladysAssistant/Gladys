import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import NetatmoPage from '../NetatmoPage';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

class DevicePage extends Component {

  getConnectedState = async () => {
    let netatmoConnected = STATUS.CONNECTING;

    this.setState({
      netatmoConnected,
    });
    try {
      const { value: connectedState } = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_CONNECTED');
      if (connectedState == true) netatmoConnected = STATUS.CONNECTED; else netatmoConnected = STATUS.DISCONNECTED;
      this.setState({
        netatmoConnected,
      });
    } catch (e) {
      console.log(e)
      this.setState({
        netatmoConnected: STATUS.NOT_INITIALIZED,
      });
    }
  };

  init = async () => {
    await this.setState({ loading: true });
    await this.getConnectedState();
    await this.setState({ loading: false });
  };
  componentDidMount() {
    this.setState({
      netatmoConnectedState: RequestStatus.Getting,
    });
    this.init();
  }


  updateStatus = async (state, status) => {
    console.log('status', status)
    console.log('state', state)
    this.setState({
      netatmoConnected: state,
    });
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
  }

  render(props, { netatmoConnected }) {
    return (
      <NetatmoPage user={props.user} netatmoConnected={netatmoConnected}>
        <DeviceTab {...props} />
      </NetatmoPage>
    );
  }
}

export default connect('user,session,httpClient', {})(DevicePage);
