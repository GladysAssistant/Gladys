import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import CalDAVPage from '../CalDAV';
import SyncTab from './SyncTab';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class SyncPage extends Component {
  componentWillMount() {
    this.props.getCaldavSetting();
  }

  render(props, {}) {
    const loading =
      props.caldavSaveSyncStatus === RequestStatus.Getting || props.caldavGetSettingsStatus === RequestStatus.Getting;
    return (
      <CalDAVPage user={props.user}>
        <SyncTab {...props} loading={loading} dictionary={this.props.intl.dictionary.integration.caldav} />
      </CalDAVPage>
    );
  }
}

export default withIntlAsProp(
  connect('user,caldavCalendars,caldavSaveSyncStatus,caldavGetSettingsStatus,calendarsToSync', actions)(SyncPage)
);
