import { Text, MarkupText } from 'preact-i18n';
import AuthLayout from '../../components/auth/AuthLayout';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthBar } from '../../components/auth/mobile';
import authStyle from '../../components/auth/style.css';
import { withMobileViewport, MobileNotice, BigButton, kitStyle } from '../../components/mobile';

// The landing page of the confirmation e-mail on a phone (docs/specs/mobile-pages/auth.md,
// D.4): what is going on, then the way to sign in
const MobileConfirmEmail = props => (
  <MobileAuthLayout bottomBar={Boolean(props.emailConfirmed)} dataCy="confirm-email-mobile">
    {!props.emailConfirmed && !props.error && (
      <div class={authStyle.mobileStatus} role="status">
        <div class="loader" />
        <h1>
          <Text id="forgotPassword.confirmationInProgress" />
        </h1>
      </div>
    )}
    {props.emailConfirmed && (
      <div class={authStyle.mobileStatus} role="status" data-cy="confirm-email-confirmed">
        <span class={authStyle.mobileStatusIcon} aria-hidden="true">
          <i class="fe fe-check" />
        </span>
        <h1>
          <Text id="forgotPassword.emailConfirmed" />
        </h1>
      </div>
    )}
    {props.error && (
      <div data-cy="confirm-email-error">
        <MobileNotice tone="danger" icon="alert-circle" role="alert">
          <Text id="forgotPassword.invalidEmail" />
        </MobileNotice>
        <p class={kitStyle.lead}>
          <Text id="forgotPassword.validationLinkConfirmation" />
        </p>
        <p class={kitStyle.lead}>
          <MarkupText id="forgotPassword.contactUs" />
        </p>
      </div>
    )}
    {props.emailConfirmed && (
      <MobileAuthBar>
        <BigButton variant="primary" href={`/login?email=${props.email}`} data-cy="confirm-email-login">
          <Text id="forgotPassword.signIn" />
        </BigButton>
      </MobileAuthBar>
    )}
  </MobileAuthLayout>
);

const DesktopConfirmEmail = ({ children, ...props }) => (
  <AuthLayout titleId="forgotPassword.title">
    <div class="card">
      <div class="card-body p-6">
        {props.error && (
          <div>
            <div class="alert alert-danger" role="alert">
              <Text id="forgotPassword.invalidEmail" />
            </div>
            <p>
              <Text id="forgotPassword.validationLinkConfirmation" />
            </p>
            <p>
              <MarkupText id="forgotPassword.contactUs" />
            </p>
          </div>
        )}

        {props.emailConfirmed && (
          <div>
            <div class="card-title">
              <Text id="forgotPassword.emailConfirmed" />
            </div>

            <div class="form-footer">
              <a href={`/login?email=${props.email}`} class="btn btn-primary btn-block">
                <Text id="forgotPassword.signIn" />
              </a>
            </div>
          </div>
        )}
        {!props.emailConfirmed && !props.error && (
          <div>
            <div class="card-title">
              <Text id="forgotPassword.confirmationInProgress" />
            </div>
          </div>
        )}
      </div>
    </div>
  </AuthLayout>
);

const ConfirmEmail = ({ isMobile, ...props }) =>
  isMobile ? <MobileConfirmEmail {...props} /> : <DesktopConfirmEmail {...props} />;

export default withMobileViewport(ConfirmEmail);
