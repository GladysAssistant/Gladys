import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import style from '../style.css';
import Profile from '../../../components/user/profile';

const CreateLocalGladysAccount = ({ children, ...props }) => (
  <div>
    <div class="row">
      <div class="col mb-4">
        <Link href="/signup" class="btn btn-secondary btn-sm float-left">
          <Text id="global.backButton" />
        </Link>
      </div>
    </div>
    <div class="row">
      <div class="col-md-8 mx-auto">
        <h2 class={style.signupTitle}>
          <Text id="signup.createLocalAccount.title" />
        </h2>
        <p>
          <Text id="signup.createLocalAccount.description" />
        </p>
        <Profile {...props} disablePreferences disableRole disableBirthdate disableProfilePicture />
        <div class="form-group">
          <button onClick={props.createUser} class="btn btn-success">
            <Text id="signup.createLocalAccount.createAccountButton" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default CreateLocalGladysAccount;
