import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import GoogleActionsPage from '../GoogleActionsPage';
import actions from './actions';
import CloudSetupTab from './CloudSetupTab';
import ClientIdSecretForm from '../../../../../components/oauth/ClientIdSecretCard';

@connect(
  'user,session,fileGoogleActionsValue,googleActionsProjectKey,configureGoogleActionsStatus,googleActionsConfigurationError,googleActionsConfiguration,googleActionsClientSecret,appDetailsGoogleActionsStatus,googleActionsGladysClientId,googleActionsGladysClientSecret,loadGoogleActionsStatus',
  actions
)
class GoogleActionsSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('google-actions');
    this.props.loadProps();
  }

  render(props, {}) {
    return (
      <GoogleActionsPage>
        <ClientIdSecretForm
          title={<Text id="integration.google-actions.setup.service.title" />}
          clientId="google-actions"
        />
        <CloudSetupTab {...props} />
      </GoogleActionsPage>
    );
  }
}

export default GoogleActionsSetupPage;
