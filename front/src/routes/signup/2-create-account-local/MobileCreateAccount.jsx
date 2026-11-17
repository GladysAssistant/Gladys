import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import withIntlAsProp from '../../../utils/withIntlAsProp';
import { MobileAuthCard } from '../../../components/auth/mobile';
import {
  MobileField,
  MobilePasswordField,
  fieldClass,
  MobileBottomBar,
  BigButton,
  kitStyle
} from '../../../components/mobile';

const LANGUAGES = [
  { value: 'en', textId: 'profile.english' },
  { value: 'fr', textId: 'profile.french' },
  { value: 'de', textId: 'profile.german' },
  { value: 'es', textId: 'profile.spanish' }
];

// The server refusals of the account creation, in the order the desktop form shows them
const SERVER_ERRORS = [
  { prop: 'networkError', textId: 'profile.networkError' },
  { prop: 'emailAlreadyExistError', textId: 'profile.emailAlreadyExistError' },
  { prop: 'selectorAlreadyExist', textId: 'profile.selectorAlreadyExistError' },
  { prop: 'instanceAlreadyConfiguredError', textId: 'profile.instanceAlreadyConfiguredError' },
  { prop: 'unknownError', textId: 'profile.unknownError' }
];

/**
 * @description The account creation on a phone (docs/specs/mobile-pages/onboarding.md, C.2): the
 * fields of the desktop form (components/user/profile.jsx) with the keyboard and the autofill
 * each one deserves, the error of a field next to it, and the creation in the bottom bar. Same
 * props as the desktop tab: the validation and the request stay in the container.
 */
class MobileCreateAccount extends Component {
  state = {
    showPassword: false,
    errorClosed: false
  };

  togglePassword = () => this.setState(prevState => ({ showPassword: !prevState.showPassword }));
  closeError = () => this.setState({ errorClosed: true });

  setFormRef = element => {
    this.form = element;
  };

  // the first field refused by the validation is brought into view: on a phone it may be a
  // screen above the button
  revealFirstError = () => {
    if (!this.form) {
      return;
    }
    const invalid = this.form.querySelector('[aria-invalid="true"]');
    if (invalid) {
      invalid.scrollIntoView({ block: 'center' });
      invalid.focus({ preventScroll: true });
    }
  };

  submit = async e => {
    if (e) {
      e.preventDefault();
    }
    this.setState({ errorClosed: false });
    await this.props.createUser();
    // the errors land with the next render
    setTimeout(this.revealFirstError, 0);
  };

  renderPasswordField({ id, labelId, errorId, value, onInput, invalid, placeholderId }) {
    return (
      <MobilePasswordField
        id={id}
        label={<Text id={labelId} />}
        error={invalid && <Text id={errorId} />}
        value={value}
        onInput={onInput}
        placeholder={<Text id={placeholderId} />}
        autocomplete="new-password"
        required
        // one button shows or hides both passwords
        revealed={this.state.showPassword}
        onToggleReveal={this.togglePassword}
        dataCy={`signup-${id}`}
      />
    );
  }

  render(props, { errorClosed }) {
    const errors = props.errors || {};
    const user = props.newUser;
    const serverError = SERVER_ERRORS.find(candidate => props[candidate.prop]);
    return (
      <form onSubmit={this.submit} ref={this.setFormRef} novalidate data-cy="signup-account-mobile">
        <h1 class={kitStyle.largeTitle}>
          <Text id="signup.createLocalAccount.title" />
        </h1>
        <p class={kitStyle.lead}>
          <Text id="signup.createLocalAccount.description" />
        </p>
        <MobileAuthCard>
          <MobileField
            label={<Text id="profile.firstnameLabel" />}
            htmlFor="firstname"
            error={errors.firstname && <Text id="profile.firstnameError" />}
          >
            <Localizer>
              <input
                id="firstname"
                type="text"
                class={cx(fieldClass.input, { [fieldClass.invalid]: errors.firstname })}
                value={user.firstname}
                onInput={props.updateFirstname}
                placeholder={<Text id="profile.firstnamePlaceholder" />}
                autocomplete="given-name"
                autocapitalize="words"
                enterkeyhint="next"
                aria-required="true"
                aria-invalid={errors.firstname ? 'true' : 'false'}
                data-cy="signup-firstname"
              />
            </Localizer>
          </MobileField>
          <MobileField
            label={<Text id="profile.lastnameLabel" />}
            htmlFor="lastname"
            error={errors.lastname && <Text id="profile.lastnameError" />}
          >
            <Localizer>
              <input
                id="lastname"
                type="text"
                class={cx(fieldClass.input, { [fieldClass.invalid]: errors.lastname })}
                value={user.lastname}
                onInput={props.updateLastname}
                placeholder={<Text id="profile.lastnamePlaceholder" />}
                autocomplete="family-name"
                autocapitalize="words"
                enterkeyhint="next"
                aria-required="true"
                aria-invalid={errors.lastname ? 'true' : 'false'}
                data-cy="signup-lastname"
              />
            </Localizer>
          </MobileField>
          <MobileField
            label={<Text id="profile.emailLabel" />}
            htmlFor="email"
            error={errors.email && <Text id="profile.emailError" />}
            help={<Text id="profile.emailText" />}
          >
            <Localizer>
              <input
                id="email"
                type="email"
                inputmode="email"
                class={cx(fieldClass.input, { [fieldClass.invalid]: errors.email })}
                value={user.email}
                onInput={props.updateEmail}
                placeholder={<Text id="profile.emailPlaceholder" />}
                autocomplete="email"
                autocapitalize="off"
                autocorrect="off"
                spellcheck={false}
                enterkeyhint="next"
                aria-required="true"
                aria-invalid={errors.email ? 'true' : 'false'}
                data-cy="signup-email"
              />
            </Localizer>
          </MobileField>
          <MobileField label={<Text id="profile.languageLabel" />} htmlFor="language">
            <select
              id="language"
              class={fieldClass.select}
              value={user.language}
              onChange={props.updateLanguage}
              data-cy="signup-language"
            >
              {LANGUAGES.map(language => (
                <option value={language.value}>{get(props.intl.dictionary, language.textId)}</option>
              ))}
            </select>
          </MobileField>
          {this.renderPasswordField({
            id: 'password',
            labelId: 'profile.passwordLabel',
            errorId: 'profile.passwordError',
            placeholderId: 'profile.passwordPlaceholder',
            value: user.password,
            onInput: props.updatePassword,
            invalid: errors.password
          })}
          {this.renderPasswordField({
            id: 'passwordRepeat',
            labelId: 'profile.passwordRepeatLabel',
            errorId: 'profile.passwordRepeatError',
            placeholderId: 'profile.passwordRepeatPlaceholder',
            value: user.passwordRepeat,
            onInput: props.updatePasswordRepeat,
            invalid: errors.passwordRepeat
          })}
        </MobileAuthCard>
        <MobileBottomBar
          error={serverError && !errorClosed ? <Text id={serverError.textId} /> : null}
          onCloseError={this.closeError}
        >
          <BigButton variant="primary" type="submit" loading={props.creating} data-cy="signup-create-account-submit">
            <Text id="signup.createLocalAccount.createAccountButton" />
          </BigButton>
        </MobileBottomBar>
      </form>
    );
  }
}

export default withIntlAsProp(MobileCreateAccount);
