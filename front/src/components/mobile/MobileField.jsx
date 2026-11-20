import cx from 'classnames';

import style from './kit.css';

/**
 * @description A labelled field of a phone form (docs/specs/mobile-pages/README.md, C.3): the
 * label above, the control (give it `fieldClass.input` / `.select` / `.textarea`), then the
 * error or the help text as a footnote. `htmlFor` ties the label to the control, and names the
 * error (`${htmlFor}-error`) so the control can point to it with `aria-describedby`.
 */
const MobileField = ({ label, help, error, htmlFor, children, class: className, ...props }) => (
  <div class={cx(style.field, className)} {...props}>
    {label && (
      <label class={style.fieldLabel} for={htmlFor}>
        {label}
      </label>
    )}
    {children}
    {error && (
      <div class={style.fieldError} role="alert" id={htmlFor ? `${htmlFor}-error` : undefined}>
        {error}
      </div>
    )}
    {help && !error && <div class={style.fieldHelp}>{help}</div>}
  </div>
);

// the classes of the controls, for the forms that render their own <input> / <select>
const fieldClass = {
  input: style.input,
  select: style.select,
  textarea: style.textarea,
  invalid: style.inputInvalid,
  group: style.inputGroup,
  groupInvalid: style.inputGroupInvalid,
  addon: style.inputAddon
};

export { fieldClass };
export default MobileField;
