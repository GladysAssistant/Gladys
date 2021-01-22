import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import CreateUserPage from './CreateUserPage';
import SettingsLayout from '../../SettingsLayout';
import slugify from '../../../../utils/slugify';
import { RequestStatus, CreateUserErrors } from '../../../../utils/consts';
import actions from '../../../../actions/profile';

@connect(
  'newUser,years,months,days,createUserStatus,profileUpdateErrors,profilePicture,newProfilePicture,newProfilePictureFormValue',
  actions
)
class SettingsUsers extends Component {
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
  updateLanguage = e => {
    this.props.updateNewUserProperty('language', e.target.value);
  };
  updatePassword = e => {
    this.props.updateNewUserProperty('password', e.target.value);
    this.props.validatePassword();
  };
  updatePasswordRepeat = e => {
    this.props.updateNewUserProperty('passwordRepeat', e.target.value);
    this.validatePasswordRepeat();
  };
  updateBirthdateDay = e => {
    this.props.updateNewUserProperty('birthdateDay', e.target.value);
  };
  updateBirthdateMonth = e => {
    this.props.updateNewUserProperty('birthdateMonth', e.target.value);
    this.props.updateDays();
  };
  updateBirthdateYear = e => {
    this.props.updateNewUserProperty('birthdateYear', e.target.value);
  };

  componentDidMount() {
    this.props.initNewUser({
      language: 'en'
    });
    this.props.updateDays();
  }

  render(props, {}) {
    return (
      <SettingsLayout>
        {props.newUser && (
          <CreateUserPage
            {...props}
            updateFirstname={this.updateFirstname}
            updateLastname={this.updateLastname}
            updateEmail={this.updateEmail}
            updateLanguage={this.updateLanguage}
            updatePassword={this.updatePassword}
            updatePasswordRepeat={this.updatePasswordRepeat}
            updateBirthdateDay={this.updateBirthdateDay}
            updateBirthdateMonth={this.updateBirthdateMonth}
            updateBirthdateYear={this.updateBirthdateYear}
            networkError={props.createUserStatus === RequestStatus.NetworkError}
            emailAlreadyExistError={
              props.createUserStatus === RequestStatus.ConflictError &&
              get(props.createLocalAccountError, 'error.attribute') === 'email'
            }
            instanceAlreadyConfiguredError={props.createUserStatus === CreateUserErrors.InstanceAlreadyConfigured}
            unknownError={props.createUserStatus === RequestStatus.Error}
          />
        )}
      </SettingsLayout>
    );
  }
}

export default SettingsUsers;
