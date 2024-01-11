import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import NetatmoPage from '../NetatmoPage';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

class NetatmoDiscoverPage extends Component {
  loadStatus = async () => {
    try {
      const netatmoStatus = await this.props.httpClient.get('/api/v1/service/netatmo/status');
      this.setState({
        connectNetatmoStatus: netatmoStatus.status
      });
    } catch (e) {
      this.setState({
        netatmoConnectionError: RequestStatus.NetworkError,
        errored: true
      });
      console.error(e);
    }
  };

  updateStatus = async state => {
    this.setState({
      connectNetatmoStatus: state.status
    });
  };

  updateStatusError = async state => {
    switch (state.statusType) {
      case STATUS.CONNECTING:
        if (state.status !== 'other_error') {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            errored: true
          });
        }
        break;
      case STATUS.PROCESSING_TOKEN:
        if (state.status === 'get_access_token_fail') {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            accessDenied: true,
            messageAlert: state.status
          });
        } else if (state.status === 'invalid_client') {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
            accessDenied: true,
            messageAlert: state.status
          });
        } else {
          this.setState({
            connectNetatmoStatus: STATUS.DISCONNECTED,
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
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING, this.updateStatusError);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
      this.updateStatus
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS, this.updateStatus);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING, this.updateStatus);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
      this.updateStatus
    );
  }

  render(props, state, { loading }) {
    return (
      <NetatmoPage {...props}>
        <DiscoverTab
          {...props}
          {...state}
          loading={loading}
          loadProps={this.loadProps}
          updateStateInIndex={this.handleStateUpdateFromChild}
        />
      </NetatmoPage>
    );
  }
}

export default connect('user,session,httpClient', {})(NetatmoDiscoverPage);
