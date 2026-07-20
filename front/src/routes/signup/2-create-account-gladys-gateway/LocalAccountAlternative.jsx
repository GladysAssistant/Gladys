import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const LocalAccountAlternative = () => (
  <div class="alert alert-info mb-0">
    <Text id="signup.restoreLocalAccountAlternative.text" />{' '}
    <Link href="/signup/create-account-local">
      <Text id="signup.restoreLocalAccountAlternative.linkText" />
    </Link>
  </div>
);

export default LocalAccountAlternative;
