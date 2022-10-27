import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import HomeKitPage from './HomeKit';
import { RequestStatus } from '../../../../utils/consts';

@connect('user,homekitSetupDataUrl,homkitGetSettingsStatus,homekitReloadStatus', actions)
class HomeKitIntegration extends Component {
  componentWillMount() {
    this.props.getHomeKitSettings();
  }

  render(props, {}) {
    const loading =
      props.homkitGetSettingsStatus === RequestStatus.Getting || props.homekitReloadStatus === RequestStatus.Getting;
    return <HomeKitPage {...props} loading={loading} />;
  }
}

export default HomeKitIntegration;
