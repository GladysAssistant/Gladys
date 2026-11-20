import { isMobileViewport } from '../../utils/mobileViewport';

/**
 * @description On a phone, a time or a date of a scene form is typed in the native field of the
 * system (the wheels of iOS, the clock of Android) instead of the desktop picker, a list of times
 * opening over the sheet (docs/specs/scene-editor-mobile.md, E.11). The value keeps the format
 * the scene stores: "HH:mm" for a time, "yyyy-MM-dd" for a date. From 768px the children — the
 * desktop picker — are rendered unchanged.
 * @param {Object} props - The props.
 * @param {string} props.type - "time" or "date".
 * @param {string} props.value - The stored value.
 * @param {Function} props.onChange - Called with the new value; a cleared field is ignored when
 * the field is not `clearable` (the desktop picker cannot be emptied either).
 * @returns {Object} The field.
 * @example
 * <PhoneNativeField type="time" value={trigger.time} onChange={this.setTime}>
 *   <DatePicker … />
 * </PhoneNativeField>
 */
const PhoneNativeField = ({ type, value, onChange, clearable, children, dataCy }) => {
  if (!isMobileViewport()) {
    return children;
  }
  const handleChange = event => {
    const newValue = event.target.value;
    if (newValue) {
      onChange(newValue);
    } else if (clearable) {
      onChange(undefined);
    }
  };
  return <input type={type} class="form-control" value={value || ''} onChange={handleChange} data-cy={dataCy} />;
};

export default PhoneNativeField;
