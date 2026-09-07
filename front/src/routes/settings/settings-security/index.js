import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import SecurityPage from './SecurityPage';
import { RequestStatus } from '../../../utils/consts';

// Gladys Plus account security. Only reachable in gateway mode, where the
// Gladys Plus user is the one logged in: the recovery codes route is
// user-scoped, a Gladys instance cannot generate codes for its account.
class SettingsSecurity extends Component {
  state = {
    status: null,
    confirming: false,
    recoveryCodes: null,
    // the Gateway requires a current code from the two-factor app to generate recovery codes
    twoFactorCode: '',
    wrongTwoFactorCode: false
  };

  askConfirmation = () => {
    this.setState({ confirming: true, status: null, twoFactorCode: '', wrongTwoFactorCode: false });
  };

  cancelGenerate = () => {
    // also drops a stale "invalid code" alert left by a refused code
    this.setState({ confirming: false, status: null, twoFactorCode: '', wrongTwoFactorCode: false });
  };

  updateTwoFactorCode = e => {
    this.setState({ twoFactorCode: e.target.value });
  };

  generateRecoveryCodes = async () => {
    this.setState({ status: RequestStatus.Getting, wrongTwoFactorCode: false });
    try {
      const { recovery_codes: recoveryCodes } = await this.props.session.gatewayClient.generateTwoFactorRecoveryCodes(
        this.state.twoFactorCode
      );
      this.setState({ recoveryCodes, confirming: false, twoFactorCode: '', status: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      // 403: the code is wrong or expired, the user stays on the form to enter a new one
      const wrongTwoFactorCode = status === 403;
      this.setState({
        confirming: wrongTwoFactorCode,
        wrongTwoFactorCode,
        twoFactorCode: '',
        status: RequestStatus.Error
      });
    }
  };

  render(props, { status, confirming, recoveryCodes, twoFactorCode, wrongTwoFactorCode }) {
    return (
      <SecurityPage
        status={status}
        confirming={confirming}
        recoveryCodes={recoveryCodes}
        twoFactorCode={twoFactorCode}
        wrongTwoFactorCode={wrongTwoFactorCode}
        askConfirmation={this.askConfirmation}
        cancelGenerate={this.cancelGenerate}
        updateTwoFactorCode={this.updateTwoFactorCode}
        generateRecoveryCodes={this.generateRecoveryCodes}
      />
    );
  }
}

export default connect('session', {})(SettingsSecurity);
