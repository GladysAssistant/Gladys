import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import CaldavPage from './CalDAV';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,caldavUrl,caldavUsername,caldavPassword,caldavSaveSettingsStatus,caldavGetSettingsStatus',
  actions
)
class CaldavIntegration extends Component {
  componentWillMount() {
    this.props.getCaldavSetting();
  }

  render(props, {}) {
    const loading =
      props.caldavSaveSettingsStatus === RequestStatus.Getting ||
      props.caldavGetSettingsStatus === RequestStatus.Getting;
    return <CaldavPage {...props} loading={loading} />;
  }
}

export default CaldavIntegration;
