import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import NetatmoPage from '../NetatmoPage';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';

class NetatmoDiscoverPage extends Component {
  loadProps = async () => {
    let connectNetatmoStatus = STATUS.CONNECTING;
    let configuration = {};
    try {
      configuration = await this.props.httpClient.get('/api/v1/service/netatmo/config');
      if (Number(configuration.connected) === 1) connectNetatmoStatus = STATUS.CONNECTED;
      else connectNetatmoStatus = STATUS.DISCONNECTED;
    } catch (e) {
      console.error(e);
    } finally {
      this.setState({
        connectNetatmoStatus,
        showConnect: true
      });
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
        this.setState({
          accessDenied: true,
          messageAlert: state.status
        });
        break;
      case STATUS.PROCESSING_TOKEN:
        this.setState({
          connectNetatmoStatus: state.status
        });
        break;
    }
  };

  handleStateUpdateFromChild = newState => {
    this.setState(newState);
  };

  componentDidMount() {
    this.loadProps();
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
      <NetatmoPage {...props} state={state} updateStateInIndex={this.handleStateUpdateFromChild}>
        <DiscoverTab
          {...props}
          loading={loading}
          loadProps={this.loadProps}
          updateStateInIndex={this.handleStateUpdateFromChild}
        />
      </NetatmoPage>
    );
  }
}

export default connect('user,session,httpClient', {})(NetatmoDiscoverPage);
