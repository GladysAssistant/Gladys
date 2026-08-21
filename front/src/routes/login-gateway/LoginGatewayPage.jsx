import { MarkupText } from 'preact-i18n';
import GatewayLoginForm from '../../components/gateway/GatewayLoginForm';
import GatewayRecoveryCodes from '../../components/gateway/GatewayRecoveryCodes';
import AuthLayout from '../../components/auth/AuthLayout';

const LoginGatewayPage = ({ children, ...props }) => (
  <AuthLayout>
    {props.gatewayLoginRecoveryCodes ? (
      <GatewayRecoveryCodes
        recoveryCodes={props.gatewayLoginRecoveryCodes}
        onContinue={props.continueAfterRecoveryCodes}
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
