import { Text, MarkupText } from 'preact-i18n';
import GatewayLoginForm from '../../components/gateway/GatewayLoginForm';
import MobileGatewayLoginForm from '../../components/gateway/MobileGatewayLoginForm';
import GatewayRecoveryCodes from '../../components/gateway/GatewayRecoveryCodes';
import AuthLayout from '../../components/auth/AuthLayout';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { withMobileViewport, kitStyle } from '../../components/mobile';

const RecoveryCodes = props => (
  <GatewayRecoveryCodes
    mobile={props.isMobile}
    recoveryCodes={props.gatewayLoginRecoveryCodes}
    status={props.gatewayLoginRecoveryCodesStatus}
    onRetry={props.generateRecoveryCodes}
    onContinue={props.continueAfterRecoveryCodes}
    twoFactorCode={props.gatewayLoginRecoveryCodesTwoFactorCode}
    onTwoFactorCodeChange={props.updateRecoveryCodesTwoFactorCode}
    wrongTwoFactorCode={props.gatewayLoginRecoveryCodesWrongTwoFactorCode}
  />
);

const DesktopLoginGatewayPage = props => (
  <AuthLayout>
    {props.gatewayLoginRecoveryCodesStatus ? <RecoveryCodes {...props} /> : <GatewayLoginForm {...props} />}
    <div class="text-center text-muted">
      <MarkupText id="login.needHelpText" />
    </div>
  </AuthLayout>
);

/**
 * @description The Gladys Plus sign-in on a phone (docs/specs/mobile-pages/auth.md, D.1): the
 * account, the second factor, then the recovery codes when two-factor was just enabled. The
 * second step has a way back to the first one — the login starts again, as on a reload.
 */
const MobileLoginGatewayPage = props => {
  const showRecoveryCodes = Boolean(props.gatewayLoginRecoveryCodesStatus);
  const restart = () => props.init(props.return_url);
  return (
    <MobileAuthLayout
      onBack={props.gatewayLoginStep2 && !showRecoveryCodes ? restart : null}
      backLabel={<Text id="login.mobile.navBack" />}
      screen={`${showRecoveryCodes ? 'codes' : 'login'}-${props.gatewayLoginStep2 ? 2 : 1}`}
      dataCy="login-gateway-mobile"
    >
      {showRecoveryCodes ? <RecoveryCodes {...props} /> : <MobileGatewayLoginForm {...props} />}
      {!props.gatewayLoginStep2 && !showRecoveryCodes && (
        <div class={kitStyle.footnote}>
          <MarkupText id="login.needHelpText" />
        </div>
      )}
    </MobileAuthLayout>
  );
};

const LoginGatewayPage = ({ children, ...props }) =>
  props.isMobile ? <MobileLoginGatewayPage {...props} /> : <DesktopLoginGatewayPage {...props} />;

export default withMobileViewport(LoginGatewayPage);
