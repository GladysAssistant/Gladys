import { Text, Localizer } from 'preact-i18n';

import { RequestStatus } from '../../utils/consts';
import ResetPasswordForm from './ResetPasswordForm';
import ResetPasswordSuccess from './ResetPasswordSuccess';

const ResetPasswordPage = ({ children, ...props }) => (
  <div class="container">
    <div class="row">
      <div class="col col-login mx-auto mt-5 pt-5">
        <div class="text-center mb-6 pt-5">
          <h2>
            <Localizer>
              <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt={<Text id="global.logoAlt" />} />
            </Localizer>
            <Text id="resetPassword.title" />
          </h2>
        </div>
        {props.resetPasswordStatus !== RequestStatus.Success ? (
          <ResetPasswordForm {...props} />
        ) : (
          <ResetPasswordSuccess {...props} />
        )}
      </div>
    </div>
  </div>
);

export default ResetPasswordPage;
