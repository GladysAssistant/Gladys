import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import CalDAVPage from '../CalDAV';
import ShareTab from './ShareTab';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class SharePage extends Component {
  componentWillMount() {
    this.props.getCaldavSetting();
  }

  render(props, {}) {
    const loading =
      props.caldavSaveSharingStatus === RequestStatus.Getting ||
      props.caldavGetSettingsStatus === RequestStatus.Getting;
    return (
      <CalDAVPage user={props.user}>
        <ShareTab {...props} loading={loading} dictionary={this.props.intl.dictionary.integration.caldav} />
      </CalDAVPage>
    );
  }
}

export default withIntlAsProp(
  connect(
    'user,gladysUsers,caldavCalendars,caldavSaveSharingStatus,caldavGetSettingsStatus,calendarsSharing',
    actions
  )(SharePage)
);
