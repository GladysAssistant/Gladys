import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import Zwave2mqttPage from '../Zwave2mqttPage';
import SettingsTab from './SettingsTab';
import { RequestStatus } from '../../../../../utils/consts';

@connect(
  'user,session,zwave2mqttStatus,zwave2mqttUrl,getCurrentZwave2mqttUrlStatus,zwave2mqttGetStatusStatus,zwave2mqttSaveStatus,zwave2mqttSavingInProgress',
  actions
)
class Zwave2mqttSettingsPage extends Component {
  componentWillMount() {
    this.props.getStatus();
    this.props.getCurrentZwave2mqttUrl();
  }

  componentWillUnmount() {}

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
