import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import 'cropperjs/dist/cropper.css';
import { RequestStatus } from '../../utils/consts';
import DashboardProfilePage from './DashboardProfilePage';
import actions from '../../actions/profile';

@connect(
  'newUser,years,months,days,ProfileGetStatus,ProfilePatchStatus,profileUpdateErrors,profilePicture,newProfilePicture,newProfilePictureFormValue',
  actions
)
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
  updateLanguage = lang => {
    this.props.updateNewUserProperty('language', get(lang, 'value'));
  };
  updatePassword = e => {
    this.props.updateNewUserProperty('password', e.target.value);
  };
  updatePasswordRepeat = e => {
    this.props.updateNewUserProperty('passwordRepeat', e.target.value);
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
      />
    );
  }
}

export default Profile;
