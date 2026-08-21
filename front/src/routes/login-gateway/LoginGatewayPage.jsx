import { MarkupText } from 'preact-i18n';
import GatewayLoginForm from '../../components/gateway/GatewayLoginForm';
import AuthLayout from '../../components/auth/AuthLayout';

const LoginGatewayPage = ({ children, ...props }) => (
  <AuthLayout>
    <GatewayLoginForm {...props} />
    <div class="text-center text-muted">
      <MarkupText id="login.needHelpText" />
    </div>
  </AuthLayout>
);

export default LoginGatewayPage;
