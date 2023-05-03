import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import CreateUserPage from './CreateUserPage';
import SettingsLayout from '../../SettingsLayout';
import slugify from '../../../../utils/slugify';
import { RequestStatus } from '../../../../utils/consts';
import actions from '../../../../actions/profile';

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
  updateRole = e => {
    this.props.updateNewUserProperty('role', e.target.value);
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
    this.props.validatePasswordRepeat();
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
  updateTemperatureUnit = e => {
    this.props.updateNewUserProperty('temperature_unit_preference', e.target.value);
  };
  updateDistanceUnit = e => {
    this.props.updateNewUserProperty('distance_unit_preference', e.target.value);
  };

  componentDidMount() {
    this.props.initNewUser({
      firstname: '',
      lastname: '',
      selector: '',
      email: '',
      language: 'en',
      role: 'admin',
      birthdateYear: null,
      birthdateMonth: null,
      newProfilePicture: null
    });
    this.props.updateDays();
  }

  componentWillUnmount() {
    this.props.initNewUser({
      firstname: '',
      lastname: '',
      email: '',
      language: 'en',
      role: 'admin',
      birthdateYear: null,
      birthdateMonth: null
    });
  }

  render(props, {}) {
    return (
      <SettingsLayout currentUrl={props.currentUrl}>
        {props.newUser && (
          <CreateUserPage
            {...props}
            updateFirstname={this.updateFirstname}
            updateLastname={this.updateLastname}
            updateEmail={this.updateEmail}
            updateRole={this.updateRole}
            updateLanguage={this.updateLanguage}
            updatePassword={this.updatePassword}
            updatePasswordRepeat={this.updatePasswordRepeat}
            updateBirthdateDay={this.updateBirthdateDay}
            updateBirthdateMonth={this.updateBirthdateMonth}
            updateBirthdateYear={this.updateBirthdateYear}
            updateTemperatureUnit={this.updateTemperatureUnit}
            updateDistanceUnit={this.updateDistanceUnit}
            errors={props.profileUpdateErrors}
            networkError={props.createUserStatus === RequestStatus.NetworkError}
            emailAlreadyExistError={
              props.createUserStatus === RequestStatus.ConflictError &&
              get(props.createUserError, 'error.attribute') === 'email'
            }
            selectorAlreadyExist={
              props.createUserStatus === RequestStatus.ConflictError &&
              get(props.createUserError, 'error.attribute') === 'selector'
            }
            unknownError={props.createUserStatus === RequestStatus.Error}
          />
        )}
      </SettingsLayout>
    );
  }
}

export default connect(
  'currentUrl,newUser,years,months,days,createUserStatus,createUserError,profileUpdateErrors,profilePicture,newProfilePicture,newProfilePictureFormValue',
  actions
)(SettingsUsers);
