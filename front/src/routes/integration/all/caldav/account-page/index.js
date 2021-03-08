import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
<<<<<<< HEAD:front/src/routes/integration/all/caldav/index.js
import CaldavPage from './CalDAV';
import { RequestStatus } from '../../../../utils/consts';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
=======
import CalDAVPage from '../CalDAV';
import AccountTab from './AccountTab';
import { RequestStatus } from '../../../../../utils/consts';
>>>>>>> Enable/disable caldav calendar synchronization:front/src/routes/integration/all/caldav/account-page/index.js

@connect(
  'user,caldavHost,caldavUrl,caldavUsername,caldavPassword,caldavSaveSettingsStatus,caldavGetSettingsStatus,caldavCleanUpStatus,caldavSyncStatus',
  actions
)
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
<<<<<<< HEAD:front/src/routes/integration/all/caldav/index.js
    return <CaldavPage {...props} loading={loading} dictionary={this.props.intl.dictionary.integration.caldav} />;
  }
}

export default withIntlAsProp(CaldavIntegration);
=======
    return (
      <CalDAVPage>
        <AccountTab {...props} loading={loading} dictionary={this.context.intl.dictionary.integration.caldav} />
      </CalDAVPage>
    );
  }
}

export default AccountPage;
>>>>>>> Enable/disable caldav calendar synchronization:front/src/routes/integration/all/caldav/account-page/index.js
