import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const ResetPasswordSuccess = ({}) => (
  <div class="card">
    <div class="card-body p-6">
      <div class="alert alert-success" role="alert">
        <Text id="resetPassword.success" />
      </div>
      <Link href="/login" class="btn btn-block btn-success">
        <Text id="resetPassword.clickHereToLogin" />
      </Link>
    </div>
  </div>
);
export default ResetPasswordSuccess;
