import { Component } from 'preact';
import { Localizer } from 'preact-i18n';
import cx from 'classnames';

import { MobileField, MobileBottomBar, fieldClass, kitStyle } from '../mobile';
import style from './style.css';

// What the forms of the logged-out pages share on a phone (docs/specs/mobile-pages/auth.md, B):
// a form that brings its first refused field into view, the bottom bar holding the action and
// its error, and the fields with the keyboard each one deserves.

/**
 * @description The title of a screen, and the sentence under it when it has one (`lead`).
 */
const MobileAuthTitle = ({ children, lead }) => (
  <div class={style.mobileHeading}>
    <h1 class={kitStyle.largeTitle}>{children}</h1>
    {lead && <p class={kitStyle.lead}>{lead}</p>}
  </div>
);

/**
 * @description The fields of a screen, on one card of frosted glass — the card of the desktop
 * page, without its title (which is the large title above it). It only holds fields and what
 * relates to them: never the bottom bar, which is fixed to the screen (a glass surface is the
 * containing block of what is fixed inside it).
 */
const MobileAuthCard = ({ children, dataCy }) => (
  <div class={cx(style.mobileFormCard, kitStyle.formCard)} data-cy={dataCy}>
    {children}
  </div>
);

/**
 * @description The form of a logged-out page on a phone. `onSubmit` is the handler of the
 * desktop form (the keyboard's key submits it too); once it ran, the first field the validation
 * refused is brought into view and focused.
 */
class MobileAuthForm extends Component {
  setFormRef = element => {
    this.form = element;
  };

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

  submit = e => {
    e.preventDefault();
    if (this.props.onSubmit) {
      this.props.onSubmit(e);
    }
    // the errors of the validation land with the next render
    setTimeout(this.revealFirstError, 0);
  };

  componentWillUnmount() {
    this.form = null;
  }

  render({ children, dataCy }) {
    return (
      <form onSubmit={this.submit} ref={this.setFormRef} novalidate data-cy={dataCy}>
        {children}
      </form>
    );
  }
}

/**
 * @description The bottom bar of a logged-out page (README C.4): the primary action of the
 * screen, and above it the refusal of its request (`error`, a node), which can be closed. A new
 * attempt shows the error again: the closed state is forgotten as soon as the error is gone.
 */
class MobileAuthBar extends Component {
  state = {
    closed: false
  };

  // once the error is gone (a new attempt is in flight), the next one is shown again
  static getDerivedStateFromProps(props, state) {
    return !props.error && state.closed ? { closed: false } : null;
  }

  close = () => this.setState({ closed: true });

  render({ error, children, dataCy }, { closed }) {
    return (
      <MobileBottomBar error={error && !closed ? error : null} onCloseError={this.close} dataCy={dataCy}>
        {children}
      </MobileBottomBar>
    );
  }
}

/**
 * @description An e-mail field: the e-mail keyboard, no capitals, no correction. `autocomplete`
 * is "username" on a sign-in form (the phone fills the saved account), "email" elsewhere.
 * placeholder: a node (a `<Text />`).
 */
const MobileEmailField = ({
  id,
  label,
  help,
  error,
  value,
  onInput,
  placeholder,
  autocomplete = 'email',
  enterkeyhint,
  disabled,
  required,
  dataCy
}) => (
  <MobileField label={label} htmlFor={id} error={error} help={help}>
    <Localizer>
      <input
        id={id}
        type="email"
        inputmode="email"
        class={cx(fieldClass.input, { [fieldClass.invalid]: error })}
        value={value || ''}
        onInput={onInput}
        placeholder={placeholder}
        autocomplete={autocomplete}
        autocapitalize="off"
        autocorrect="off"
        spellcheck={false}
        enterkeyhint={enterkeyhint}
        disabled={disabled}
        aria-required={required ? 'true' : undefined}
        aria-invalid={error ? 'true' : 'false'}
        data-cy={dataCy}
      />
    </Localizer>
  </MobileField>
);

/**
 * @description A plain text field (a name, a recovery code). Every attribute of the `<input>`
 * can be given: `autocomplete`, `autocapitalize`, `enterkeyhint`…
 */
const MobileTextField = ({ id, label, help, error, value, onInput, placeholder, required, dataCy, ...props }) => (
  <MobileField label={label} htmlFor={id} error={error} help={help}>
    <Localizer>
      <input
        id={id}
        type="text"
        class={cx(fieldClass.input, { [fieldClass.invalid]: error })}
        value={value || ''}
        onInput={onInput}
        placeholder={placeholder}
        aria-required={required ? 'true' : undefined}
        aria-invalid={error ? 'true' : 'false'}
        data-cy={dataCy}
        {...props}
      />
    </Localizer>
  </MobileField>
);

/**
 * @description The six digits of a two-factor app: the numeric keyboard, the code proposed by
 * the phone above it (`one-time-code`), digits large enough to be compared with the app.
 */
const MobileCodeField = ({ id, label, help, error, value, onInput, placeholder, autofocus, dataCy, ...props }) => (
  <MobileField label={label} htmlFor={id} error={error} help={help}>
    <Localizer>
      <input
        id={id}
        type="text"
        inputmode="numeric"
        pattern="[0-9 ]*"
        class={cx(fieldClass.input, style.mobileCode, { [fieldClass.invalid]: error })}
        value={value || ''}
        onInput={onInput}
        placeholder={placeholder}
        autocomplete="one-time-code"
        autocorrect="off"
        spellcheck={false}
        autofocus={autofocus}
        aria-invalid={error ? 'true' : 'false'}
        data-cy={dataCy}
        {...props}
      />
    </Localizer>
  </MobileField>
);

export {
  MobileAuthTitle,
  MobileAuthCard,
  MobileAuthForm,
  MobileAuthBar,
  MobileEmailField,
  MobileTextField,
  MobileCodeField
};
