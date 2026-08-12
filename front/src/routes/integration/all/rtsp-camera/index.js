import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import RtspCameraPage from './RtspCamera';

class RtspCameraIntegration extends Component {
  componentWillMount() {
    this.props.getRtspCameraDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('rtsp-camera');
  }

  render(props, {}) {
    return <RtspCameraPage {...props} />;
  }
}

export default connect(
  'user,rtspCameras,housesWithRooms,getRtspCameraStatus,rtspCameraSearch,getRtspCameraOrderDir',
  actions
)(RtspCameraIntegration);
