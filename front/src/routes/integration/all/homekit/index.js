import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import HomeKitPage from './HomeKit';
import { RequestStatus } from '../../../../utils/consts';

class HomeKitIntegration extends Component {
  componentWillMount() {
    this.props.getHomeKitSettings();
  }

  render(props, {}) {
    const loading =
      props.homkitGetSettingsStatus === RequestStatus.Getting ||
      props.homekitReloadStatus === RequestStatus.Getting ||
      props.homekitResetStatus === RequestStatus.Getting;
    return <HomeKitPage {...props} loading={loading} />;
  }
}

export default connect(
  'user,homekitSetupDataUrl,homkitGetSettingsStatus,homekitReloadStatus,homekitResetStatus',
  actions
)(HomeKitIntegration);
