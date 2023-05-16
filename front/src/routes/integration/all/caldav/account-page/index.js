import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import CalDAVPage from '../CalDAV';
import AccountTab from './AccountTab';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class AccountPage extends Component {
  componentWillMount() {
    this.props.getCaldavSetting();
  }

  render(props, {}) {
    const loading =
      props.caldavSaveSettingsStatus === RequestStatus.Getting ||
      props.caldavGetSettingsStatus === RequestStatus.Getting ||
      props.caldavCleanUpStatus === RequestStatus.Getting ||
      props.caldavSyncStatus === RequestStatus.Getting;
    return (
      <CalDAVPage>
        <AccountTab {...props} loading={loading} dictionary={this.props.intl.dictionary.integration.caldav} />
      </CalDAVPage>
    );
  }
}

export default withIntlAsProp(
  connect(
    'user,caldavHost,caldavUrl,caldavUsername,caldavPassword,caldavSaveSettingsStatus,caldavGetSettingsStatus,caldavCleanUpStatus,caldavSyncStatus',
    actions
  )(AccountPage)
);
