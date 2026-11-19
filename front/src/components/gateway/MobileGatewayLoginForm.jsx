import { Text } from 'preact-i18n';

import { RequestStatus, LoginStatus } from '../../utils/consts';
import {
  MobileAuthTitle,
  MobileAuthCard,
  MobileAuthForm,
  MobileAuthBar,
  MobileEmailField,
  MobileTextField,
  MobileCodeField
} from '../auth/mobile';
import authStyle from '../auth/style.css';
import { MobilePasswordField, MobileNotice, BigButton } from '../mobile';
import MobileLostTwoFactor from './MobileLostTwoFactor';

const EXTERNAL_FORGOT_PASSWORD_LINK = 'https://plus.gladysassistant.com/forgot-password';

const RESET_ERRORS = {
  INSTANCE_CONNECTED: 'gatewayLogin.resetTwoFactorInstanceConnected',
  EXPIRED: 'gatewayLogin.resetTwoFactorExpired',
  TOO_MANY: 'gatewayLogin.resetTwoFactorTooMany',
  UNKNOWN: 'gatewayLogin.resetTwoFactorError'
};

// What the request answered, shown above the button: the refusal of the login first, then the
// one of the two-factor reset
const getBarError = props => {
  switch (props.gatewayLoginStatus) {
    case LoginStatus.WrongCredentialsError:
      return <Text id="gatewayLogin.wrongCredentials" />;
    case LoginStatus.UnknownError:
      return (
        <span>
          <Text id="gatewayLogin.unknownError" />
          {props.gatewayLoginError && <br />}
          {props.gatewayLoginError}
        </span>
      );
    case RequestStatus.GatewayNoInstanceFound:
      return (
        <span>
          <Text id="gatewayLogin.gatewayNoInstanceFound" />{' '}
          <a href="/dashboard/settings/billing">
            <Text id="gatewayLogin.gatewayAccessBilling" />
          </a>
        </span>
      );
    case RequestStatus.NetworkError:
      return <Text id="gatewayLogin.networkError" />;
    case RequestStatus.Error:
      return <Text id="gatewayLogin.unknownError" />;
    default:
  }
  // not while a login is in flight: the bar must see the error go, to show the next one even
  // if this one was closed
  if (
    props.gatewayLoginTwoFactorResetStatus === RequestStatus.Error &&
    props.gatewayLoginStatus !== RequestStatus.Getting
  ) {
    const errorId = RESET_ERRORS[props.gatewayLoginTwoFactorResetError];
    return errorId ? <Text id={errorId} /> : null;
  }
  return null;
};

/**
 * @description The Gladys Plus sign-in on a phone (docs/specs/mobile-pages/auth.md, D.1): the
 * account, then the code of the two-factor app or a recovery code — one question per screen,
 * the action in the bottom bar. Same props as GatewayLoginForm (the store actions and the
 * state of the login), in the shell its caller gives it.
 */
const MobileGatewayLoginForm = props => {
  const step2 = props.gatewayLoginStep2;
  const useRecoveryCode = step2 && props.gatewayLoginUseRecoveryCode;
  const useTwoFactorCode = step2 && !props.gatewayLoginUseRecoveryCode;
  const loading = props.gatewayLoginStatus === RequestStatus.Getting;
  let onSubmit = props.login;
  if (useRecoveryCode) {
    onSubmit = props.loginTwoFactorRecoveryCode;
  } else if (useTwoFactorCode) {
    onSubmit = props.loginTwoFactor;
  }
  return (
    <MobileAuthForm onSubmit={onSubmit} dataCy="gateway-login-mobile">
      <MobileAuthTitle>
        <Text id="gatewayLogin.cardTitle" />
      </MobileAuthTitle>
      {step2 && props.gatewayTwoFactorJustEnabled && (
        <MobileNotice tone="success" icon="check-circle" role="status">
          <Text id="gatewayLogin.twoFactorEnabledSuccess" />
        </MobileNotice>
      )}
      {props.gatewayLoginTwoFactorResetStatus === RequestStatus.Success && (
        <MobileNotice tone="success" icon="mail" role="status" data-cy="gateway-login-reset-sent">
          <Text id="gatewayLogin.resetTwoFactorEmailSent" />
        </MobileNotice>
      )}
      <MobileAuthCard>
        {!step2 && (
          <MobileEmailField
            id="gateway-login-email"
            label={<Text id="gatewayLogin.emailLabel" />}
            placeholder={<Text id="gatewayLogin.emailPlaceholder" />}
            value={props.gatewayLoginEmail}
            onInput={props.updateLoginEmail}
            error={props.gatewayLoginStatus === LoginStatus.WrongEmailError && <Text id="gatewayLogin.invalidEmail" />}
            autocomplete="username"
            enterkeyhint="next"
            dataCy="gateway-login-email"
          />
        )}
        {!step2 && (
          <MobilePasswordField
            id="gateway-login-password"
            label={<Text id="gatewayLogin.passwordLabel" />}
            placeholder={<Text id="gatewayLogin.passwordPlaceholder" />}
            value={props.gatewayLoginPassword}
            onInput={props.updateLoginPassword}
            autocomplete="current-password"
            enterkeyhint="go"
            dataCy="gateway-login-password"
          />
        )}
        {!step2 && (
          <div class={authStyle.mobileLinks}>
            <a
              href={props.external_forgot_password ? EXTERNAL_FORGOT_PASSWORD_LINK : '/forgot-password'}
              class={authStyle.mobileLink}
              data-cy="gateway-login-forgot-password"
            >
              <Text id="gatewayLogin.forgotPasswordLabel" />
            </a>
          </div>
        )}
        {useTwoFactorCode && (
          <MobileCodeField
            id="gateway-login-two-factor-code"
            label={<Text id="gatewayLogin.twoFactorCodeLabel" />}
            placeholder={<Text id="gatewayLogin.twoFactorCodePlaceholder" />}
            value={props.gatewayLoginTwoFactorCode}
            onInput={props.updateLoginTwoFactorCode}
            error={
              props.gatewayLoginStatus === LoginStatus.WrongTwoFactorCodeError && (
                <Text id="gatewayLogin.invalidTwoFactorCode" />
              )
            }
            maxlength="6"
            enterkeyhint="go"
            autofocus
            // six digits are sent as soon as they are typed: no other code while that one is checked
            readonly={loading}
            dataCy="gateway-login-two-factor-code"
          />
        )}
        {useRecoveryCode && (
          <MobileTextField
            id="gateway-login-recovery-code"
            label={<Text id="gatewayLogin.recoveryCodeLabel" />}
            placeholder={<Text id="gatewayLogin.recoveryCodePlaceholder" />}
            value={props.gatewayLoginRecoveryCode}
            onInput={props.updateLoginRecoveryCode}
            error={
              props.gatewayLoginStatus === LoginStatus.WrongRecoveryCodeError && (
                <Text id="gatewayLogin.invalidRecoveryCode" />
              )
            }
            autocomplete="off"
            autocapitalize="off"
            autocorrect={false}
            spellcheck={false}
            enterkeyhint="go"
            autofocus
            dataCy="gateway-login-recovery-code"
          />
        )}
      </MobileAuthCard>
      {step2 && (
        <MobileLostTwoFactor
          useRecoveryCode={useRecoveryCode}
          onUseRecoveryCode={props.showRecoveryCodeLogin}
          onUseTwoFactorCode={props.showTwoFactorCodeLogin}
          onRequestReset={props.requestTwoFactorReset}
          resetStatus={props.gatewayLoginTwoFactorResetStatus}
          help
        />
      )}
      <MobileAuthBar error={getBarError(props)}>
        <BigButton variant="primary" type="submit" loading={loading} data-cy="gateway-login-submit">
          <Text id={step2 ? 'gatewayLogin.loginTwoFactorButtonText' : 'gatewayLogin.loginButtonText'} />
        </BigButton>
      </MobileAuthBar>
    </MobileAuthForm>
  );
};

export default MobileGatewayLoginForm;
