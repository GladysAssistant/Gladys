import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ConfirmEmail from './ConfirmEmail';

class ConfirmEmailPage extends Component {
  state = {
    emailConfirmed: false,
    error: false
  };

  componentDidMount() {
    this.props.session.gatewayClient
      .confirmEmail(this.props.token)
      .then(result => {
        this.setState({
          email: result.email,
          emailConfirmed: true
        });
      })
      .catch(() => {
        this.setState({
          error: true
        });
      });
  }

  render({}, { emailConfirmed, email, error }) {
    return <ConfirmEmail emailConfirmed={emailConfirmed} email={email} error={error} />;
  }
}

export default connect('session', {})(ConfirmEmailPage);
