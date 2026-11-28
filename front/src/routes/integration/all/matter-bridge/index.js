import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MatterBridgePage from './MatterBridgePage';
import { RequestStatus } from '../../../../utils/consts';

// While the bridge runs, its status is read again regularly, so the page shows an ecosystem as soon
// as the user has added Gladys to it, the pairing code again when every ecosystem removed it, and
// the number of exposed devices as Gladys devices come and go.
const REFRESH_INTERVAL_MS = 5000;
// The devices that can be exposed change less often: they are read again every 6 refreshes.
const DEVICES_REFRESH_EVERY = 6;

class MatterBridgeIntegration extends Component {
  componentWillMount() {
    this.props.getMatterBridge();
    this.refreshCount = 0;
    this.refreshInterval = setInterval(() => {
      const status = this.props.matterBridgeStatus;
      if (status && status.running) {
        this.props.refreshMatterBridgeStatus();
      }
      this.refreshCount += 1;
      if (this.refreshCount % DEVICES_REFRESH_EVERY === 0) {
        this.props.getMatterBridgeDevices();
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
  'user,matterBridgeStatus,matterBridgeForm,matterBridgeDevices,matterBridgeDevicesStatus,matterBridgeQrCode,matterBridgeGetStatus,matterBridgeSaveStatus,matterBridgeResetStatus,matterBridgeToggleStatus,matterBridgeConfirmReset',
  actions
)(MatterBridgeIntegration);
