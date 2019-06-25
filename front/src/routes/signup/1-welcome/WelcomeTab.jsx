import style from '../style.css';
import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';

const margin70px = {
  marginTop: '70px'
};
const margin20px = {
  marginTop: '20px'
};

const WelcomeStep = ({ children, ...props }) => (
  <div class={'row ' + style.equal}>
    <div class="col-lg-6">
      <h2>
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
    <div class="col-lg-6">
      <div class="row" style={margin70px}>
        <div class="col text-center">
          <Link class="btn btn-info btn-block" href="/signup/create-account-gladys-gateway">
            <i class="fe fe-activity" /> <Text id="signup.welcome.buttonCreateAccountGladysGateway" />
          </Link>
        </div>
      </div>
      <div class="row" style={margin20px}>
        <div class="col text-center">
          <Link class="btn btn-success btn-block" href="/signup/create-account-local">
            <i class="fe fe-mail" /> <Text id="signup.welcome.buttonCreateAccountWithEmail" />
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default WelcomeStep;
