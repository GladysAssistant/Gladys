import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import SignupForm from './SignupForm';

@connect('session', {})
class SignupPage extends Component {
  state = {
    email: '',
    emailErrored: false,
    accountAlreadyExist: false,
    paymentSuccess: false,
    paymentFailed: false,
    requestPending: false
  };

  validateEmail = email => {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line
    return re.test(String(email).toLowerCase());
  };

  saveSale = () => {
    const script = document.createElement('script');
    script.src = 'https://gladysassistant.com/assets/js/external-gladys-community-package-sales.js';
    document.body.appendChild(script);

    script.onload = () => {};
  };

  subscribeToPlan = token => {
    this.props.session.gatewayClient
      .subcribeMonthlyPlanWithoutAccount(this.state.email, this.props.language, token.id)
      .then(() => {
        this.saveSale();
        this.setState({
          paymentSuccess: true,
          paymentFailed: false,
          accountAlreadyExist: false,
          requestPending: false
        });
      })
      .catch(err => {
        if (err && err.response && err.response.status === 409) {
          this.setState({
            paymentSuccess: false,
            paymentFailed: false,
            accountAlreadyExist: true,
            requestPending: false
          });
        } else {
          this.setState({ paymentSuccess: false, paymentFailed: true, requestPending: false });
        }
      });
  };

  loadStripe = () => {
    if (this.state.stripeLoaded) {
      return;
    }

    // we load the script script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    document.body.appendChild(script);

    script.onload = () => {
      this.setState({ stripeLoaded: true });
    };
  };

  componentDidMount = () => {
    this.loadStripe();
  };

  render(
    { language },
    { email, emailErrored, accountAlreadyExist, stripeLoaded, paymentSuccess, paymentFailed, requestPending }
  ) {
    return (
      <div style={{ height: '100%' }}>
        {stripeLoaded && (
          <SignupForm
            email={email}
            updateEmail={linkState(this, 'email')}
            emailErrored={emailErrored}
            accountAlreadyExist={accountAlreadyExist}
            subscribeToPlan={this.subscribeToPlan}
            language={language}
            paymentSuccess={paymentSuccess}
            paymentFailed={paymentFailed}
            requestPending={requestPending}
            updateRequestPending={linkState(this, 'requestPending')}
            updatePaymentFailed={linkState(this, 'paymentFailed')}
          />
        )}
      </div>
    );
  }
}

export default SignupPage;
