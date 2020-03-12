import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import CaldavPage from './CalDAV';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,caldavHost,caldavUrl,caldavUsername,caldavPassword,caldavSaveSettingsStatus,caldavGetSettingsStatus,caldavCleanUpStatus,caldavSyncStatus,caldavErrorMessage',
  actions
)
class CaldavIntegration extends Component {
  componentWillMount() {
    this.props.getCaldavSetting();
  }

  render(props, {}) {
    const loading =
      props.caldavSaveSettingsStatus === RequestStatus.Getting ||
      props.caldavGetSettingsStatus === RequestStatus.Getting ||
      props.caldavCleanUpStatus === RequestStatus.Getting ||
      props.caldavSyncStatus === RequestStatus.Getting;
    return <CaldavPage {...props} loading={loading} dictionary={this.context.intl.dictionary.integration.caldav} />;
  }
}

export default CaldavIntegration;
