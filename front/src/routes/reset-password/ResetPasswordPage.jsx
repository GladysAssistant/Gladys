import { RequestStatus } from '../../utils/consts';
import ResetPasswordForm from './ResetPasswordForm';
import ResetPasswordSuccess from './ResetPasswordSuccess';
import AuthLayout from '../../components/auth/AuthLayout';

const ResetPasswordPage = ({ children, ...props }) => (
  <AuthLayout titleId="resetPassword.title">
    {props.resetPasswordStatus !== RequestStatus.Success ? (
      <ResetPasswordForm {...props} />
    ) : (
      <ResetPasswordSuccess {...props} />
    )}
  </AuthLayout>
);

export default ResetPasswordPage;
