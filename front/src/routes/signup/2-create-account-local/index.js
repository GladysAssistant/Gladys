import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import SignupLayout from '../layout';
import slugify from '../../../utils/slugify';
import CreateAccountLocalTab from './CreateAccountLocalTab';
import { RequestStatus, CreateUserErrors } from '../../../utils/consts';
import actions from '../../../actions/signup/signupCreateLocalAccount';

@connect(
  'newUser,years,months,days,validPassword,validPasswordRepeat,signupErrors,createLocalAccountStatus,createLocalAccountError,newProfilePicture,newProfilePictureFormValue',
  actions
)
class CreateAccountLocal extends Component {
  updateFirstname = e => {
    this.props.updateNewUserProperty('firstname', e.target.value);
    this.props.updateNewUserProperty('selector', slugify(e.target.value));
  };
  updateLastname = e => {
    this.props.updateNewUserProperty('lastname', e.target.value);
  };
  updateEmail = e => {
    this.props.updateNewUserProperty('email', e.target.value);
  };
  updateLanguage = lang => {
    this.props.updateNewUserProperty('language', get(lang, 'value'));
  };
  updatePassword = e => {
    this.props.updateNewUserProperty('password', e.target.value);
    this.props.validatePassword();
  };
  updatePasswordRepeat = e => {
    this.props.updateNewUserProperty('passwordRepeat', e.target.value);
    this.props.validatePasswordRepeat();
  };
  updateBirthdateDay = day => {
    this.props.updateNewUserProperty('birthdateDay', day);
  };
  updateBirthdateMonth = month => {
    this.props.updateNewUserProperty('birthdateMonth', get(month, 'value'));
    this.props.updateDays();
  };
  updateBirthdateYear = year => {
    this.props.updateNewUserProperty('birthdateYear', year);
  };
  componentWillMount() {
    this.props.resetNewUser();
    this.props.updateDays();
    this.props.checkIfInstanceIsConfigured();
  }

  render(props, {}) {
    return (
      <SignupLayout currentUrl="/signup/create-account-local">
        {props.newUser && (
          <CreateAccountLocalTab
            {...props}
            errors={props.signupErrors}
            updateFirstname={this.updateFirstname}
            updateLastname={this.updateLastname}
            updateEmail={this.updateEmail}
            updateLanguage={this.updateLanguage}
            updatePassword={this.updatePassword}
            updatePasswordRepeat={this.updatePasswordRepeat}
            updateBirthdateDay={this.updateBirthdateDay}
            updateBirthdateMonth={this.updateBirthdateMonth}
            updateBirthdateYear={this.updateBirthdateYear}
            networkError={props.createLocalAccountStatus === RequestStatus.NetworkError}
            emailAlreadyExistError={
              props.createLocalAccountStatus === RequestStatus.ConflictError &&
              get(props.createLocalAccountError, 'error.attribute') === 'email'
            }
            instanceAlreadyConfiguredError={
              props.createLocalAccountStatus === CreateUserErrors.InstanceAlreadyConfigured
            }
            unknownError={props.createLocalAccountStatus === RequestStatus.Error}
          />
        )}
      </SignupLayout>
    );
  }
}

export default CreateAccountLocal;
