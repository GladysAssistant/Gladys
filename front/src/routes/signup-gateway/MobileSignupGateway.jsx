import { Text } from 'preact-i18n';

import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import {
  MobileAuthTitle,
  MobileAuthCard,
  MobileAuthForm,
  MobileAuthBar,
  MobileEmailField,
  MobileTextField
} from '../../components/auth/mobile';
import authStyle from '../../components/auth/style.css';
import { MobilePasswordField, MobileNotice, BigButton, kitStyle } from '../../components/mobile';

// What stops the creation before the form: nothing can be typed that would change it
const BLOCKING_ERRORS = [
  { prop: 'invitationError', textId: 'gatewaySignup.invalidInvitationError' },
  { prop: 'browserNotCompatible', textId: 'gatewaySignup.browserNotCompatibleError' }
];

// The refusals of the creation, shown above the button
const REQUEST_ERRORS = [
  { prop: 'accountAlreadyExist', textId: 'gatewaySignup.emailAlreadyExistError' },
  { prop: 'tokenError', textId: 'gatewaySignup.tokenError' },
  { prop: 'unknownError', textId: 'gatewaySignup.unknownError' }
];

// The keys are generated in the browser, then the account is created: the screen only waits
const GeneratingKeys = props => (
  <div class={authStyle.mobileStatus} role="status" data-cy="signup-gateway-progress">
    {!props.signupCompleted && <div class="loader" />}
    {props.signupCompleted && (
      <span class={authStyle.mobileStatusIcon} aria-hidden="true">
        <i class="fe fe-check" />
      </span>
    )}
    <h1>
      {!props.signupCompleted && <Text id="gatewaySignUp.generatingKey" />}
      {props.signupCompleted && <Text id="gatewaySignUp.mobile.completeTitle" />}
    </h1>
    {props.signupCompleted && (
      <p>
        <Text id="gatewaySignUp.mobile.completeText" />
      </p>
    )}
  </div>
);

/**
 * @description Creating a Gladys Plus account on a phone (docs/specs/mobile-pages/auth.md,
 * D.8): the three fields with their keyboard and their error next to them, the creation in the
 * bottom bar, then the wait while the keys are generated. Same props as the desktop form.
 */
const MobileSignupGateway = props => {
  const flags = { ...props, browserNotCompatible: !props.browserCompatible };
  const blocking = BLOCKING_ERRORS.find(candidate => flags[candidate.prop]);
  const requestError = REQUEST_ERRORS.find(candidate => props[candidate.prop]);
  const generating = props.currentStep === 2;
  const done = generating && props.signupCompleted;
  return (
    <MobileAuthLayout
      titleId="gatewayTwoFactorAuth.title"
      bottomBar={!generating || done}
      screen={props.currentStep}
      dataCy="signup-gateway-mobile"
    >
      {generating && <GeneratingKeys {...props} />}
      {done && (
        <MobileAuthBar>
          <BigButton variant="primary" href="/login" data-cy="signup-gateway-login">
            <Text id="gatewaySignup.signin" />
          </BigButton>
        </MobileAuthBar>
      )}
      {!generating && (
        <MobileAuthForm onSubmit={props.validateForm}>
          <MobileAuthTitle>
            <Text id="gatewaySignup.createAccount" />
          </MobileAuthTitle>
          {blocking && (
            <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="signup-gateway-blocked">
              <Text id={blocking.textId} />
            </MobileNotice>
          )}
          {!blocking && (
            <MobileAuthCard>
              <MobileTextField
                id="signup-gateway-name"
                label={<Text id="gatewaySignUp.usernameLabel" />}
                placeholder={<Text id="gatewaySignUp.usernamePlaceholder" />}
                value={props.name}
                onInput={props.updateName}
                error={props.fieldsErrored.includes('name') && <Text id="gatewaySignUp.usernameInvalid" />}
                autocomplete="name"
                autocapitalize="words"
                enterkeyhint="next"
                required
                dataCy="signup-gateway-name"
              />
              <MobileEmailField
                id="signup-gateway-email"
                label={<Text id="gatewaySignUp.emailLabel" />}
                placeholder={<Text id="gatewaySignUp.emailPlaceholder" />}
                value={props.email}
                onInput={props.updateEmail}
                error={props.fieldsErrored.includes('email') && <Text id="gatewaySignUp.emailInvalid" />}
                // the address of the invitation: it is the account, it cannot be changed here
                disabled={Boolean(props.token)}
                autocomplete="username"
                enterkeyhint="next"
                required
                dataCy="signup-gateway-email"
              />
              <MobilePasswordField
                id="signup-gateway-password"
                label={<Text id="gatewaySignUp.passwordLabel" />}
                placeholder={<Text id="gatewaySignUp.passwordPlaceholder" />}
                value={props.password}
                onInput={props.updatePassword}
                error={props.fieldsErrored.includes('password') && <Text id="gatewaySignUp.passwordInvalid" />}
                autocomplete="new-password"
                enterkeyhint="go"
                required
                dataCy="signup-gateway-password"
              />
            </MobileAuthCard>
          )}
          <div class={kitStyle.footnote}>
            <Text id="gatewaySignup.alreadyHaveAccount" />{' '}
            <a href="/login">
              <Text id="gatewaySignup.signin" />
            </a>
          </div>
          <div class={kitStyle.footnote}>
            <Text id="gatewaySignup.supportText" />
          </div>
          <MobileAuthBar error={!blocking && requestError && <Text id={requestError.textId} />}>
            {!blocking && (
              <BigButton variant="primary" type="submit" data-cy="signup-gateway-submit">
                <Text id="gatewaySignUp.createAccountButton" />
              </BigButton>
            )}
            {blocking && (
              <BigButton variant="primary" href="/login" data-cy="signup-gateway-login">
                <Text id="gatewaySignup.signin" />
              </BigButton>
            )}
          </MobileAuthBar>
        </MobileAuthForm>
      )}
    </MobileAuthLayout>
  );
};

export default MobileSignupGateway;
