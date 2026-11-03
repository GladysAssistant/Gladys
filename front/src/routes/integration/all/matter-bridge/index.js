import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MatterBridgePage from './MatterBridgePage';
import { RequestStatus } from '../../../../utils/consts';

// While the bridge waits to be paired, its status is read again regularly, so the page shows the
// ecosystem as soon as the user has added Gladys to it.
const REFRESH_INTERVAL_MS = 5000;

class MatterBridgeIntegration extends Component {
  componentWillMount() {
    this.props.getMatterBridge();
    this.refreshInterval = setInterval(() => {
      const status = this.props.matterBridgeStatus;
      if (status && status.running && !status.commissioned) {
        this.props.refreshMatterBridgeStatus();
      }
    }, REFRESH_INTERVAL_MS);
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval);
  }

  render(props) {
    const loading =
      props.matterBridgeGetStatus === RequestStatus.Getting ||
      props.matterBridgeSaveStatus === RequestStatus.Getting ||
      props.matterBridgeToggleStatus === RequestStatus.Getting ||
      props.matterBridgeResetStatus === RequestStatus.Getting;
    return <MatterBridgePage {...props} loading={loading} />;
  }
}

export default connect(
  'user,matterBridgeStatus,matterBridgeForm,matterBridgeDevices,matterBridgeQrCode,matterBridgeGetStatus,matterBridgeSaveStatus,matterBridgeResetStatus,matterBridgeToggleStatus,matterBridgeConfirmReset',
  actions
)(MatterBridgeIntegration);
