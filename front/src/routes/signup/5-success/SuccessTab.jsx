import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import style from '../style.css';

const ConfigureHouseTab = () => (
  <div class="card">
    <div class="card-body">
      <div class="row">
        <div class="col-lg-6">
          <div class="d-flex flex-column p-2">
            <div>
              <h2>
                <Text id="signup.success.title" />
              </h2>
              <p class="text">
                <MarkupText id="signup.success.introduction" />
              </p>
              <p class="text">
                <MarkupText id="signup.success.thanksForChoosingOpenSource" />
              </p>
              <p class="text">
                <MarkupText id="signup.success.ifYouWantToSupportThisSoftware" />
              </p>
            </div>

            <div>
              <Link class="btn btn-primary" href="/dashboard">
                <Text id="signup.success.goToDashboardButton" />
              </Link>
            </div>
          </div>
        </div>
        <div class="col-lg-6 mt-4 mt-lg-0">
          <img class={`img-fluid ${style.welcomeImage}`} src="/assets/images/welcome.jpg" alt="" />
        </div>
      </div>
    </div>
  </div>
);

export default ConfigureHouseTab;
