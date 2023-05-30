import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import get from 'get-value';
import SignupLayout from '../layout';
import slugify from '../../../utils/slugify';
import CreateAccountLocalTab from './CreateAccountLocalTab';
import validateEmail from '../../../utils/validateEmail';
import { RequestStatus, CreateUserErrors } from '../../../utils/consts';
import actions from '../../../actions/signup/signupCreateLocalAccount';

const MIN_PASSWORD_LENGTH = 8;

class CreateAccountLocal extends Component {
  state = {
    user: {
      firstname: '',
      lastname: '',
      email: '',
      role: 'admin',
      // there is no way to ALTER a column in SQlite, so we set a default value
      // here to simplify the login process
      birthdate: new Date(2000, 0, 1),
      language: navigator.language === 'fr' ? 'fr' : 'en',
      password: '',
      passwordRepeat: ''
    }
  };

  validatePassword = () => {
    this.setState({
      validPassword: this.state.user.password.length >= MIN_PASSWORD_LENGTH
    });
  };

  validatePasswordRepeat = () => {
    this.setState({
      validPasswordRepeat: this.state.user.password === this.state.user.passwordRepeat
    });
  };

  updateFirstname = async e => {
    const newUser = {
      ...this.state.user,
      firstname: e.target.value,
      selector: slugify(e.target.value)
    };

    await this.setState({ user: newUser });

    if (this.state.signupErrors) {
      this.validateUser();
    }
  };
  updateLastname = async e => {
    const newUser = {
      ...this.state.user,
      lastname: e.target.value
    };

    await this.setState({ user: newUser });

    if (this.state.signupErrors) {
      this.validateUser();
    }
  };
  updateEmail = async e => {
    const newUser = {
      ...this.state.user,
      email: e.target.value
    };
    await this.setState({ user: newUser });
    if (this.state.signupErrors) {
      this.validateUser();
    }
  };
  updateLanguage = e => {
    const newUser = {
      ...this.state.user,
      language: e.target.value
    };
    this.setState({ user: newUser });
  };
  updatePassword = async e => {
    const newUser = {
      ...this.state.user,
      password: e.target.value
    };
    await this.setState({ user: newUser });
    if (this.state.signupErrors) {
      this.validateUser();
    }
  };
  updatePasswordRepeat = async e => {
    const newUser = {
      ...this.state.user,
      passwordRepeat: e.target.value
    };
    await this.setState({ user: newUser });
    if (this.state.signupErrors) {
      this.validateUser();
    }
  };

  checkIfInstanceIsConfigured = async () => {
    try {
      const instanceState = await this.props.httpClient.get('/api/v1/setup');
      if (instanceState.account_configured) {
        route('/login');
      }
    } catch (e) {
      console.error(e);
    }
  };

  validateUser = () => {
    let errored = false;
    const errors = {};
    const { user } = this.state;

    if (!user.firstname || user.firstname.length === 0) {
      errored = true;
      errors.firstname = true;
    }
    if (!user.lastname || user.lastname.length === 0) {
      errored = true;
      errors.lastname = true;
    }
    if (!validateEmail(user.email)) {
      errored = true;
      errors.email = true;
    }
    if (user.password !== user.passwordRepeat) {
      errored = true;
      errors.passwordRepeat = true;
    }
    if (user.password.length < MIN_PASSWORD_LENGTH) {
      errored = true;
      errors.password = true;
    }
    this.setState({
      signupErrors: errors
    });
    return errored;
  };

  createUser = async () => {
    await this.setState({
      signupAlreadySubmitted: true
    });
    const errored = this.validateUser();
    if (errored) {
      return;
    }
    const { user: userToCreate } = this.state;
    this.setState({
      createLocalAccountStatus: RequestStatus.Getting
    });
    try {
      const user = await this.props.httpClient.post(`/api/v1/signup`, userToCreate);
      this.setState({
        user,
        createLocalAccountStatus: RequestStatus.Success
      });
      this.props.session.saveUser(user);
      this.props.session.init();
      await this.props.getMySelf();
      route('/signup/preference');
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      const message = get(e, 'response.data.message');
      if (!status) {
        this.setState({
          createLocalAccountStatus: RequestStatus.NetworkError
        });
      } else if (message === 'INSTANCE_ALREADY_CONFIGURED') {
        this.setState({
          createLocalAccountStatus: CreateUserErrors.InstanceAlreadyConfigured,
          createLocalAccountError: e.response.data
        });
      } else {
        this.setState({
          createLocalAccountStatus: RequestStatus.Error,
          createLocalAccountError: e.response.data
        });
      }
    }
  };

  componentWillMount() {
    this.checkIfInstanceIsConfigured();
  }

  render(props, { user, signupErrors, createLocalAccountStatus, createLocalAccountError }) {
    return (
      <SignupLayout currentUrl="/signup/create-account-local">
        <CreateAccountLocalTab
          newUser={user}
          errors={signupErrors}
          updateFirstname={this.updateFirstname}
          updateLastname={this.updateLastname}
          updateEmail={this.updateEmail}
          updateLanguage={this.updateLanguage}
          updatePassword={this.updatePassword}
          updatePasswordRepeat={this.updatePasswordRepeat}
          createUser={this.createUser}
          networkError={createLocalAccountStatus === RequestStatus.NetworkError}
          emailAlreadyExistError={
            createLocalAccountStatus === RequestStatus.ConflictError &&
            get(createLocalAccountError, 'error.attribute') === 'email'
          }
          instanceAlreadyConfiguredError={createLocalAccountStatus === CreateUserErrors.InstanceAlreadyConfigured}
          unknownError={createLocalAccountStatus === RequestStatus.Error}
        />
      </SignupLayout>
    );
  }
}

export default connect('httpClient,session', actions)(CreateAccountLocal);
