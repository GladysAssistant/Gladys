import { Text } from 'preact-i18n';
import AuthLayout from '../../components/auth/AuthLayout';
import { RequestStatus } from '../../utils/consts';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthTitle, MobileAuthForm, MobileAuthBar } from '../../components/auth/mobile';
import { withMobileViewport, MobileNotice, BigButton } from '../../components/mobile';

const RESET_ERRORS = {
  LINK: 'gatewayResetTwoFactor.errorLink',
  INSTANCE_CONNECTED: 'gatewayResetTwoFactor.instanceConnected',
  UNKNOWN: 'gatewayResetTwoFactor.error'
};

// The landing page of the two-factor reset e-mail on a phone (docs/specs/mobile-pages/auth.md,
// D.7): what the reset does, then the one button that does it — never on its own, as on desktop
const MobileResetTwoFactor = props => {
  const errorId = props.status === RequestStatus.Error ? RESET_ERRORS[props.error] : null;
  const canReset = !props.success && !props.tokenMissing;
  return (
    <MobileAuthLayout backHref="/login" backLabel={<Text id="login.mobile.navBack" />} dataCy="reset-two-factor-mobile">
      <MobileAuthForm onSubmit={props.resetTwoFactor}>
        <MobileAuthTitle lead={canReset && <Text id="gatewayResetTwoFactor.description" />}>
          <Text id="gatewayResetTwoFactor.formTitle" />
        </MobileAuthTitle>
        {props.success && (
          <MobileNotice tone="success" icon="check-circle" role="status" data-cy="reset-two-factor-success">
            <Text id="gatewayResetTwoFactor.success" />
          </MobileNotice>
        )}
        {props.tokenMissing && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="reset-two-factor-error">
            <Text id="gatewayResetTwoFactor.errorLink" />
          </MobileNotice>
        )}
        <MobileAuthBar error={errorId && <Text id={errorId} />}>
          {canReset && (
            <BigButton
              variant="primary"
              type="submit"
              loading={props.resetInProgress}
              data-cy="reset-two-factor-submit"
            >
              <Text id="gatewayResetTwoFactor.button" />
            </BigButton>
          )}
          {!canReset && (
            <BigButton variant="primary" href="/login" data-cy="reset-two-factor-login">
              <Text id="gatewayResetTwoFactor.loginLink" />
            </BigButton>
          )}
        </MobileAuthBar>
      </MobileAuthForm>
    </MobileAuthLayout>
  );
};

const DesktopResetTwoFactor = ({ children, ...props }) => (
  <AuthLayout titleId="gatewayResetTwoFactor.pageTitle">
    <form onSubmit={props.resetTwoFactor} class="card">
      <div class="card-body p-6">
        <div class="card-title">
          <Text id="gatewayResetTwoFactor.formTitle" />
        </div>
        {props.success && (
          <div class="alert alert-success" role="alert">
            <Text id="gatewayResetTwoFactor.success" />
          </div>
        )}
        {(props.tokenMissing || (props.status === RequestStatus.Error && props.error === 'LINK')) && (
          <div class="alert alert-danger" role="alert">
            <Text id="gatewayResetTwoFactor.errorLink" />
          </div>
        )}
        {props.status === RequestStatus.Error && props.error === 'INSTANCE_CONNECTED' && (
          <div class="alert alert-danger" role="alert">
            <Text id="gatewayResetTwoFactor.instanceConnected" />
          </div>
        )}
        {props.status === RequestStatus.Error && props.error === 'UNKNOWN' && (
          <div class="alert alert-danger" role="alert">
            <Text id="gatewayResetTwoFactor.error" />
          </div>
        )}
        {!props.success && !props.tokenMissing && (
          <div>
            <p>
              <Text id="gatewayResetTwoFactor.description" />
            </p>
            <div class="form-footer">
              <button type="submit" class="btn btn-primary btn-block" disabled={props.resetInProgress}>
                <Text id="gatewayResetTwoFactor.button" />
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
    <div class="text-center text-muted">
      <a href="/login">
        <Text id="gatewayResetTwoFactor.loginLink" />
      </a>
    </div>
  </AuthLayout>
);

const ResetTwoFactor = ({ isMobile, ...props }) =>
  isMobile ? <MobileResetTwoFactor {...props} /> : <DesktopResetTwoFactor {...props} />;

export default withMobileViewport(ResetTwoFactor);
