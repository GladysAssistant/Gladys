import style from '../style.css';
import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { withMobileViewport, MobileRow, MobileBottomBar, BigButton, kitStyle } from '../../../components/mobile';

const DesktopWelcomeStep = () => (
  <div class="d-flex flex-column flex-lg-row">
    <div class="col-lg-6">
      <h2 class={style.signupTitle}>
        <Text id="signup.welcome.title" />
      </h2>
      <p>
        <Text id="signup.welcome.introSentence" />
      </p>
      <p>
        <Text id="signup.welcome.introTimeToCreateAccount" />
      </p>
      <p>
        <Text id="signup.welcome.introDontWorryLocal" />
      </p>
      <p>
        <MarkupText id="signup.welcome.introInCaseOfIssues" />
      </p>
      <p>
        <MarkupText id="signup.welcome.introReadMoreGladysGateway" />
      </p>
    </div>
    <div class="col-lg-6 d-flex flex-row align-items-center">
      <div class="w-100">
        <Link class="btn btn-secondary btn-block mb-4 text-wrap" href="/signup/create-account-gladys-gateway">
          <i class="fe fe-download-cloud mr-1" /> <Text id="signup.welcome.buttonCreateAccountGladysGateway" />
        </Link>

        <Link class="btn btn-primary btn-block" href="/signup/create-account-local">
          <i class="fe fe-mail mr-1" /> <Text id="signup.welcome.buttonCreateAccountWithEmail" />
        </Link>
      </div>
    </div>
  </div>
);

// The first screen on a phone (docs/specs/mobile-pages/onboarding.md, C.1): what Gladys is in
// two sentences, the account creation as the one primary action, the restore as a row
const MobileWelcomeStep = () => (
  <div data-cy="signup-welcome-mobile">
    <h1 class={kitStyle.largeTitle}>
      <Text id="signup.welcome.title" />
    </h1>
    <p class={kitStyle.lead}>
      <Text id="signup.mobile.welcomeLead" />
    </p>
    <p class={kitStyle.lead}>
      <Text id="signup.welcome.introDontWorryLocal" />
    </p>
    <MobileRow
      card
      icon="download-cloud"
      iconTone="neutral"
      title={<Text id="signup.welcome.buttonCreateAccountGladysGateway" />}
      subtitle={<Text id="signup.mobile.restoreHint" />}
      href="/signup/create-account-gladys-gateway"
      dataCy="signup-restore-backup"
    />
    <div class={kitStyle.footnote}>
      <MarkupText id="signup.welcome.introInCaseOfIssues" />
    </div>
    <div class={kitStyle.footnote}>
      <MarkupText id="signup.welcome.introReadMoreGladysGateway" />
    </div>
    <MobileBottomBar>
      <BigButton variant="primary" href="/signup/create-account-local" data-cy="signup-create-account">
        <Text id="signup.welcome.buttonCreateAccountWithEmail" />
      </BigButton>
    </MobileBottomBar>
  </div>
);

const WelcomeStep = ({ isMobile }) => (isMobile ? <MobileWelcomeStep /> : <DesktopWelcomeStep />);

export default withMobileViewport(WelcomeStep);
