import { Text, MarkupText } from 'preact-i18n';

import { RequestStatus } from '../../utils/consts';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import {
  MobileAuthTitle,
  MobileAuthForm,
  MobileAuthBar,
  MobileTextField,
  MobileCodeField
} from '../../components/auth/mobile';
import MobileLostTwoFactor from '../../components/gateway/MobileLostTwoFactor';
import { MobilePasswordField, MobileNotice, BigButton, kitStyle } from '../../components/mobile';

const RESET_TWO_FACTOR_ERRORS = {
  INSTANCE_CONNECTED: 'gatewayLogin.resetTwoFactorInstanceConnected',
  TOO_MANY: 'gatewayLogin.resetTwoFactorTooMany',
  LINK: 'gatewayResetPassword.errorLinkLabel',
  UNKNOWN: 'gatewayLogin.resetTwoFactorError'
};

/**
 * @description Choosing a new Gladys Plus password on a phone (docs/specs/mobile-pages/auth.md,
 * D.6): the password twice, then — when the account has two-factor authentication — the code of
 * the app or a recovery code. Same props as the desktop form: the checks and the requests stay
 * in the container.
 */
const MobileResetPassword = props => {
  let barError = null;
  if (props.errorLink) {
    barError = <Text id="gatewayResetPassword.errorLinkLabel" />;
  } else if (props.twoFactorResetStatus === RequestStatus.Error && RESET_TWO_FACTOR_ERRORS[props.twoFactorResetError]) {
    barError = <Text id={RESET_TWO_FACTOR_ERRORS[props.twoFactorResetError]} />;
  }
  return (
    <MobileAuthLayout
      backHref="/login"
      backLabel={<Text id="login.mobile.navBack" />}
      dataCy="gateway-reset-password-mobile"
    >
      <MobileAuthForm onSubmit={props.resetPassword}>
        <MobileAuthTitle>
          <Text id="gatewayResetPassword.formTitle" />
        </MobileAuthTitle>
        {props.success && (
          <MobileNotice tone="success" icon="check-circle" role="status" data-cy="gateway-reset-password-success">
            <MarkupText id="resetPassword.resetSuccess" />
          </MobileNotice>
        )}
        {!props.success && props.twoFactorResetStatus === RequestStatus.Success && (
          <MobileNotice tone="success" icon="mail" role="status" data-cy="gateway-reset-password-reset-sent">
            <Text id="gatewayLogin.resetTwoFactorEmailSent" />{' '}
            <Text id="gatewayResetPassword.resetTwoFactorThenComeBack" />
          </MobileNotice>
        )}
        {!props.success && (
          <MobilePasswordField
            id="gateway-reset-password"
            label={<Text id="gatewayResetPassword.passwordLabel" />}
            placeholder={<Text id="gatewayResetPassword.passwordPlaceholder" />}
            value={props.password}
            onInput={props.updatePassword}
            error={props.passwordError && <Text id="gatewayResetPassword.passwordInvalid" />}
            autocomplete="new-password"
            enterkeyhint="next"
            required
            dataCy="gateway-reset-password-password"
          />
        )}
        {!props.success && (
          <MobilePasswordField
            id="gateway-reset-password-repeat"
            label={<Text id="gatewayResetPassword.repeatPasswordLabel" />}
            placeholder={<Text id="gatewayResetPassword.passwordPlaceholder" />}
            value={props.passwordRepeat}
            onInput={props.updatePasswordRepeat}
            error={props.passwordNotMatching && <Text id="gatewayResetPassword.passwordNotMatchingLabel" />}
            autocomplete="new-password"
            enterkeyhint="go"
            required
            dataCy="gateway-reset-password-password-repeat"
          />
        )}
        {!props.success && props.twoFactorEnabled && !props.useRecoveryCode && (
          <MobileCodeField
            id="gateway-reset-password-two-factor-code"
            label={<Text id="gatewayResetPassword.twoFactorCodeLabel" />}
            placeholder={<Text id="gatewayResetPassword.twoFactorCodePlaceholder" />}
            value={props.twoFactorCode}
            onInput={props.updateTwoFactorCode}
            maxlength="6"
            enterkeyhint="go"
            dataCy="gateway-reset-password-two-factor-code"
          />
        )}
        {!props.success && props.twoFactorEnabled && props.useRecoveryCode && (
          <MobileTextField
            id="gateway-reset-password-recovery-code"
            label={<Text id="gatewayResetPassword.recoveryCodeLabel" />}
            placeholder={<Text id="gatewayResetPassword.recoveryCodePlaceholder" />}
            value={props.twoFactorRecoveryCode}
            onInput={props.updateTwoFactorRecoveryCode}
            error={props.invalidRecoveryCode && <Text id="gatewayResetPassword.invalidRecoveryCodeLabel" />}
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck={false}
            enterkeyhint="go"
            dataCy="gateway-reset-password-recovery-code"
          />
        )}
        {!props.success && props.twoFactorEnabled && (
          <MobileLostTwoFactor
            useRecoveryCode={props.useRecoveryCode}
            onUseRecoveryCode={props.showRecoveryCode}
            onUseTwoFactorCode={props.showTwoFactorCode}
            onRequestReset={props.requestTwoFactorReset}
            resetStatus={props.twoFactorResetStatus}
          />
        )}
        <div class={kitStyle.footnote}>
          <MarkupText id="resetPassword.alreadyHaveAccount" />
        </div>
        <MobileAuthBar error={barError}>
          {!props.success && (
            <BigButton
              variant="primary"
              type="submit"
              loading={props.resetInProgress}
              data-cy="gateway-reset-password-submit"
            >
              <Text id="gatewayResetPassword.resetPasswordButton" />
            </BigButton>
          )}
          {props.success && (
            <BigButton variant="primary" href="/login" data-cy="gateway-reset-password-login">
              <Text id="gatewayResetTwoFactor.loginLink" />
            </BigButton>
          )}
        </MobileAuthBar>
      </MobileAuthForm>
    </MobileAuthLayout>
  );
};

export default MobileResetPassword;
