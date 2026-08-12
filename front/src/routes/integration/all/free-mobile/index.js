import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import FreeMobilePage from './FreeMobile';
import { RequestStatus } from '../../../../utils/consts';

class FreeMobileIntegration extends Component {
  componentWillMount() {
    this.props.getFreeMobileSettings();
  }

  render(props, {}) {
    const loading =
      props.freeMobileGetSettingsStatus === RequestStatus.Getting ||
      props.freeMobileSaveSettingsStatus === RequestStatus.Getting;
    return <FreeMobilePage {...props} loading={loading} />;
  }
}

export default connect(
  'user,freeMobileUsername,freeMobileAccessToken,freeMobileGetSettingsStatus,freeMobileSaveSettingsStatus',
  actions
)(FreeMobileIntegration);
