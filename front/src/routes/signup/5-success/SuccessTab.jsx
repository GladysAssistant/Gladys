import { Text, MarkupText } from 'preact-i18n';
import style from '../style.css';
import { Link } from 'preact-router/match';

const ConfigureHouseTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-body">
      <div class={'row ' + style.equal}>
        <div class="col-md">
          <img src="/assets/images/pierre-gilles-bali.jpg" />
        </div>
        <div
          class="col-md"
          style={{
            height: '100%'
          }}
        >
          <div class="d-flex flex-column">
            <h4>
              <Text id="signup.success.title" />
            </h4>
            <p class="text">
              <MarkupText id="signup.success.introduction" />
            </p>
            <p class="text">
              <MarkupText id="signup.success.thanksForChoosingOpenSource" />
            </p>
            <p class="text">
              <MarkupText id="signup.success.ifYouWantToSupportThisSotware" />
            </p>
          </div>
          <div class="text-right align-items-end">
            <Link class="btn btn-primary" href="/dashboard">
              <Text id="signup.success.goToDashboardButton" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ConfigureHouseTab;
