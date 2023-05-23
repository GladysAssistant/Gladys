import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import SetupTab from './SetupTab';
import TuyaPage from '../TuyaPage';

class TuyaSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('tuya');
    this.props.getTuyaConfiguration();
  }

  componentWillUnmount() {}

  render(props, {}) {
    return (
      <TuyaPage>
        <SetupTab {...props} />
      </TuyaPage>
    );
  }
}

export default connect(
  'user,session,currentIntegration,tuyaEndpoint,tuyaAccessKey,tuyaSecretKey,tuyaGetSettingsStatus,tuyaSaveSettingsStatus',
  actions
)(TuyaSetupPage);
