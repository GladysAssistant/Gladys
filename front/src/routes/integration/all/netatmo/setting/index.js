import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NetatmoPage from '../NetatmoPage';
import SettingTab from './SettingTab';
import integrationConfig from '../../../../../config/integrations';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session, netatmoUsername, netatmoPassword, netatmoClientId, netatmoClientSecret, connectNetatmoStatus, netatmoConnected', actions)
class NetatmoNodePage extends Component {
  componentWillMount() {
    this.props.loadProps();
    this.props.getIntegrationByName('netatmo');
  }

  render(props, {}) {
    return (
      <NetatmoPage integration={integrationConfig[props.user.language].netatmo}>
        <SettingTab {...props} />
      </NetatmoPage>
    );
  }
}

export default NetatmoNodePage;
