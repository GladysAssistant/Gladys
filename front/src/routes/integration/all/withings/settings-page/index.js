import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import actionsOAuth2 from '../../../../../components/oauth2/actions';
import WithingsPage from '../WithingsPage';
import OAuth2Config from '../../../../../components/oauth2/OAuth2Config';
import { RequestStatus } from '../../../../../utils/consts';
import { combineActions } from '../../../../../utils/combineActions';

@connect(
  'user,session,clientIdInDb,withingsSaveStatus,oauth2GetStatus,oauth2ErrorMsg',
  combineActions(actions, actionsOAuth2)
)
class WithingsSettingsPage extends Component {
  componentWillMount() {
    this.props.updateIntegrationName('withings');
    this.props.getCurrentConfig();
    this.props.initWithingsDevices();
  }

  render(props, {}) {
    const loading = props.oauth2GetStatus === RequestStatus.Getting;
    return (
      <WithingsPage user={props.user} {...props} loading={loading}>
        <OAuth2Config integrationName="withings" user={props.user} {...props} />
      </WithingsPage>
    );
  }
}

export default WithingsSettingsPage;
