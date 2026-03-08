import style from '../style.css';
import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';

const WelcomeStep = () => (
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

export default WelcomeStep;
