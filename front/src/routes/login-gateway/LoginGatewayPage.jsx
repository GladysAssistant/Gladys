import { MarkupText } from 'preact-i18n';
import GatewayLoginForm from '../../components/gateway/GatewayLoginForm';
import GatewayRecoveryCodes from '../../components/gateway/GatewayRecoveryCodes';
import AuthLayout from '../../components/auth/AuthLayout';

const LoginGatewayPage = ({ children, ...props }) => (
  <AuthLayout>
    {props.gatewayLoginRecoveryCodesStatus ? (
      <GatewayRecoveryCodes
        recoveryCodes={props.gatewayLoginRecoveryCodes}
        status={props.gatewayLoginRecoveryCodesStatus}
        onRetry={props.generateRecoveryCodes}
        onContinue={props.continueAfterRecoveryCodes}
        twoFactorCode={props.gatewayLoginRecoveryCodesTwoFactorCode}
        onTwoFactorCodeChange={props.updateRecoveryCodesTwoFactorCode}
        wrongTwoFactorCode={props.gatewayLoginRecoveryCodesWrongTwoFactorCode}
      />
    ) : (
      <GatewayLoginForm {...props} />
    )}
    <div class="text-center text-muted">
      <MarkupText id="login.needHelpText" />
    </div>
  </AuthLayout>
);

export default LoginGatewayPage;
