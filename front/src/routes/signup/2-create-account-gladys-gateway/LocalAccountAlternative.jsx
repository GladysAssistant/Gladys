import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { MobileRow } from '../../../components/mobile';
import style from '../style.css';

// on a phone the way out of the restore is a row: the whole line is the target
const MobileLocalAccountAlternative = () => (
  <div class={style.mobileAlternative}>
    <MobileRow
      card
      icon="user-plus"
      iconTone="neutral"
      title={<Text id="signup.restoreLocalAccountAlternative.linkText" />}
      subtitle={<Text id="signup.restoreLocalAccountAlternative.text" />}
      href="/signup/create-account-local"
      dataCy="signup-restore-local-account"
    />
  </div>
);

const DesktopLocalAccountAlternative = () => (
  <div class="alert alert-info mb-0">
    <Text id="signup.restoreLocalAccountAlternative.text" />{' '}
    <Link href="/signup/create-account-local">
      <Text id="signup.restoreLocalAccountAlternative.linkText" />
    </Link>
  </div>
);

const LocalAccountAlternative = ({ mobile }) =>
  mobile ? <MobileLocalAccountAlternative /> : <DesktopLocalAccountAlternative />;

export default LocalAccountAlternative;
