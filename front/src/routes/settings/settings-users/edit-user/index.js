import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import EditUserPage from './EditUserPage';
import actions from '../../../../actions/profile';
import SettingsLayout from '../../SettingsLayout';
import { RequestStatus } from '../../../../utils/consts';

class SettingsUsers extends Component {
  updateFirstname = e => {
    this.props.updateNewUserProperty('firstname', e.target.value);
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

  getUser = () => {
    this.props.initNewUser(null);
    this.props.updateDays();
    this.props.getUser(this.props.user_selector);
  };

  componentDidMount() {
    this.getUser();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.ProfilePatchStatus !== this.props.ProfilePatchStatus &&
      this.props.ProfilePatchStatus === RequestStatus.Success
    ) {
      window.scrollTo({ top: 0 });
    }
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
    const loading =
      props.ProfileGetStatus === RequestStatus.Getting || props.ProfilePatchStatus === RequestStatus.Getting;
    const profileSavedSuccess = props.ProfilePatchStatus === RequestStatus.Success;
    return (
      <SettingsLayout currentUrl={props.currentUrl}>
        <EditUserPage
          {...props}
          loading={loading}
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
          profileSavedSuccess={profileSavedSuccess}
        />
      </SettingsLayout>
    );
  }
}

export default connect(
  'currentUrl,newUser,years,months,days,createUserStatus,createUserError,profileUpdateErrors,profilePicture,newProfilePicture,newProfilePictureFormValue,ProfilePatchStatus,ProfileGetStatus',
  actions
)(SettingsUsers);
