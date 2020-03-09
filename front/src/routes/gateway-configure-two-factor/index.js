import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ConfigureTwoFactorForm from './ConfigureTwoFactorForm';
import QRCode from 'qrcode';

@connect('session', {})
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
    QRCode.toDataURL(data.otpauth_url, (err, dataUrl) => {
      this.setState({ dataUrl });
    });
  };

  nextStep = () => {
    this.setState({ step: this.state.step + 1 });
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

    this.props.session.gatewayClient
      .enableTwoFactor(accessToken, twoFactorCode)
      .then(data => {
        window.location = '/login';
      })
      .catch(err => {
        if (err && err.response && err.response.status === 401) {
          window.location = '/login';
        } else {
          this.setState({ errored: true });
        }
      });
  };

  componentWillMount = () => {
    this.getOtpAuthUrl();
  };

  render({}, { dataUrl, step, twoFactorCode, errored }) {
    return (
      <ConfigureTwoFactorForm
        dataUrl={dataUrl}
        errored={errored}
        nextStep={this.nextStep}
        twoFactorCode={twoFactorCode}
        updateTwoFactorCode={this.updateTwoFactorCode}
        enableTwoFactor={this.enableTwoFactor}
        step={step}
      />
    );
  }
}

export default ConfigureTwoFactorPage;
