import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ConfigureTwoFactorForm from './ConfigureTwoFactorForm';
import QRCode from 'qrcode';
import actions from '../../actions/login/loginGateway';

class ConfigureTwoFactorPage extends Component {
  state = {
    dataUrl: null,
    twoFactorCode: '',
    step: 1,
    errored: false
  };

  getOtpAuthUrl = async () => {
    const accessToken = this.props.session.getTwoFactorAccessToken();
    const data = await this.props.session.gatewayClient.configureTwoFactor(accessToken);
    const url = new URL(data.otpauth_url);
    const secret = url.searchParams.get('secret');
    QRCode.toDataURL(data.otpauth_url, (err, dataUrl) => {
      // otpauthUrl: on a phone, the link that adds the account to the two-factor app of that phone
      this.setState({ dataUrl, secret, otpauthUrl: data.otpauth_url });
    });
  };

  nextStep = () => {
    this.setState({ step: this.state.step + 1 });
  };

  previousStep = () => {
    this.setState({ step: 1, errored: false });
  };

  // resolves with true once the secret is in the clipboard (the phone layout says so)
  copySecret = async () => {
    try {
      const { secret } = this.state;
      await navigator.clipboard.writeText(secret);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  updateTwoFactorCode = event => {
    let newValue = event.target.value;

    // we add a space between the two group of 3 digits code
    // so it's more readable
    if (newValue.length === 3) {
      if (newValue.length > this.state.twoFactorCode.length) {
        newValue += ' ';
      } else {
        newValue = newValue.substr(0, newValue.length - 1);
      }
    }
    this.setState({ twoFactorCode: newValue });
  };

  enableTwoFactor = async event => {
    event.preventDefault();
    const accessToken = this.props.session.getTwoFactorAccessToken();

    let twoFactorCode = this.state.twoFactorCode.replace(/\s/g, '');

    try {
      await this.props.session.gatewayClient.enableTwoFactor(accessToken, twoFactorCode);
    } catch (err) {
      if (err && err.response && err.response.status === 401) {
        window.location = '/login';
      } else {
        this.setState({ errored: true });
      }
      return;
    }
    // 2FA is now enabled. If the credentials used to reach this page are still
    // in memory, we log in again silently so the user only has to enter a fresh
    // code. Otherwise (page reloaded), we fall back to the classic login page.
    if (this.props.gatewayLoginEmail && this.props.gatewayLoginPassword) {
      try {
        await this.props.finalizeTwoFactorSetup();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    window.location = '/login';
  };

  componentWillMount = () => {
    this.getOtpAuthUrl();
  };

  render({}, { dataUrl, step, twoFactorCode, errored, secret, otpauthUrl }) {
    return (
      <ConfigureTwoFactorForm
        dataUrl={dataUrl}
        secret={secret}
        otpauthUrl={otpauthUrl}
        previousStep={this.previousStep}
        errored={errored}
        nextStep={this.nextStep}
        twoFactorCode={twoFactorCode}
        updateTwoFactorCode={this.updateTwoFactorCode}
        enableTwoFactor={this.enableTwoFactor}
        copySecret={this.copySecret}
        step={step}
      />
    );
  }
}

export default connect('session,gatewayLoginEmail,gatewayLoginPassword', actions)(ConfigureTwoFactorPage);
