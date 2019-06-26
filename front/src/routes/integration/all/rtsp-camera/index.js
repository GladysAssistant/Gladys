import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RtspCameraPage from './RtspCamera';
import integrationConfig from '../../../../config/integrations';

@connect(
  'user,rtspCameras,houses,getRtspCameraStatus',
  actions
)
class RtspCameraIntegration extends Component {
  componentWillMount() {
    this.props.getRtspCameraDevices(100, 0);
    this.props.getHouses();
    this.props.getIntegrationByName('rtsp-camera');
  }

  render(props, {}) {
    return <RtspCameraPage {...props} integration={integrationConfig[props.user.language]['rtsp-camera']} />;
  }
}

export default RtspCameraIntegration;
