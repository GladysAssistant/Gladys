import { Component } from 'preact';
import { connect } from 'unistore/preact';
import 'cropperjs/dist/cropper.css';
import { RequestStatus } from '../../utils/consts';
import DashboardProfilePage from './DashboardProfilePage';
import actions from '../../actions/profile';

class Profile extends Component {
  updateFirstname = e => {
    this.props.updateNewUserProperty('firstname', e.target.value);
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
  };
  updatePasswordRepeat = e => {
    this.props.updateNewUserProperty('passwordRepeat', e.target.value);
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

  componentWillMount() {
    this.props.updateDays();
    this.props.getMySelf();
  }

  render(props, {}) {
    const loading =
      props.ProfileGetStatus === RequestStatus.Getting || props.ProfilePatchStatus === RequestStatus.Getting;
    return (
      <DashboardProfilePage
        {...props}
        loading={loading}
        newUser={props.newUser}
        errors={props.profileUpdateErrors}
        updateFirstname={this.updateFirstname}
        updateLastname={this.updateLastname}
        updateEmail={this.updateEmail}
        updateLanguage={this.updateLanguage}
        updatePassword={this.updatePassword}
        updatePasswordRepeat={this.updatePasswordRepeat}
        updateBirthdateDay={this.updateBirthdateDay}
        updateBirthdateMonth={this.updateBirthdateMonth}
        updateBirthdateYear={this.updateBirthdateYear}
        updateTemperatureUnit={this.updateTemperatureUnit}
        updateDistanceUnit={this.updateDistanceUnit}
      />
    );
  }
}

export default connect(
  'newUser,years,months,days,ProfileGetStatus,ProfilePatchStatus,profileUpdateErrors,profilePicture,newProfilePicture,newProfilePictureFormValue',
  actions
)(Profile);
