import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SmartthingsPage from '../SmartthingsPage';
import integrationConfig from '../../../../../config/integrations';
import actions from './actions';
import CloudSetupTab from './CloudSetupTab';
import ServiceSetupTab from './ServiceSetupTab';

@connect(
  'user,session,configureSmartthingsStatus,smartthingsClientId,smartthingsClientSecret,appDetailsSmartthingsStatus,smartthingsGladysClientId,smartthingsGladysClientSecret',
  actions
)
class SmartthingsSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('smartthings');
    this.props.loadProps();
  }

  render(props, {}) {
    return (
      <SmartthingsPage integration={integrationConfig[props.user.language].smartthings}>
        <ServiceSetupTab {...props} />
        <CloudSetupTab {...props} />
      </SmartthingsPage>
    );
  }
}

export default SmartthingsSetupPage;
