import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SecurityPage from './SecurityPage';
import { RequestStatus } from '../../../utils/consts';

// Gladys Plus account security. Only reachable in gateway mode, where the
// Gladys Plus user is the one logged in: the recovery codes route is
// user-scoped, a Gladys instance cannot generate codes for its account.
class SettingsSecurity extends Component {
  state = {
    status: null,
    confirming: false,
    recoveryCodes: null
  };

  askConfirmation = () => {
    this.setState({ confirming: true, status: null });
  };

  cancelGenerate = () => {
    this.setState({ confirming: false });
  };

  generateRecoveryCodes = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const { recovery_codes: recoveryCodes } = await this.props.session.gatewayClient.generateTwoFactorRecoveryCodes();
      this.setState({ recoveryCodes, confirming: false, status: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ confirming: false, status: RequestStatus.Error });
    }
  };

  render(props, { status, confirming, recoveryCodes }) {
    return (
      <SecurityPage
        status={status}
        confirming={confirming}
        recoveryCodes={recoveryCodes}
        askConfirmation={this.askConfirmation}
        cancelGenerate={this.cancelGenerate}
        generateRecoveryCodes={this.generateRecoveryCodes}
      />
    );
  }
}

export default connect('session', {})(SettingsSecurity);
