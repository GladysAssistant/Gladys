import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NetatmoPage from '../NetatmoPage';
import SettingTab from './SettingTab';

@connect('user,session, netatmoUsername, netatmoPassword, netatmoClientId, netatmoClientSecret, connectNetatmoStatus, netatmoConnected', actions)
class NetatmoNodePage extends Component {
  componentWillMount() {
    this.props.loadProps();
    this.props.getIntegrationByName('netatmo');
  }

  render(props, {}) {
    return (
      <NetatmoPage>
        <SettingTab {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoNodePage;
