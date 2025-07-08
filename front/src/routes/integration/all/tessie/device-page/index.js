import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import TessiePage from '../TessiePage';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/tessie/lib/utils/tessie.constants';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class DevicePage extends Component {
  loadStatus = async () => {
    try {
      const tessieStatus = await this.props.httpClient.get('/api/v1/service/tessie/status');
      this.setState({
        connectTessieStatus: tessieStatus.status,
        connected: tessieStatus.connected,
        configured: tessieStatus.configured
      });
    } catch (e) {
      this.setState({
        tessieConnectionError: RequestStatus.NetworkError,
        errored: true
      });
      console.error(e);
    } finally {
      this.setState({
        showConnect: true
      });
    }
  };

  updateStatus = async state => {
    let connected = false;
    let configured = false;
    if (
      state.status === STATUS.CONNECTED ||
      state.status === STATUS.GET_DEVICES_VALUES ||
      state.status === STATUS.DISCOVERING_DEVICES
    ) {
      connected = true;
      configured = true;
    } else if (state.status === STATUS.NOT_INITIALIZED) {
      connected = false;
      configured = false;
    } else {
      connected = false;
      configured = true;
    }
    await this.setState({
      connectTessieStatus: state.status,
      connected,
      configured
    });
  };

  updateStatusError = async state => {
    switch (state.statusType) {
      case STATUS.CONNECTING:
        if (state.status !== 'other_error') {
          this.setState({
            connectTessieStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectTessieStatus: STATUS.DISCONNECTED,
            connected: false,
            errored: true
          });
        }
        break;
      case STATUS.PROCESSING_TOKEN:
        if (state.status === 'get_access_token_fail') {
          this.setState({
            connectTessieStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else if (state.status === 'invalid_client') {
          this.setState({
            connectTessieStatus: STATUS.DISCONNECTED,
            connected: false,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectTessieStatus: STATUS.DISCONNECTED,
            connected: false,
            errored: true
          });
        }
        break;
    }
  };

  handleStateUpdateFromChild = newState => {
    this.setState(newState);
  };

  componentDidMount() {
    this.loadStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.TESSIE.STATUS, this.updateStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.TESSIE.ERROR.CONNECTING, this.updateStatusError);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.TESSIE.ERROR.PROCESSING_TOKEN, this.updateStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.TESSIE.STATUS, this.updateStatus);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.TESSIE.ERROR.CONNECTING,
      this.updateStatusError
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.TESSIE.ERROR.PROCESSING_TOKEN,
      this.updateStatus
    );
  }

  render(props, state, { loading }) {
    return (
      <TessiePage {...props}>
        <DeviceTab
          {...props}
          {...state}
          loading={loading}
          loadProps={this.loadProps}
          updateStateInIndex={this.handleStateUpdateFromChild}
          intl={this.props.intl}
        />
      </TessiePage>
    );
  }
}

export default withIntlAsProp(connect('user,session,httpClient', {})(DevicePage));
