import { connect } from 'unistore/preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';
import authorizeActions from '../../actions/oauth/authorize';
import AuthorizeClientPage from './AuthorizeClientPage';
import DeniedClientPage from './DeniedClientPage';
import UnknownClientPage from './UnknownClientPage';
import style from './style.css';

const AuthorizePage = connect(
  'oauthStatus,oauthClient,redirectUri,oauthState',
  authorizeActions
)(props => (
  <div class="container">
    <div class="row">
      <div class="col col-login mx-auto">
        <div class="text-center mb-6">
          <h2>
            <Localizer>
              <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt={<Text id="global.logoAlt" />} />
            </Localizer>
            <Text id="login.title" />
          </h2>
        </div>

        <div
          class={cx('dimmer', {
            active: props.oauthStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class={`${style.emptyDiv} dimmer-content`}>
            {props.oauthStatus === RequestStatus.Error && <UnknownClientPage {...props} />}
            {props.oauthStatus === RequestStatus.Success && <AuthorizeClientPage {...props} />}
            {props.oauthStatus === RequestStatus.ValidationError && <DeniedClientPage {...props} />}
          </div>
        </div>
        <div class="text-center text-muted">
          <MarkupText id="login.needHelpText" />
        </div>
      </div>
    </div>
  </div>
));

export default AuthorizePage;
