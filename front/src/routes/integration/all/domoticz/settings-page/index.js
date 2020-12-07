import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SettingsTab from './SettingsTab';
import actions from './actions';
import DomoticzPage from '../DomoticzPage';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,getVersion,' +
    'getCurrentDomoticzServerAddressStatus,getCurrentDomoticzServerPortStatus,' +
    'connectDomoticzStatus,getDomoticzVersionStatus,' +
    'domoticzServerAddress,domoticzServerPort,domoticzVersion,domoticzStatus',
  actions
)
class DomoticzSettingsPage extends Component {
  componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_READY, payload =>
      this.props.serverReady(payload)
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_FAILED, () =>
      this.props.serverFailed()
    );

    this.props.getCurrentDomoticzServerAddress();
    this.props.getCurrentDomoticzServerPort();
    this.props.connect();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_READY,
      this.serverReadyListener
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_FAILED,
      this.serverFailedListener
    );
  }

  render(props, {}) {
    const loading =
      props.connectDomoticzStatus === RequestStatus.Getting ||
      props.getCurrentDomoticzServerAddressStatus === RequestStatus.Getting ||
      props.getCurrentDomoticzServerPortStatus === RequestStatus.Getting;

    return (
      <DomoticzPage>
        <SettingsTab {...props} loading={loading} />
      </DomoticzPage>
    );
  }
}

export default DomoticzSettingsPage;
