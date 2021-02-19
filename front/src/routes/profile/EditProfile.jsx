import { Text } from 'preact-i18n';
// import get from 'get-value';
import Profile from '../../components/user/profile';

const EditProfile = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        {' '}
        <Text id="profile.editYourProfileTitle" />
      </h3>
    </div>
    <div class="card-body">
      <div class={props.loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          {props.newUser && <Profile {...props} disableRole language="en" />}
          <div class="form-group">
            <button onClick={props.saveProfile} class="btn btn-success">
              <Text id="profile.saveButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EditProfile;
