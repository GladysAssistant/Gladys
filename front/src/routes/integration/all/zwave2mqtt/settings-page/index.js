import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zwave2mqttPage from '../Zwave2mqttPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,zwave2mqttStatus,zwave2mqttUrl,getCurrentZwave2mqttUrlStatus,zwave2mqttGetStatusStatus,zwave2mqttSaveStatus,zwave2mqttSavingInProgress,mqttConfigured,zwave2mqttConfigured',
  actions
)
class Zwave2mqttSettingsPage extends Component {
  async componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZWAVE2MQTT.STATUS_CHANGE, this.props.checkStatus);

    await this.props.getCurrentZwave2mqttUrl();
    await this.props.checkStatus();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZWAVE2MQTT.STATUS_CHANGE,
      this.props.checkStatus
    );
  }

  render(props, {}) {
    const loading =
      props.getCurrentZwave2mqttUrlStatus === RequestStatus.Getting ||
      props.zwave2mqttGetStatusStatus === RequestStatus.Getting ||
      props.zwave2mqttSaveStatus === RequestStatus.Getting;

    return (
      <Zwave2mqttPage user={props.user}>
        <SettingsTab {...props} loading={loading} />
      </Zwave2mqttPage>
    );
  }
}

export default Zwave2mqttSettingsPage;
