import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import Profile from '../../../components/user/profile';

const CreateLocalGladysAccount = ({ children, ...props }) => (
  <div>
    <Link href="/signup" class="btn btn-secondary btn-sm float-left">
      ◀️️ <Text id="signup.createLocalAccount.backButton" />
    </Link>
    <div class="row">
      <div class="col-md-8 mx-auto">
        <h2>
          <Text id="signup.createLocalAccount.title" />
        </h2>
        <p>
          <Text id="signup.createLocalAccount.description" />
        </p>
        <Profile {...props} />
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
