import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import SignupForm from './SignupForm';
import SignupBase from './SignupBase';
import SignupGeneratingKeys from './SignupGeneratingKeys';

const ACCEPTED_LANGUAGES = ['en', 'fr'];
const DEFAULT_LANGUAGE = 'en';

class SignupPage extends Component {
  state = {
    name: '',
    email: '',
    password: '',
    fieldsErrored: [],
    currentStep: 1,
    accountAlreadyExist: false,
    signupCompleted: false,
    unknownError: false,
    tokenError: false,
    browserCompatible: window.crypto && window.crypto.subtle
  };

  validateEmail = email => {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line
    return re.test(String(email).toLowerCase());
  };

  validateData = data => {
    let fieldsErrored = [];

    if (!data.name || data.name.length < 2 || data.name.length > 30) {
      fieldsErrored.push('name');
    }

    if (!data.email || !this.validateEmail(data.email)) {
      fieldsErrored.push('email');
    }

    if (!data.password || data.password.length < 8) {
      fieldsErrored.push('password');
    }

    return fieldsErrored;
  };

  validateForm = event => {
    event.preventDefault();

    this.setState({ currentStep: 2 });

    let currentBrowserLanguage = (navigator.language || navigator.userLanguage).toLowerCase().substr(0, 2);

    if (!ACCEPTED_LANGUAGES.includes(currentBrowserLanguage)) {
      currentBrowserLanguage = DEFAULT_LANGUAGE;
    }

    let newUser = {
      name: this.state.name,
      email: this.state.email,
      password: this.state.password,
      language: currentBrowserLanguage
    };

    let fieldsErrored = this.validateData(newUser);

    if (fieldsErrored.length > 0) {
      this.setState({ fieldsErrored, currentStep: 1 });
      return;
    }

    if (!this.props.token) {
      return this.setState({ tokenError: true, currentStep: 1 });
    }

    this.props.session.gatewayClient
      .signup(newUser.name, newUser.email, newUser.password, newUser.language, this.props.token)
      .then(() => {
        setTimeout(() => {
          this.setState({
            fieldsErrored: [],
            currentStep: 2,
            accountAlreadyExist: false,
            unknownError: false,
            tokenError: false,
            signupCompleted: true
          });
        }, 1000);
      })
      .catch(error => {
        this.setState({ currentStep: 1 });
        if (error.response && error.response.status === 422 && error.response.data.details) {
          let fieldsErrored = [];
          error.response.data.details.forEach(err => {
            fieldsErrored.push(err.context.key);
          });
          this.setState({ fieldsErrored });
        } else if (error.response && error.response.status === 409) {
          this.setState({ accountAlreadyExist: true });
        } else {
          console.error(error);
          this.setState({ unknownError: true });
        }
      });
  };

  componentDidMount = () => {
    if (this.props.token) {
      this.props.session.gatewayClient
        .getInvitation(this.props.token)
        .then(invitation => this.setState({ email: invitation.email }))
        .catch(() => this.setState({ invitationError: true }));
    }
  };

  render(
    {},
    {
      name,
      email,
      password,
      fieldsErrored,
      currentStep,
      accountAlreadyExist,
      signupCompleted,
      browserCompatible,
      invitationError,
      isFireFox,
      unknownError,
      tokenError
    }
  ) {
    return (
      <SignupBase currentStep={currentStep}>
        {currentStep === 1 && (
          <SignupForm
            name={name}
            email={email}
            password={password}
            accountAlreadyExist={accountAlreadyExist}
            fieldsErrored={fieldsErrored}
            updateName={linkState(this, 'name')}
            updateEmail={linkState(this, 'email')}
            updatePassword={linkState(this, 'password')}
            validateForm={this.validateForm}
            signupCompleted={signupCompleted}
            browserCompatible={browserCompatible}
            token={this.props.token}
            invitationError={invitationError}
            isFireFox={isFireFox}
            unknownError={unknownError}
            tokenError={tokenError}
          />
        )}
        {currentStep === 2 && <SignupGeneratingKeys signupCompleted={signupCompleted} token={this.props.token} />}
      </SignupBase>
    );
  }
}

export default connect('session', {})(SignupPage);
