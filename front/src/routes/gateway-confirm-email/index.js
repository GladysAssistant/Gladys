import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ConfirmEmail from './ConfirmEmail';

class ConfirmEmailPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      emailConfirmed: false,
      error: false
    };
  }

  async componentWillMount() {
    try {
      const result = await this.props.session.gatewayClient.confirmEmail(this.props.token);
      this.setState({
        email: result.email,
        emailConfirmed: true
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true
      });
    }
  }

  render({}, { emailConfirmed, email, error }) {
    return <ConfirmEmail emailConfirmed={emailConfirmed} email={email} error={error} />;
  }
}

export default connect('session', {})(ConfirmEmailPage);
