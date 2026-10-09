import { Text } from 'preact-i18n';
import AuthLayout from '../../components/auth/AuthLayout';

const SignupBase = ({ children, ...props }) => (
  <AuthLayout titleId="gatewaySignup.title">
    {children}

    {props.currentStep === 1 && (
      <div className="text-center text-muted">
        <Text id="gatewaySignup.alreadyHaveAccount" />{' '}
        <a href="/login">
          <Text id="gatewaySignup.signin" />
        </a>
        <br />
        <Text id="gatewaySignup.supportText" />
      </div>
    )}
  </AuthLayout>
);

export default SignupBase;
