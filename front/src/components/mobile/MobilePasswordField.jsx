import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import MobileField, { fieldClass } from './MobileField';

/**
 * @description A password field of a phone form (docs/specs/mobile-pages/README.md, C.3): the
 * field and its reveal button are one control, so a password typed on a small keyboard can be
 * read before it is sent. No capitals, no correction; `autocomplete` says whether the phone
 * fills the saved password ("current-password", the default) or proposes a strong one
 * ("new-password").
 *
 * revealed / onToggleReveal: when a form shows or hides several passwords together (a password
 * and its repetition); the field keeps its own state otherwise.
 * placeholder: a node (a `<Text />`). dataCy: the field's `data-cy`; its button gets
 * `${dataCy}-reveal`.
 */
class MobilePasswordField extends Component {
  state = {
    revealed: false
  };

  toggle = () => {
    if (this.props.onToggleReveal) {
      this.props.onToggleReveal();
    } else {
      this.setState(prevState => ({ revealed: !prevState.revealed }));
    }
  };

  render(
    {
      id,
      label,
      help,
      error,
      value,
      onInput,
      placeholder,
      autocomplete = 'current-password',
      enterkeyhint,
      required,
      disabled,
      onToggleReveal,
      revealed: controlledRevealed,
      dataCy
    },
    state
  ) {
    const revealed = onToggleReveal ? Boolean(controlledRevealed) : state.revealed;
    return (
      <MobileField label={label} htmlFor={id} error={error} help={help}>
        <div class={cx(fieldClass.group, { [fieldClass.groupInvalid]: error })}>
          <Localizer>
            <input
              id={id}
              type={revealed ? 'text' : 'password'}
              class={fieldClass.input}
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
          <Localizer>
            <button
              type="button"
              class={fieldClass.addon}
              onClick={this.toggle}
              aria-pressed={revealed ? 'true' : 'false'}
              aria-label={<Text id="mobileKit.togglePassword" />}
              data-cy={dataCy && `${dataCy}-reveal`}
            >
              <i class={cx('fe', revealed ? 'fe-eye-off' : 'fe-eye')} aria-hidden="true" />
            </button>
          </Localizer>
        </div>
      </MobileField>
    );
  }
}

export default MobilePasswordField;
