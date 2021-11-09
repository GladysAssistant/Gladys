import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RtspCameraPage from './RtspCamera';

@connect('user,rtspCameras,getRtspCameraStatus', actions)
class RtspCameraIntegration extends Component {
  componentWillMount() {
    this.props.getRtspCameraDevices();
    this.props.getIntegrationByName('rtsp-camera');
  }

  render(props) {
    return <RtspCameraPage {...props} />;
  }
}

export default RtspCameraIntegration;
